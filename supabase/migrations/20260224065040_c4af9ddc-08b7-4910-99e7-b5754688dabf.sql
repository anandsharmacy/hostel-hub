
-- Add image_url column to appliance_complaints
ALTER TABLE public.appliance_complaints ADD COLUMN image_url text;

-- Create storage bucket for appliance complaint images
INSERT INTO storage.buckets (id, name, public) VALUES ('appliance-images', 'appliance-images', true);

-- Storage policies: students can upload their own images
CREATE POLICY "Students can upload appliance images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'appliance-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Anyone authenticated can view appliance images (admins/vendors need to see them)
CREATE POLICY "Authenticated users can view appliance images"
ON storage.objects FOR SELECT
USING (bucket_id = 'appliance-images' AND auth.role() = 'authenticated');

-- Students can delete their own uploads
CREATE POLICY "Students can delete own appliance images"
ON storage.objects FOR DELETE
USING (bucket_id = 'appliance-images' AND auth.uid()::text = (storage.foldername(name))[1]);
