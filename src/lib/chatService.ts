export type ChatMessage = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

async function postChat(messages: ChatMessage[], token: string) {
  return fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages }),
  });
}

export async function streamChat({
  messages,
  token,
  onDelta,
  onDone,
  onError,
}: {
  messages: ChatMessage[];
  token: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  try {
    let resp = await postChat(messages, token);

    // If token is stale/expired, refresh the Supabase session and retry once.
    if (resp.status === 401) {
      const { supabase } = await import("@/integrations/supabase/client");
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const refreshedToken = session?.access_token;
      if (refreshedToken && refreshedToken !== token) {
        resp = await postChat(messages, refreshedToken);
      } else {
        const {
          data: { session: forcedSession },
        } = await supabase.auth.refreshSession();

        const forcedToken = forcedSession?.access_token;
        if (forcedToken) {
          resp = await postChat(messages, forcedToken);
        }
      }
    }

    if (!resp.ok) {
      if (resp.status === 429) {
        onError("Rate limit exceeded. Please wait a moment and try again.");
        return;
      }
      if (resp.status === 402) {
        onError("AI credits exhausted. Please add credits to continue.");
        return;
      }
      if (resp.status === 401) {
        onError("Please log in to use the chatbot.");
        return;
      }

      // Try to parse JSON error
      try {
        const errData = await resp.json();
        onError(errData.error || "Something went wrong.");
      } catch {
        onError("Something went wrong. Please try again.");
      }
      return;
    }

    const contentType = resp.headers.get("content-type") || "";

    // Non-streaming JSON response (fallback from tool calls)
    if (contentType.includes("application/json")) {
      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content || "Done!";
      onDelta(content);
      onDone();
      return;
    }

    // SSE streaming
    if (!resp.body) {
      onError("No response body.");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as
            | string
            | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as
            | string
            | undefined;
          if (content) onDelta(content);
        } catch {
          /* ignore */
        }
      }
    }

    onDone();
  } catch (err) {
    console.error("Chat stream error:", err);
    onError("Network error. Please check your connection.");
  }
}
