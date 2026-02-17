-- Security Fix: Prevent Privilege Escalation in User Roles
-- This migration adds a trigger to enforce approval logic on the user_roles table.

-- Create a function to enforce role approval policy
CREATE OR REPLACE FUNCTION public.enforce_role_approval_policy()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Block 'super_user' assignment
  -- This reinforces the existing validation, but good to have here as well.
  IF NEW.role = 'super_user' THEN
     RAISE EXCEPTION 'Cannot self-assign super_user role.';
  END IF;

  -- 2. Force 'admin' and 'vendor' roles to be unapproved
  -- Regardless of what the user sends (approved: true), we force it to false.
  IF NEW.role IN ('admin', 'vendor') THEN
    NEW.approved := false;
  END IF;

  -- 3. Force 'student' role to be approved (auto-approval)
  IF NEW.role = 'student' THEN
    NEW.approved := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if it exists (to be safe/idempotent)
DROP TRIGGER IF EXISTS enforce_role_approval_policy_trigger ON public.user_roles;

-- Create the trigger
CREATE TRIGGER enforce_role_approval_policy_trigger
BEFORE INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_role_approval_policy();
