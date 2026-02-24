
-- Add target_audience column
ALTER TABLE public.announcements
  ADD COLUMN target_audience text NOT NULL DEFAULT 'students';

-- Admin INSERT policy
CREATE POLICY "Admins can insert announcements"
  ON public.announcements FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin UPDATE policy
CREATE POLICY "Admins can update own announcements"
  ON public.announcements FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = vendor_id);

-- Admin DELETE policy
CREATE POLICY "Admins can delete own announcements"
  ON public.announcements FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = vendor_id);

-- Update student SELECT to filter by audience
DROP POLICY IF EXISTS "Students can view active announcements" ON public.announcements;
CREATE POLICY "Students can view active announcements"
  ON public.announcements FOR SELECT
  USING (
    has_role(auth.uid(), 'student'::app_role)
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (target_audience IN ('students', 'both'))
  );

-- Add vendor SELECT for targeted announcements
CREATE POLICY "Vendors can view targeted announcements"
  ON public.announcements FOR SELECT
  USING (
    has_role(auth.uid(), 'vendor'::app_role)
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (target_audience IN ('vendors', 'both'))
  );
