import type { Tables } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';

const DEVICE_CONTROL_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/device-control`;

export type RoomGateway = Tables<'room_gateways'>;
export type RoomDevice = Tables<'room_devices'>;

/** Auto-provision gateway + devices for the authenticated student's room via RPC. */
export async function provisionRoomControls(): Promise<{ provisioned: boolean; reason?: string }> {
  const { data, error } = await supabase.rpc('provision_room_controls');
  if (error) throw new Error(error.message);
  return data as unknown as { provisioned: boolean; reason?: string };
}

/** Load gateway and devices directly from Supabase tables (uses RLS). */
export async function getRoomControls(hostelBlock: string, roomNumber: string): Promise<{ gateway: RoomGateway | null; devices: RoomDevice[] }> {
  const { data: gateway, error: gwError } = await supabase
    .from('room_gateways')
    .select('*')
    .eq('hostel_block', hostelBlock)
    .eq('room_number', roomNumber)
    .maybeSingle();

  if (gwError) throw new Error(gwError.message);

  if (!gateway) {
    return { gateway: null, devices: [] };
  }

  const { data: devices, error: devError } = await supabase
    .from('room_devices')
    .select('*')
    .eq('gateway_id', gateway.id)
    .order('relay_pin', { ascending: true });

  if (devError) throw new Error(devError.message);

  return { gateway, devices: devices || [] };
}

/** Toggle a device via the edge function (calls Sinric Pro server-side). */
export async function toggleRoomDevice({
  token,
  roomDeviceId,
  powerState,
}: {
  token: string;
  roomDeviceId: string;
  powerState: boolean;
}) {
  const response = await fetch(DEVICE_CONTROL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ roomDeviceId, powerState }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || 'Failed to update device state');
  }

  return payload;
}
