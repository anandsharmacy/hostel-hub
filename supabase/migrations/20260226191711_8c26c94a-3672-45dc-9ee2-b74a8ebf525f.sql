
-- Create laundry_orders table
CREATE TABLE public.laundry_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  student_name TEXT NOT NULL,
  sap_id TEXT NOT NULL,
  hostel_block TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  cleaning_type TEXT NOT NULL DEFAULT 'wash_only',
  status TEXT NOT NULL DEFAULT 'checked_in',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  checked_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  checked_out_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.laundry_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can insert own laundry orders" ON public.laundry_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can view own laundry orders" ON public.laundry_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all laundry orders" ON public.laundry_orders
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Vendors can view all laundry orders" ON public.laundry_orders
  FOR SELECT USING (has_role(auth.uid(), 'vendor'::app_role));

CREATE POLICY "Admins can update laundry orders" ON public.laundry_orders
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Vendors can update laundry orders" ON public.laundry_orders
  FOR UPDATE USING (has_role(auth.uid(), 'vendor'::app_role));

CREATE POLICY "Anyone authenticated can view laundry orders" ON public.laundry_orders
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "No laundry order deletions" ON public.laundry_orders
  FOR DELETE USING (false);

-- Create laundry_order_items table
CREATE TABLE public.laundry_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.laundry_orders(id) ON DELETE CASCADE,
  cloth_type TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  is_special BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.laundry_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view laundry items" ON public.laundry_order_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone authenticated can insert laundry items" ON public.laundry_order_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "No laundry item deletions" ON public.laundry_order_items
  FOR DELETE USING (false);

-- Create laundry_settings table
CREATE TABLE public.laundry_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  revenue_pin TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.laundry_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own laundry settings" ON public.laundry_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own laundry settings" ON public.laundry_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own laundry settings" ON public.laundry_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime for laundry_orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.laundry_orders;
