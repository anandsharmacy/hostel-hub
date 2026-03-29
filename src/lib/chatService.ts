export type ChatMessage = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

/** Decode JWT payload segment (base64url). Plain atob() fails on Supabase JWTs. */
function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return null;
    const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded)) as { exp?: number };
  } catch {
    return null;
  }
}

function decodeJwtExpiry(token: string): number | null {
  const payload = decodeJwtPayload(token);
  return typeof payload?.exp === "number" ? payload.exp : null;
}

/** Refresh if missing exp, expired, or within the window of expiry. */
function shouldRefreshAccessToken(token: string, withinSeconds = 60): boolean {
  const exp = decodeJwtExpiry(token);
  if (exp === null) return true;
  const now = Math.floor(Date.now() / 1000);
  return exp <= now + withinSeconds;
}

/** User JWT when signed in; otherwise anon key so the chat edge function allows guest mode. */
async function getChatAuthBearer(): Promise<string | null> {
  const userToken = await resolveActiveToken();
  if (userToken) return userToken;
  const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  return anon?.trim() || null;
}

/**
 * Always resolves the bearer token from the Supabase client session (canonical),
 * never from React state. Refreshes when missing, stale, expired, or unreadable.
 */
async function resolveActiveToken(): Promise<string | null> {
  const { supabase } = await import("@/integrations/supabase/client");

  const {
    data: { session },
  } = await supabase.auth.getSession();
  let token = session?.access_token ?? null;

  if (!token) {
    const {
      data: { session: refreshedSession },
    } = await supabase.auth.refreshSession();
    token = refreshedSession?.access_token ?? null;
  }

  if (!token) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const {
      data: { session: retriedSession },
    } = await supabase.auth.getSession();
    token = retriedSession?.access_token ?? null;
  }

  if (!token) return null;

  if (shouldRefreshAccessToken(token)) {
    const {
      data: { session: refreshedSession },
    } = await supabase.auth.refreshSession();
    token = refreshedSession?.access_token ?? token;
  }

  return token;
}

async function postChat(messages: ChatMessage[], bearer: string) {
  const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  return fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${bearer}`,
      ...(apikey ? { apikey } : {}),
    },
    body: JSON.stringify({ messages }),
  });
}

export async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: ChatMessage[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  try {
    const bearer = await getChatAuthBearer();
    if (!bearer) {
      onError("Chat is temporarily unavailable.");
      return;
    }

    let resp = await postChat(messages, bearer);

    if (resp.status === 401) {
      const { supabase } = await import("@/integrations/supabase/client");
      await supabase.auth.refreshSession();
      const retryBearer = await getChatAuthBearer();
      if (retryBearer) {
        resp = await postChat(messages, retryBearer);
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
        onError("Unable to verify your session. Please try again.");
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
