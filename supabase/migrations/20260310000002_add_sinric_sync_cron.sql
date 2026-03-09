-- Enable pg_net if not already active (needed to call edge functions from SQL)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Postgres function that calls the sinric-sync edge function via pg_net
CREATE OR REPLACE FUNCTION public.trigger_sinric_sync()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_supabase_url text;
  v_anon_key text;
  v_sync_secret text;
BEGIN
  -- Read from vault or fall back to hardcoded values.
  -- In production, store these in Supabase Vault secrets.
  v_supabase_url  := current_setting('app.settings.supabase_url',  true);
  v_anon_key      := current_setting('app.settings.anon_key',      true);
  v_sync_secret   := current_setting('app.settings.room_controls_sync_secret', true);

  IF v_supabase_url IS NULL OR v_anon_key IS NULL OR v_sync_secret IS NULL THEN
    RAISE NOTICE 'Sinric sync skipped: app.settings not configured. Set supabase_url, anon_key, room_controls_sync_secret in project custom config or Vault.';
    RETURN;
  END IF;

  PERFORM extensions.http_post(
    url     := v_supabase_url || '/functions/v1/sinric-sync',
    headers := jsonb_build_object(
      'Content-Type',              'application/json',
      'apikey',                    v_anon_key,
      'x-room-controls-secret',   v_sync_secret
    ),
    body    := '{}'::jsonb
  );
END;
$$;

-- Schedule: call trigger_sinric_sync() every 30 seconds
-- Requires the pg_cron extension (enabled by default on Supabase Pro plans).
-- On free tier, you can use an external cron service instead.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'sinric-sync-poll',
      '30 seconds',
      $cron$ SELECT public.trigger_sinric_sync(); $cron$
    );
    RAISE NOTICE 'pg_cron job sinric-sync-poll scheduled.';
  ELSE
    RAISE NOTICE 'pg_cron not available. Use an external cron to POST to /functions/v1/sinric-sync every 30s.';
  END IF;
END;
$$;
