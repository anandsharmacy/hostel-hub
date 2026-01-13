-- Remove the INSERT policy that allows users to self-assign roles (security risk)
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

-- Add policy to prevent any updates to user_roles (roles are immutable after creation)
CREATE POLICY "No role updates allowed"
  ON public.user_roles FOR UPDATE
  USING (false);

-- Add policy to prevent any deletions from user_roles
CREATE POLICY "No role deletions allowed"
  ON public.user_roles FOR DELETE
  USING (false);

-- Add admin-only INSERT policy for user_roles
-- During signup, the application should use a service role to insert roles
CREATE POLICY "Service role can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (true);

-- Prevent deletions on profiles (users shouldn't delete their profiles)
CREATE POLICY "No profile deletions allowed"
  ON public.profiles FOR DELETE
  USING (false);

-- Prevent deletions on cleaning_requests (maintain audit trail)
CREATE POLICY "No cleaning request deletions allowed"
  ON public.cleaning_requests FOR DELETE
  USING (false);

-- Prevent deletions on appliance_complaints (maintain audit trail)
CREATE POLICY "No appliance complaint deletions allowed"
  ON public.appliance_complaints FOR DELETE
  USING (false);

-- Prevent deletions on store_orders (maintain transaction records)
CREATE POLICY "No store order deletions allowed"
  ON public.store_orders FOR DELETE
  USING (false);