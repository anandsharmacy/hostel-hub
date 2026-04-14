import { corsHeaders, withCors } from "../_shared/cors.ts";
import { requireSupabaseAuth } from "../_shared/auth.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const auth = await requireSupabaseAuth(request);
    const body = await request.json().catch(() => ({}));

    return withCors(
      Response.json({
        success: true,
        userId: auth.userId,
        role: auth.role,
        message: "Tool executor auth passed. Replace with your real execution logic.",
        payload: body,
      }),
    );
  } catch (error) {
    return withCors(
      Response.json(
        {
          success: false,
          errorMessage: "Invalid JWT",
          details: String(error),
        },
        { status: 401 },
      ),
    );
  }
});
