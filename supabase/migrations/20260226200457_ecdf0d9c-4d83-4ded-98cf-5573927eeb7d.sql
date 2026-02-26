
-- Create laundry_vendor_orders table
CREATE TABLE public.laundry_vendor_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  student_name text NOT NULL,
  sap_id text NOT NULL,
  hostel_block text NOT NULL,
  contact_number text NOT NULL,
  cleaning_type text NOT NULL DEFAULT 'wash_only',
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'checked_in',
  checked_in_at timestamp with time zone NOT NULL DEFAULT now(),
  checked_out_at timestamp with time zone
);

ALTER TABLE public.laundry_vendor_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Laundry owners can insert vendor orders"
  ON public.laundry_vendor_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'laundry'::app_role));

CREATE POLICY "Laundry owners can view vendor orders"
  ON public.laundry_vendor_orders FOR SELECT
  USING (has_role(auth.uid(), 'laundry'::app_role));

CREATE POLICY "Laundry owners can update vendor orders"
  ON public.laundry_vendor_orders FOR UPDATE
  USING (has_role(auth.uid(), 'laundry'::app_role));

CREATE POLICY "No vendor order deletions"
  ON public.laundry_vendor_orders FOR DELETE
  USING (false);

-- Create laundry_vendor_order_items table
CREATE TABLE public.laundry_vendor_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.laundry_vendor_orders(id) ON DELETE CASCADE,
  cloth_type text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  is_special boolean NOT NULL DEFAULT false
);

ALTER TABLE public.laundry_vendor_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Laundry owners can insert vendor order items"
  ON public.laundry_vendor_order_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'laundry'::app_role));

CREATE POLICY "Laundry owners can view vendor order items"
  ON public.laundry_vendor_order_items FOR SELECT
  USING (has_role(auth.uid(), 'laundry'::app_role));

CREATE POLICY "No vendor order item deletions"
  ON public.laundry_vendor_order_items FOR DELETE
  USING (false);
