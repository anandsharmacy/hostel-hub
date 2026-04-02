import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-room-controls-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SINRIC_API_KEY = Deno.env.get("SINRIC_API_KEY");
const SINRIC_CLIENT_ID = Deno.env.get("SINRIC_CLIENT_ID") || "nmims-hostel-portal";
const ROOM_CONTROLS_SYNC_SECRET = Deno.env.get("ROOM_CONTROLS_SYNC_SECRET") || "69ceb90817b32c0941e1ddb1";

const DEFAULT_GATEWAY_NAME = "Gateway NodeMCU-1";
const PLACEHOLDER_DEVICE_ID = "xxxxxxxxxxxxxxxxxxxxxxxx";

const DEFAULT_DEVICES = [
  {
    slug: "main-room-light",
    name: "Main Room Light",
    applianceType: "light",
    sinricDeviceId: null as string | null,
    relayPin: 5,
    relayLabel: "D1",
    switchPin: "SD3",
    powerRatingWatts: 15,
  },
  {
    slug: "study-lamp",
    name: "Study Lamp",
    applianceType: "lamp",
    sinricDeviceId: null as string | null,
    relayPin: 4,
    relayLabel: "D2",
    switchPin: "D3",
    powerRatingWatts: 15,
  },
  {
    slug: "ceiling-fan",
    name: "Ceiling Fan",
    applianceType: "fan",
    sinricDeviceId: null as string | null,
    relayPin: 14,
    relayLabel: "D5",
    switchPin: "D7",
    powerRatingWatts: 10,
  },
  {
    slug: "wall-socket",
    name: "Wall Socket",
    applianceType: "outlet",
    sinricDeviceId: null as string | null,
    relayPin: 12,
    relayLabel: "D6",
    switchPin: "RX",
    powerRatingWatts: 15,
  },
];

type Profile = {
  user_id: string;
  full_name: string;
  hostel_block: string | null;
  room_number: string | null;
};

type RoomDeviceRow = {
  id: string;
  gateway_id: string;
  hostel_block: string;
  room_number: string;
  slug: string;
  name: string;
  appliance_type: string;
  sinric_device_id: string | null;
  relay_pin: number;
  relay_label: string;
  switch_pin: string;
  power_rating_watts: number;
  power_state: boolean;
  last_event_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type SinricActionResponse = {
  success?: boolean;
  message?: string;
  raw?: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getAuthedUser(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return { user: null, profile: null, supabase: null };

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { user: null, profile: null, supabase: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, full_name, hostel_block, room_number")
    .eq("user_id", user.id)
    .maybeSingle();

  return { user, profile: profile as Profile | null, supabase };
}

async function ensureRoomProvisioned(
  supabase: ReturnType<typeof createClient>,
  hostelBlock: string,
  roomNumber: string,
) {
  const { data: existingGateway, error: gatewayLookupError } = await supabase
    .from("room_gateways")
    .select("*")
    .eq("hostel_block", hostelBlock)
    .eq("room_number", roomNumber)
    .maybeSingle();

  if (gatewayLookupError) throw gatewayLookupError;

  let gateway = existingGateway;

  if (!gateway) {
    const { data: insertedGateway, error: insertGatewayError } = await supabase
      .from("room_gateways")
      .insert({
        hostel_block: hostelBlock,
        room_number: roomNumber,
        name: DEFAULT_GATEWAY_NAME,
        connection_state: "offline",
        metadata: { source: "auto-provisioned" },
      })
      .select("*")
      .single();

    if (insertGatewayError) throw insertGatewayError;
    gateway = insertedGateway;
  }

  const { data: existingDevices, error: devicesError } = await supabase
    .from("room_devices")
    .select("*")
    .eq("gateway_id", gateway.id)
    .order("relay_pin", { ascending: true });

  if (devicesError) throw devicesError;

  if (!existingDevices || existingDevices.length === 0) {
    const { error: insertDevicesError } = await supabase.from("room_devices").insert(
      DEFAULT_DEVICES.map((device) => ({
        gateway_id: gateway.id,
        hostel_block: hostelBlock,
        room_number: roomNumber,
        slug: device.slug,
        name: device.name,
        appliance_type: device.applianceType,
        sinric_device_id: device.sinricDeviceId,
        relay_pin: device.relayPin,
        relay_label: device.relayLabel,
        switch_pin: device.switchPin,
        power_rating_watts: device.powerRatingWatts,
        metadata: { model: "NodeMCU-Relay" },
      })),
    );

    if (insertDevicesError) throw insertDevicesError;
  }

  const [{ data: freshGateway, error: freshGatewayError }, { data: freshDevices, error: freshDevicesError }] = await Promise.all([
    supabase
      .from("room_gateways")
      .select("*")
      .eq("id", gateway.id)
      .single(),
    supabase
      .from("room_devices")
      .select("*")
      .eq("gateway_id", gateway.id)
      .order("relay_pin", { ascending: true }),
  ]);

  if (freshGatewayError) throw freshGatewayError;
  if (freshDevicesError) throw freshDevicesError;

  return { gateway: freshGateway, devices: (freshDevices || []) as RoomDeviceRow[] };
}

async function getSinricAccessToken() {
  if (!SINRIC_API_KEY) {
    throw new Error("SINRIC_API_KEY is not configured");
  }

  const response = await fetch("https://api.sinric.pro/api/v1/auth", {
    method: "POST",
    headers: {
      "x-sinric-api-key": SINRIC_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ client_id: SINRIC_CLIENT_ID }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to authenticate with Sinric: ${response.status} ${message}`);
  }

  const payload = await response.json();
  if (!payload.accessToken) {
    throw new Error("Sinric auth response did not include an access token");
  }

  return payload.accessToken as string;
}

async function sendPowerState(deviceId: string, powerState: boolean) {
  const accessToken = await getSinricAccessToken();
  const query = new URLSearchParams({
    clientId: SINRIC_CLIENT_ID,
    type: "request",
    createdAt: `${Date.now()}`,
    action: "setPowerState",
    value: JSON.stringify({ state: powerState ? "On" : "Off" }),
  });

  const response = await fetch(`https://api.sinric.pro/api/v1/devices/${deviceId}/action?${query.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const text = await response.text();
  let payload: SinricActionResponse | null = null;
  try {
    payload = JSON.parse(text) as SinricActionResponse;
  } catch {
    payload = { raw: text };
  }

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || `Sinric action failed with ${response.status}`);
  }

  return payload;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method === "PUT") {
      const secret = req.headers.get("x-room-controls-secret") || "";
      if (!ROOM_CONTROLS_SYNC_SECRET || secret !== ROOM_CONTROLS_SYNC_SECRET) {
        return jsonResponse({ error: "Unauthorized sync request" }, 401);
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const body = await req.json();
      const { sinricDeviceId, powerState, connectionState, lastSeen, message, source = "sinric-event" } = body;

      const { data: device, error: deviceError } = await supabase
        .from("room_devices")
        .select("id, gateway_id")
        .eq("sinric_device_id", sinricDeviceId)
        .maybeSingle();

      if (deviceError) throw deviceError;
      if (!device) return jsonResponse({ error: "Device not found" }, 404);

      const updates: Record<string, unknown> = {};
      if (typeof powerState === "boolean") {
        updates.power_state = powerState;
        updates.last_event_at = lastSeen || new Date().toISOString();
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateDeviceError } = await supabase
          .from("room_devices")
          .update(updates)
          .eq("id", device.id);

        if (updateDeviceError) throw updateDeviceError;
      }

      const gatewayUpdates: Record<string, unknown> = {};
      if (connectionState) gatewayUpdates.connection_state = connectionState;
      if (lastSeen) gatewayUpdates.last_seen = lastSeen;
      if (Object.keys(gatewayUpdates).length > 0) {
        const { error: gatewayUpdateError } = await supabase
          .from("room_gateways")
          .update(gatewayUpdates)
          .eq("id", device.gateway_id);

        if (gatewayUpdateError) throw gatewayUpdateError;
      }

      const { error: logError } = await supabase.from("room_device_logs").insert({
        room_device_id: device.id,
        source,
        action: "sync",
        reported_state: typeof powerState === "boolean" ? powerState : null,
        message: message || null,
      });

      if (logError) throw logError;

      return jsonResponse({ success: true });
    }

    const { user, profile, supabase } = await getAuthedUser(req);
    if (!user || !profile || !supabase) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    if (!profile.hostel_block || !profile.room_number) {
      return jsonResponse({ error: "Hostel block or room number is missing from the student profile" }, 400);
    }

    const provisioned = await ensureRoomProvisioned(supabase, profile.hostel_block, profile.room_number);

    if (req.method === "GET") {
      return jsonResponse({
        gateway: provisioned.gateway,
        devices: provisioned.devices,
      });
    }

    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const body = await req.json();
    const { roomDeviceId, powerState } = body;

    if (!roomDeviceId || typeof powerState !== "boolean") {
      return jsonResponse({ error: "roomDeviceId and powerState are required" }, 400);
    }

    const device = provisioned.devices.find((item) => item.id === roomDeviceId);
    if (!device) {
      return jsonResponse({ error: "Device not found for this room" }, 404);
    }

    if (!device.sinric_device_id) {
      return jsonResponse({ error: "This device does not have a Sinric Pro device ID configured yet" }, 400);
    }

    const result = await sendPowerState(device.sinric_device_id, powerState);

    const now = new Date().toISOString();
    const { error: deviceUpdateError } = await supabase
      .from("room_devices")
      .update({
        power_state: powerState,
        last_event_at: now,
      })
      .eq("id", device.id);

    if (deviceUpdateError) throw deviceUpdateError;

    const { error: gatewayUpdateError } = await supabase
      .from("room_gateways")
      .update({
        connection_state: "online",
        last_seen: now,
      })
      .eq("id", device.gateway_id);

    if (gatewayUpdateError) throw gatewayUpdateError;

    const { error: logError } = await supabase.from("room_device_logs").insert({
      room_device_id: device.id,
      user_id: user.id,
      source: "web",
      action: "setPowerState",
      requested_state: powerState,
      reported_state: powerState,
      message: result?.message || null,
    });

    if (logError) throw logError;

    return jsonResponse({ success: true, result });
  } catch (error) {
    console.error("device-control error", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
