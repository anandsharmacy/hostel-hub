-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Service role can insert roles" ON public.user_roles;

-- Create a more restrictive INSERT policy that only allows users to insert their own role
-- This prevents one user from inserting a role for another user
CREATE POLICY "Users can insert own role during signup"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);