-- Fix 1: Change approved column default to FALSE for defense-in-depth
ALTER TABLE public.user_roles ALTER COLUMN approved SET DEFAULT false;

-- Fix 2: Add RLS policy to restrict approval_requests SELECT to only super_users
-- First, drop the existing policy that allows users to view their own approval request
DROP POLICY IF EXISTS "Users can view own approval request" ON public.approval_requests;

-- Fix 3: Add database constraint to prevent super_user self-assignment during signup
-- We use a trigger instead of CHECK constraint to allow flexibility for legitimate super_user creation
CREATE OR REPLACE FUNCTION public.validate_user_role_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent users from self-assigning super_user role
  -- super_user can only be assigned by existing super_users or through direct database access
  IF NEW.role = 'super_user' AND auth.uid() = NEW.user_id THEN
    RAISE EXCEPTION 'Cannot self-assign super_user role. Contact an administrator.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to validate role insertions
DROP TRIGGER IF EXISTS validate_user_role_insert_trigger ON public.user_roles;
CREATE TRIGGER validate_user_role_insert_trigger
BEFORE INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.validate_user_role_insert();