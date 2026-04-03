import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * sinric-sync — Polls Sinric Pro dashboard for device power states and
 * connection status, then writes changes back to Supabase so the Room
 * Controls UI stays in sync with physical switch events on the NodeMCU.
 *
 * Trigger this function periodically (e.g. every 30s via external cron,
 * pg_cron + pg_net, or a GitHub Action schedule).
 *
 * Auth: requires the x-room-controls-secret header to match the
 * ROOM_CONTROLS_SYNC_SECRET env var (shared secret, not user JWT).
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-room-controls-secret",
};

const SUPABASE_URL = "https://zvbhaehxojklmzylpjri.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2YmhhZWh4b2prbG16eWxwanJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgxNTI2NSwiZXhwIjoyMDg4MzkxMjY1fQ.0xrOHuy_ldfhwr9MIPoBPz7EcEBx2D8lZ82vu0N2nUo";
const SINRIC_API_KEY = "cbce26a2-0037-431a-80ab-59441f73bb66";
const SINRIC_APP_SECRET = "52775ca0-878a-4ff6-bc9c-b293d9a70634-70cb2377-235f-4740-a4fc-cdf9ddb1c63a";
const ROOM_CONTROLS_SYNC_SECRET = "69ceb972db0f6e0b15abfe5d";

type SinricDevice = {
  id: string;
  name: string;
  powerState?: string;
  isOnline?: boolean;
};

type SinricDashboardResponse = {
  devices?: SinricDevice[];
  success?: boolean;
  message?: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function fetchSinricDevices(): Promise<SinricDevice[]> {
  if (!SINRIC_API_KEY) throw new Error("SINRIC_API_KEY not configured");

  const res = await fetch("https://api.sinric.pro/api/v1/devices", {
    headers: {
      "X-SINRIC-API-KEY": SINRIC_API_KEY,
    },
  });

  if (!res.ok) {
    throw new Error(`Sinric devices fetch failed: ${res.status} ${await res.text()}`);
  }

  const payload: SinricDashboardResponse = await res.json();
  return payload.devices || [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Shared-secret auth (not tied to any user session)
  const secret = req.headers.get("x-room-controls-secret") || "";
  if (!ROOM_CONTROLS_SYNC_SECRET || secret !== ROOM_CONTROLS_SYNC_SECRET) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  try {
    const sinricDevices = await fetchSinricDevices();

    if (sinricDevices.length === 0) {
      return jsonResponse({ synced: 0, message: "No devices on Sinric account" });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Build a map: sinric_device_id -> { powerState, isOnline }
    const sinricMap = new Map<string, { powerState: boolean; isOnline: boolean }>();
    for (const sd of sinricDevices) {
      sinricMap.set(sd.id, {
        powerState: sd.powerState === "On",
        isOnline: sd.isOnline ?? false,
      });
    }

    // Fetch all room_devices that have a configured sinric_device_id
    const sinricIds = [...sinricMap.keys()];
    const { data: dbDevices, error: dbError } = await supabase
      .from("room_devices")
      .select("id, gateway_id, sinric_device_id, power_state")
      .in("sinric_device_id", sinricIds);

    if (dbError) throw dbError;
    if (!dbDevices || dbDevices.length === 0) {
      return jsonResponse({ synced: 0, message: "No matching devices in database" });
    }

    let synced = 0;
    const now = new Date().toISOString();
    const gatewayIds = new Set<string>();

    for (const dbDev of dbDevices) {
      const sinricState = sinricMap.get(dbDev.sinric_device_id!);
      if (!sinricState) continue;

      gatewayIds.add(dbDev.gateway_id);

      // Only update if power_state differs
      if (dbDev.power_state !== sinricState.powerState) {
        const { error: updateError } = await supabase
          .from("room_devices")
          .update({ power_state: sinricState.powerState, last_event_at: now })
          .eq("id", dbDev.id);

        if (updateError) {
          console.error(`Failed to sync device ${dbDev.id}:`, updateError);
          continue;
        }

        // Log the sync
        await supabase.from("room_device_logs").insert({
          room_device_id: dbDev.id,
          source: "sinric-poll",
          action: "sync",
          reported_state: sinricState.powerState,
          message: `Polled from Sinric dashboard`,
        });

        synced++;
      }
    }

    // Update gateway connection state + last_seen for all affected gateways
    // We consider the gateway online if at least one of its devices is online on Sinric
    for (const gwId of gatewayIds) {
      const gwDevices = dbDevices.filter((d) => d.gateway_id === gwId);
      const anyOnline = gwDevices.some((d) => sinricMap.get(d.sinric_device_id!)?.isOnline);

      await supabase
        .from("room_gateways")
        .update({
          connection_state: anyOnline ? "online" : "offline",
          last_seen: anyOnline ? now : undefined,
        })
        .eq("id", gwId);
    }

    return jsonResponse({ synced, total: dbDevices.length, timestamp: now });
  } catch (error) {
    console.error("sinric-sync error:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500,
    );
  }
});
