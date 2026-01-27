-- Create announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Vendors can create announcements
CREATE POLICY "Vendors can insert announcements"
ON public.announcements FOR INSERT
WITH CHECK (has_role(auth.uid(), 'vendor'));

-- Vendors can view their own announcements
CREATE POLICY "Vendors can view own announcements"
ON public.announcements FOR SELECT
USING (has_role(auth.uid(), 'vendor') AND auth.uid() = vendor_id);

-- Vendors can update their own announcements
CREATE POLICY "Vendors can update own announcements"
ON public.announcements FOR UPDATE
USING (has_role(auth.uid(), 'vendor') AND auth.uid() = vendor_id);

-- Vendors can delete their own announcements
CREATE POLICY "Vendors can delete own announcements"
ON public.announcements FOR DELETE
USING (has_role(auth.uid(), 'vendor') AND auth.uid() = vendor_id);

-- Students can view active announcements
CREATE POLICY "Students can view active announcements"
ON public.announcements FOR SELECT
USING (
  has_role(auth.uid(), 'student') 
  AND is_active = true 
  AND (expires_at IS NULL OR expires_at > now())
);

-- Admins can view all announcements
CREATE POLICY "Admins can view all announcements"
ON public.announcements FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at column
ALTER TABLE public.announcements ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();