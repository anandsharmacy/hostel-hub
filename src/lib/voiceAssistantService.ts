import { supabase } from "@/integrations/supabase/client";

const VOICE_API_URL = import.meta.env.VITE_VOICE_API_URL || "http://localhost:8000";

export interface VoiceTokenResponse {
  token: string;
  url: string;
  room_name: string;
}

export interface StartSessionResponse {
  success: boolean;
  token: string;
  url: string;
  room_name: string;
  user_id: string;
  user_role: string;
  language: string;
}

/**
 * Resolve the active Supabase JWT token for backend authentication.
 */
async function resolveActiveToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  let token = session?.access_token ?? null;

  if (!token) {
    const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
    token = refreshedSession?.access_token ?? null;
  }

  return token;
}

/**
 * Start a new voice session by calling the FastAPI backend.
 */
export async function startVoiceSession(language: string = "en", voice_gender: string = "female"): Promise<StartSessionResponse> {
  const token = await resolveActiveToken();
  if (!token) {
    throw new Error("No active session found. Please sign in.");
  }

  const response = await fetch(`${VOICE_API_URL}/api/voice/start-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      room_name: "auto_generated", // Backend will generate a unique one
      language,
      voice_gender,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Failed to start voice session" }));
    throw new Error(errorData.detail || "Failed to start voice session");
  }

  return response.json();
}

/**
 * End a voice session.
 */
export async function endVoiceSession(roomName: string): Promise<{ success: boolean }> {
  const token = await resolveActiveToken();
  if (!token) return { success: false };

  const response = await fetch(`${VOICE_API_URL}/api/voice/end-session?room_name=${roomName}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}
