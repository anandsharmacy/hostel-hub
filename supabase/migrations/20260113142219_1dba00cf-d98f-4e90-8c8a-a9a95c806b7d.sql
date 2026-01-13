-- Create cleaning_requests table
CREATE TABLE public.cleaning_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  student_name TEXT NOT NULL,
  hostel_block TEXT NOT NULL,
  room_number TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appliance_complaints table
CREATE TABLE public.appliance_complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  student_name TEXT NOT NULL,
  hostel_block TEXT NOT NULL,
  room_number TEXT NOT NULL,
  appliance TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create store_orders table
CREATE TABLE public.store_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  student_name TEXT NOT NULL,
  hostel_block TEXT NOT NULL,
  room_number TEXT NOT NULL,
  category TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.cleaning_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appliance_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;

-- Cleaning Requests RLS Policies
-- Students can view their own requests
CREATE POLICY "Students can view own cleaning requests"
  ON public.cleaning_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all cleaning requests
CREATE POLICY "Admins can view all cleaning requests"
  ON public.cleaning_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Students can insert their own requests
CREATE POLICY "Students can insert cleaning requests"
  ON public.cleaning_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'student'));

-- Admins can update cleaning request status
CREATE POLICY "Admins can update cleaning requests"
  ON public.cleaning_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Appliance Complaints RLS Policies
-- Students can view their own complaints
CREATE POLICY "Students can view own appliance complaints"
  ON public.appliance_complaints FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all complaints
CREATE POLICY "Admins can view all appliance complaints"
  ON public.appliance_complaints FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Students can insert their own complaints
CREATE POLICY "Students can insert appliance complaints"
  ON public.appliance_complaints FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'student'));

-- Admins can update complaint status
CREATE POLICY "Admins can update appliance complaints"
  ON public.appliance_complaints FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Store Orders RLS Policies
-- Students can view their own orders
CREATE POLICY "Students can view own store orders"
  ON public.store_orders FOR SELECT
  USING (auth.uid() = user_id);

-- Vendors can view all store orders
CREATE POLICY "Vendors can view all store orders"
  ON public.store_orders FOR SELECT
  USING (public.has_role(auth.uid(), 'vendor'));

-- Admins can view all store orders
CREATE POLICY "Admins can view all store orders"
  ON public.store_orders FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Students can insert their own orders
CREATE POLICY "Students can insert store orders"
  ON public.store_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'student'));

-- Vendors can update order status
CREATE POLICY "Vendors can update store orders"
  ON public.store_orders FOR UPDATE
  USING (public.has_role(auth.uid(), 'vendor'));

-- Add triggers for updated_at
CREATE TRIGGER update_cleaning_requests_updated_at
  BEFORE UPDATE ON public.cleaning_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appliance_complaints_updated_at
  BEFORE UPDATE ON public.appliance_complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_store_orders_updated_at
  BEFORE UPDATE ON public.store_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();