-- Create table to store blocked cleaning time slots
CREATE TABLE public.blocked_cleaning_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocked_date DATE NOT NULL,
  blocked_time_slot TEXT NOT NULL,
  reason TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocked_date, blocked_time_slot)
);

-- Enable Row Level Security
ALTER TABLE public.blocked_cleaning_slots ENABLE ROW LEVEL SECURITY;

-- Anyone can view blocked slots (needed for filtering in student form)
CREATE POLICY "Anyone can view blocked slots"
ON public.blocked_cleaning_slots
FOR SELECT
USING (true);

-- Only admins can insert blocked slots
CREATE POLICY "Admins can insert blocked slots"
ON public.blocked_cleaning_slots
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete blocked slots
CREATE POLICY "Admins can delete blocked slots"
ON public.blocked_cleaning_slots
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update blocked slots
CREATE POLICY "Admins can update blocked slots"
ON public.blocked_cleaning_slots
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));