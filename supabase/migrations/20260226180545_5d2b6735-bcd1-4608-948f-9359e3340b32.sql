
-- Create salon_chairs table
CREATE TABLE public.salon_chairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_block text NOT NULL,
  chair_number integer NOT NULL,
  barber_id uuid,
  barber_name text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (hostel_block, chair_number)
);

-- Create salon_queue table
CREATE TABLE public.salon_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chair_id uuid NOT NULL REFERENCES public.salon_chairs(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  student_name text NOT NULL,
  position integer NOT NULL,
  status text NOT NULL DEFAULT 'waiting',
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.salon_chairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salon_queue ENABLE ROW LEVEL SECURITY;

-- salon_chairs RLS policies
CREATE POLICY "Anyone authenticated can view salon chairs"
ON public.salon_chairs FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Barbers can update salon chairs"
ON public.salon_chairs FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'barber'));

-- salon_queue RLS policies
CREATE POLICY "Anyone authenticated can view salon queue"
ON public.salon_queue FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Students can join queue"
ON public.salon_queue FOR INSERT TO authenticated
WITH CHECK (auth.uid() = student_id AND public.has_role(auth.uid(), 'student'));

CREATE POLICY "Barbers can update queue entries"
ON public.salon_queue FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'barber'));

CREATE POLICY "Students can leave own waiting queue entry"
ON public.salon_queue FOR DELETE TO authenticated
USING (auth.uid() = student_id AND status = 'waiting');

CREATE POLICY "Barbers can delete queue entries"
ON public.salon_queue FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'barber'));

-- Seed 12 chairs (4 hostels x 3 chairs)
INSERT INTO public.salon_chairs (hostel_block, chair_number) VALUES
  ('Hostel B1', 1), ('Hostel B1', 2), ('Hostel B1', 3),
  ('Hostel B2', 1), ('Hostel B2', 2), ('Hostel B2', 3),
  ('Hostel G1', 1), ('Hostel G1', 2), ('Hostel G1', 3),
  ('Hostel G2', 1), ('Hostel G2', 2), ('Hostel G2', 3);

-- Trigger for updated_at on salon_chairs
CREATE TRIGGER update_salon_chairs_updated_at
BEFORE UPDATE ON public.salon_chairs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.salon_chairs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.salon_queue;
