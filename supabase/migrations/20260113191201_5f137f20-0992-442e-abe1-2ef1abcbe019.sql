-- Add 'approved' column to user_roles table for admin/vendor approval tracking
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT true;

-- Create a table to track approval requests with additional info
CREATE TABLE IF NOT EXISTS public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  role TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Enable RLS on approval_requests
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

-- Super users can view all approval requests
CREATE POLICY "Super users can view all approval requests"
ON public.approval_requests
FOR SELECT
USING (has_role(auth.uid(), 'super_user'::app_role));

-- Super users can update approval requests
CREATE POLICY "Super users can update approval requests"
ON public.approval_requests
FOR UPDATE
USING (has_role(auth.uid(), 'super_user'::app_role));

-- Users can insert their own approval request
CREATE POLICY "Users can insert own approval request"
ON public.approval_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own approval request
CREATE POLICY "Users can view own approval request"
ON public.approval_requests
FOR SELECT
USING (auth.uid() = user_id);

-- No deletions allowed
CREATE POLICY "No approval request deletions"
ON public.approval_requests
FOR DELETE
USING (false);

-- Super users can update user_roles approval status
CREATE POLICY "Super users can update role approval"
ON public.user_roles
FOR UPDATE
USING (has_role(auth.uid(), 'super_user'::app_role));

-- Super users can view all user roles
CREATE POLICY "Super users can view all roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'super_user'::app_role));