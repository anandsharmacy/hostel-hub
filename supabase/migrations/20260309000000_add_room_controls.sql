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
