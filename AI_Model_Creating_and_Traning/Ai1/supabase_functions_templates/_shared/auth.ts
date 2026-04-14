import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("SB_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
  "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing SUPABASE_URL or publishable/anon key in function secrets");
}

export interface AuthContext {
  token: string;
  userId: string;
  email: string | null;
  role: string;
  issuer: string | null;
  audience: string | string[] | null;
  projectRef: string | null;
  configuredProjectRef: string | null;
}

function getProjectRefFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    return host.split(".", 1)[0] || null;
  } catch {
    return null;
  }
}

function decodeBase64Url(value: string): string {
  let normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  while (normalized.length % 4) normalized += "=";
  return atob(normalized);
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const segments = token.split(".");
  if (segments.length < 2) {
    throw new Error("Malformed JWT");
  }
  const payloadText = decodeBase64Url(segments[1]);
  return JSON.parse(payloadText) as Record<string, unknown>;
}

export function getBearerToken(request: Request): string {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!authHeader) {
    throw new Error("Missing Authorization header");
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new Error("Authorization header must be 'Bearer <token>'");
  }

  return token.trim();
}

export async function requireSupabaseAuth(request: Request): Promise<AuthContext> {
  const token = getBearerToken(request);

  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) {
    throw new Error(`Invalid JWT: ${error?.message ?? "No user returned"}`);
  }

  const payload = decodeJwtPayload(token);
  const issuer = (payload.iss as string | undefined) ?? null;
  const audience = (payload.aud as string | string[] | undefined) ?? null;
  const tokenRole = (payload.role as string | undefined) ?? "authenticated";
  const configuredProjectRef = getProjectRefFromUrl(SUPABASE_URL);
  const tokenProjectRef = getProjectRefFromUrl(issuer);

  if (configuredProjectRef && tokenProjectRef && configuredProjectRef !== tokenProjectRef) {
    throw new Error(
      `Token project mismatch: token_ref=${tokenProjectRef}, expected_ref=${configuredProjectRef}`,
    );
  }

  return {
    token,
    userId: data.user.id,
    email: data.user.email ?? null,
    role: tokenRole,
    issuer,
    audience,
    projectRef: tokenProjectRef,
    configuredProjectRef,
  };
}
