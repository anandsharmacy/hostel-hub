-- RPC function: provision_room_controls
-- Called by the client to ensure gateway + device rows exist for the student's room.
-- Runs with SECURITY DEFINER so the caller doesn't need INSERT/UPDATE privileges.

CREATE OR REPLACE FUNCTION public.provision_room_controls()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_hostel_block text;
  v_room_number text;
  v_gateway_id uuid;
BEGIN
  -- Resolve the calling user's profile
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT hostel_block, room_number
    INTO v_hostel_block, v_room_number
    FROM public.profiles
   WHERE user_id = v_user_id;

  IF v_hostel_block IS NULL OR v_room_number IS NULL THEN
    RETURN jsonb_build_object('provisioned', false, 'reason', 'Profile missing hostel_block or room_number');
  END IF;

  -- Upsert gateway
  INSERT INTO public.room_gateways (hostel_block, room_number, name, connection_state, metadata)
  VALUES (v_hostel_block, v_room_number, 'Gateway NodeMCU-1', 'offline', '{"source":"auto-provisioned"}'::jsonb)
  ON CONFLICT (hostel_block, room_number) DO NOTHING
  RETURNING id INTO v_gateway_id;

  IF v_gateway_id IS NULL THEN
    SELECT id INTO v_gateway_id
      FROM public.room_gateways
     WHERE hostel_block = v_hostel_block AND room_number = v_room_number;
  END IF;

  -- Upsert default devices (sinric_device_id left NULL — configured per-room by admin or setup script)
  INSERT INTO public.room_devices (gateway_id, hostel_block, room_number, slug, name, appliance_type, relay_pin, relay_label, switch_pin, power_rating_watts, metadata)
  VALUES
    (v_gateway_id, v_hostel_block, v_room_number, 'main-room-light', 'Main Room Light', 'light', 5, 'D1', 'SD3', 15, '{"model":"NodeMCU-Relay"}'::jsonb),
    (v_gateway_id, v_hostel_block, v_room_number, 'study-lamp',      'Study Lamp',      'lamp',  4, 'D2', 'D3',  15, '{"model":"NodeMCU-Relay"}'::jsonb),
    (v_gateway_id, v_hostel_block, v_room_number, 'ceiling-fan',     'Ceiling Fan',     'fan',  14, 'D5', 'D7',  10, '{"model":"NodeMCU-Relay"}'::jsonb),
    (v_gateway_id, v_hostel_block, v_room_number, 'wall-socket',     'Wall Socket',     'outlet',12, 'D6', 'RX',  15, '{"model":"NodeMCU-Relay"}'::jsonb)
  ON CONFLICT (gateway_id, slug) DO NOTHING;

  RETURN jsonb_build_object('provisioned', true, 'gateway_id', v_gateway_id);
END;
$$;
