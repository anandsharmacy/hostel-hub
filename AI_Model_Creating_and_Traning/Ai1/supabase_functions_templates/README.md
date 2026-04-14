# Supabase Edge Function JWT Fix Templates

These templates fix `401 Invalid JWT` for `voice-router` and `tool-executor` when your Supabase project uses JWT signing keys.

## What Is Included

- `_shared/auth.ts`: Bearer token parsing + Supabase Auth verification via `auth.getUser(token)`.
- `_shared/cors.ts`: CORS helpers.
- `voice-router/index.ts`: Drop-in authenticated function skeleton.
- `tool-executor/index.ts`: Drop-in authenticated function skeleton.

## Why This Works

- Uses Supabase Auth API to validate JWT, compatible with signing keys.
- Avoids legacy HS256-only assumptions.
- Detects project mismatch (token from one Supabase project sent to another project's function).

## Deploy Steps

1. In your Supabase functions repo, copy files preserving paths:

- `supabase/functions/_shared/auth.ts`
- `supabase/functions/_shared/cors.ts`
- `supabase/functions/voice-router/index.ts`
- `supabase/functions/tool-executor/index.ts`

2. Set required secrets (project-specific):

```bash
supabase secrets set SUPABASE_URL="https://<project_ref>.supabase.co"
supabase secrets set SUPABASE_ANON_KEY="<anon_or_publishable_key>"
```

3. Deploy:

```bash
supabase functions deploy voice-router
supabase functions deploy tool-executor
```

## Validation Checklist

1. Login in Flutter and obtain a fresh session.
2. Trigger voice command in app.
3. Verify functions logs show authenticated `userId`.
4. If 401 persists, inspect error details:

- `Missing Authorization header`: header not forwarded.
- `Authorization header must be 'Bearer <token>'`: malformed bearer value.
- `Invalid JWT`: expired token or wrong project.
- `Token project mismatch`: app and functions point to different Supabase project refs.

## Notes

- Replace placeholder success responses with your existing routing/execution logic.
- Keep auth verification at top of each function.
- Do not log raw JWT tokens in production.
