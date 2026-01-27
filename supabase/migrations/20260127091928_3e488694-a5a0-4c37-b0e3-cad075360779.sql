-- Create medicine_requests table
CREATE TABLE public.medicine_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  student_name TEXT NOT NULL,
  hostel_block TEXT NOT NULL,
  room_number TEXT NOT NULL,
  medicine_name TEXT,
  prescription_url TEXT,
  notes TEXT,
  receipt_number TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medicine_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Students can insert medicine requests"
  ON public.medicine_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'student'));

CREATE POLICY "Students can view own medicine requests"
  ON public.medicine_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Vendors can view all medicine requests"
  ON public.medicine_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'vendor'));

CREATE POLICY "Vendors can update medicine requests"
  ON public.medicine_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'vendor'));

CREATE POLICY "Admins can view all medicine requests"
  ON public.medicine_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "No medicine request deletions allowed"
  ON public.medicine_requests FOR DELETE
  USING (false);

-- Create function to generate receipt number for medicine requests
CREATE OR REPLACE FUNCTION public.generate_medicine_receipt_number()
RETURNS TRIGGER AS $$
DECLARE
  new_receipt_number TEXT;
BEGIN
  new_receipt_number := 'MED-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
    LPAD(
      (SELECT COALESCE(
        (SELECT COUNT(*) + 1 FROM public.medicine_requests 
         WHERE DATE(created_at) = DATE(NOW())), 
        1
      )::TEXT), 
      4, '0'
    );
  
  NEW.receipt_number := new_receipt_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for auto-generating receipt number
CREATE TRIGGER generate_medicine_receipt_number_trigger
BEFORE INSERT ON public.medicine_requests
FOR EACH ROW
EXECUTE FUNCTION public.generate_medicine_receipt_number();

-- Create storage bucket for prescriptions
INSERT INTO storage.buckets (id, name, public) VALUES ('prescriptions', 'prescriptions', false);

-- Storage policies for prescriptions bucket
CREATE POLICY "Students can upload prescriptions"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'prescriptions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Students can view own prescriptions"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'prescriptions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Vendors can view all prescriptions"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'prescriptions' AND public.has_role(auth.uid(), 'vendor'));

CREATE POLICY "Admins can view all prescriptions"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'prescriptions' AND public.has_role(auth.uid(), 'admin'));