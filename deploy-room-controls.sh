#!/bin/bash
# deploy-room-controls.sh
# One-shot script to apply all Room Controls migrations and deploy edge functions.
# Run from the project root: ./deploy-room-controls.sh
#
# Prerequisites:
#   1. supabase CLI installed (brew install supabase/tap/supabase)
#   2. supabase login (authenticate with your access token)
#   3. Project linked: supabase link --project-ref zvbhaehxojklmzylpjri
#   4. Set env: export SUPABASE_DB_PASSWORD="<your-db-password>"

set -euo pipefail

PROJECT_REF="zvbhaehxojklmzylpjri"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"

echo "=== 1/4  Pushing database migrations ==="
supabase db push

echo ""
echo "=== 2/4  Deploying device-control edge function ==="
supabase functions deploy device-control --no-verify-jwt

echo ""
echo "=== 3/4  Deploying sinric-sync edge function ==="
supabase functions deploy sinric-sync --no-verify-jwt

echo ""
echo "=== 4/4  Setting secrets ==="
echo "You need to set these secrets for the edge functions to work:"
echo ""
echo "  supabase secrets set SINRIC_API_KEY=<your-sinric-api-key>"
echo "  supabase secrets set ROOM_CONTROLS_SYNC_SECRET=<any-random-string>"
echo ""
echo "Optional (defaults exist):"
echo "  supabase secrets set SINRIC_CLIENT_ID=nmims-hostel-portal"
echo ""

echo "=== Done! ==="
echo ""
echo "Next steps:"
echo "  1. Log into Supabase Dashboard → SQL Editor"
echo "  2. Configure Sinric device IDs for your demo room:"
echo ""
echo "     SELECT configure_room_sinric_devices("
echo "       'YOUR_HOSTEL_BLOCK',"
echo "       'YOUR_ROOM_NUMBER',"
echo "       '["
echo '         {"slug":"study-lamp",      "sinric_device_id":"60764ab82fb4f14a3bedebfc"},'
echo '         {"slug":"ceiling-fan",     "sinric_device_id":"60764ac948ccc14a4674c049"},'
echo '         {"slug":"wall-socket",     "sinric_device_id":"60764aa148ccc14a4674c047"},'
echo '         {"slug":"main-room-light", "sinric_device_id":"REPLACE_WITH_REAL_ID"}'
echo "       ]'::jsonb"
echo "     );"
echo ""
echo "  3. Test the sinric-sync endpoint:"
echo "     curl -X POST ${SUPABASE_URL}/functions/v1/sinric-sync \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -H 'x-room-controls-secret: <your-sync-secret>' \\"
echo "       -H 'apikey: <your-anon-key>'"
