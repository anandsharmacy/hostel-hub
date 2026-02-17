-- Ensure prescriptions bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('prescriptions', 'prescriptions', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Ensure RLS is enabled
-- (Storage buckets usually have RLS enabled by default via the storage.objects table policies, 
-- but we need to make sure the policies we defined previously are actually applied or re-apply them if missing)

-- We will re-create the policies to be safe, dropping them first to avoid errors.
-- Note: Policy names must be unique per table.

DROP POLICY IF EXISTS "Students can upload prescriptions" ON storage.objects;
CREATE POLICY "Students can upload prescriptions"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'prescriptions' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Students can view own prescriptions" ON storage.objects;
CREATE POLICY "Students can view own prescriptions"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'prescriptions' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Vendors can view all prescriptions" ON storage.objects;
CREATE POLICY "Vendors can view all prescriptions"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'prescriptions' AND public.has_role(auth.uid(), 'vendor'));

DROP POLICY IF EXISTS "Admins can view all prescriptions" ON storage.objects;
CREATE POLICY "Admins can view all prescriptions"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'prescriptions' AND public.has_role(auth.uid(), 'admin'));
