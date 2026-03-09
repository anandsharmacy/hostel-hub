CREATE TABLE public.room_gateways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_block text NOT NULL,
  room_number text NOT NULL,
  name text NOT NULL DEFAULT 'Gateway NodeMCU-1',
  connection_state text NOT NULL DEFAULT 'offline',
  last_seen timestamp with time zone,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (hostel_block, room_number)
);

CREATE TABLE public.room_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_id uuid NOT NULL REFERENCES public.room_gateways(id) ON DELETE CASCADE,
  hostel_block text NOT NULL,
  room_number text NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  appliance_type text NOT NULL,
  sinric_device_id text,
  relay_pin integer NOT NULL,
  relay_label text NOT NULL,
  switch_pin text NOT NULL,
  power_rating_watts integer NOT NULL DEFAULT 0,
  power_state boolean NOT NULL DEFAULT false,
  last_event_at timestamp with time zone,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (gateway_id, slug)
);

CREATE TABLE public.room_device_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_device_id uuid NOT NULL REFERENCES public.room_devices(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source text NOT NULL,
  action text NOT NULL,
  requested_state boolean,
  reported_state boolean,
  message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.room_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_device_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own room gateways"
ON public.room_gateways FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'super_user')
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.hostel_block = room_gateways.hostel_block
      AND p.room_number = room_gateways.room_number
  )
);

CREATE POLICY "Students can view own room devices"
ON public.room_devices FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'super_user')
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.hostel_block = room_devices.hostel_block
      AND p.room_number = room_devices.room_number
  )
);

CREATE POLICY "Students can view own room device logs"
ON public.room_device_logs FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'super_user')
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1
    FROM public.room_devices d
    JOIN public.profiles p
      ON p.user_id = auth.uid()
     AND p.hostel_block = d.hostel_block
     AND p.room_number = d.room_number
    WHERE d.id = room_device_logs.room_device_id
  )
);

CREATE TRIGGER update_room_gateways_updated_at
BEFORE UPDATE ON public.room_gateways
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_room_devices_updated_at
BEFORE UPDATE ON public.room_devices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Service-role INSERT/UPDATE policies (used by edge function & RPC SECURITY DEFINER)
CREATE POLICY "Service role manages gateways"
ON public.room_gateways FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages devices"
ON public.room_devices FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages device logs"
ON public.room_device_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.room_gateways;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_devices;
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
-- Seed: Configure Sinric device IDs for the demo room
-- This migration sets the actual Sinric Pro device IDs for whatever
-- hostel_block + room_number is used during the demo.
-- It runs AFTER provision_room_controls() has created the skeleton rows.
-- For additional rooms, duplicate this pattern with the correct device IDs.

-- Helper function to assign Sinric device IDs by slug for a given room.
CREATE OR REPLACE FUNCTION public.configure_room_sinric_devices(
  p_hostel_block text,
  p_room_number text,
  p_devices jsonb  -- array of { "slug": "...", "sinric_device_id": "..." }
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item jsonb;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_devices)
  LOOP
    UPDATE public.room_devices
       SET sinric_device_id = v_item ->> 'sinric_device_id'
     WHERE hostel_block = p_hostel_block
       AND room_number  = p_room_number
       AND slug         = v_item ->> 'slug';
  END LOOP;
END;
$$;
