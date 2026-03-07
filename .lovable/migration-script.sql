-- ============================================================
-- COMPLETE SQL MIGRATION SCRIPT
-- Target: https://zvbhaehxojklmzylpjri.supabase.co
-- Generated from Lovable Cloud project schema
-- Run this in your Supabase SQL Editor in ONE go
-- ============================================================

-- 1. ENUM TYPE
CREATE TYPE public.app_role AS ENUM ('student', 'admin', 'vendor', 'super_user', 'barber', 'laundry');

-- 2. TABLES

-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  sap_id text,
  room_number text,
  hostel_block text,
  gender text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- user_roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- approval_requests
CREATE TABLE public.approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  requested_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  approved_by uuid
);
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

-- cleaning_requests
CREATE TABLE public.cleaning_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  student_name text NOT NULL,
  hostel_block text NOT NULL,
  room_number text NOT NULL,
  preferred_date date NOT NULL,
  preferred_time text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  availability_start text,
  availability_end text,
  expected_arrival_start text,
  expected_arrival_end text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cleaning_requests ENABLE ROW LEVEL SECURITY;

-- blocked_cleaning_slots
CREATE TABLE public.blocked_cleaning_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocked_date date NOT NULL,
  blocked_time_slot text NOT NULL,
  created_by uuid NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.blocked_cleaning_slots ENABLE ROW LEVEL SECURITY;

-- appliance_complaints
CREATE TABLE public.appliance_complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  student_name text NOT NULL,
  hostel_block text NOT NULL,
  room_number text NOT NULL,
  appliance text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.appliance_complaints ENABLE ROW LEVEL SECURITY;

-- inventory_items
CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  hostel_section text NOT NULL DEFAULT 'boys',
  quantity integer NOT NULL DEFAULT 0,
  price numeric NOT NULL,
  low_stock_threshold integer NOT NULL DEFAULT 5,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- store_orders
CREATE TABLE public.store_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  student_name text NOT NULL,
  hostel_block text NOT NULL,
  room_number text NOT NULL,
  category text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  receipt_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;

-- medicine_requests
CREATE TABLE public.medicine_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  student_name text NOT NULL,
  hostel_block text NOT NULL,
  room_number text NOT NULL,
  medicine_name text,
  prescription_url text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  receipt_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.medicine_requests ENABLE ROW LEVEL SECURITY;

-- salon_chairs
CREATE TABLE public.salon_chairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_block text NOT NULL,
  chair_number integer NOT NULL,
  barber_id uuid,
  barber_name text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.salon_chairs ENABLE ROW LEVEL SECURITY;

-- salon_queue
CREATE TABLE public.salon_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chair_id uuid NOT NULL REFERENCES public.salon_chairs(id),
  student_id uuid NOT NULL,
  student_name text NOT NULL,
  position integer NOT NULL,
  status text NOT NULL DEFAULT 'waiting',
  joined_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE public.salon_queue ENABLE ROW LEVEL SECURITY;

-- restock_history
CREATE TABLE public.restock_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.inventory_items(id),
  previous_quantity integer NOT NULL,
  new_quantity integer NOT NULL,
  restocked_by uuid NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.restock_history ENABLE ROW LEVEL SECURITY;

-- announcements
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  target_audience text NOT NULL DEFAULT 'students',
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- laundry_orders
CREATE TABLE public.laundry_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  student_name text NOT NULL,
  sap_id text NOT NULL,
  hostel_block text NOT NULL,
  contact_number text NOT NULL,
  cleaning_type text NOT NULL DEFAULT 'wash_only',
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'checked_in',
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  checked_out_at timestamptz
);
ALTER TABLE public.laundry_orders ENABLE ROW LEVEL SECURITY;

-- laundry_order_items
CREATE TABLE public.laundry_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.laundry_orders(id),
  cloth_type text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  is_special boolean NOT NULL DEFAULT false
);
ALTER TABLE public.laundry_order_items ENABLE ROW LEVEL SECURITY;

-- laundry_vendor_orders
CREATE TABLE public.laundry_vendor_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  student_name text NOT NULL,
  sap_id text NOT NULL,
  hostel_block text NOT NULL,
  contact_number text NOT NULL,
  cleaning_type text NOT NULL DEFAULT 'wash_only',
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'checked_in',
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  checked_out_at timestamptz
);
ALTER TABLE public.laundry_vendor_orders ENABLE ROW LEVEL SECURITY;

-- laundry_vendor_order_items
CREATE TABLE public.laundry_vendor_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.laundry_vendor_orders(id),
  cloth_type text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  is_special boolean NOT NULL DEFAULT false
);
ALTER TABLE public.laundry_vendor_order_items ENABLE ROW LEVEL SECURITY;

-- laundry_settings
CREATE TABLE public.laundry_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  revenue_pin text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.laundry_settings ENABLE ROW LEVEL SECURITY;

-- 3. FUNCTIONS

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.validate_user_role_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'super_user' AND auth.uid() = NEW.user_id THEN
    RAISE EXCEPTION 'Cannot self-assign super_user role. Contact an administrator.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_receipt_number TEXT;
BEGIN
  new_receipt_number := 'RCP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
    LPAD(
      (SELECT COALESCE(
        (SELECT COUNT(*) + 1 FROM public.store_orders 
         WHERE DATE(created_at) = DATE(NOW())), 
        1
      )::TEXT), 
      4, '0'
    );
  NEW.receipt_number := new_receipt_number;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_medicine_receipt_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_receipt_number TEXT;
BEGIN
  new_receipt_number := 'MED-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
    LPAD(
      (SELECT COALESCE(
        (SELECT COUNT(*) + 1 FROM public.medicine_requests 
         WHERE DATE(created_at) = DATE(NOW())), 
        1
      )::TEXT), 
      4, '0'
    );
  NEW.receipt_number := new_receipt_number;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 4. TRIGGERS

CREATE TRIGGER validate_user_role_before_insert
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.validate_user_role_insert();

CREATE TRIGGER generate_store_receipt
  BEFORE INSERT ON public.store_orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_receipt_number();

CREATE TRIGGER generate_medicine_receipt
  BEFORE INSERT ON public.medicine_requests
  FOR EACH ROW EXECUTE FUNCTION public.generate_medicine_receipt_number();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cleaning_requests_updated_at
  BEFORE UPDATE ON public.cleaning_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appliance_complaints_updated_at
  BEFORE UPDATE ON public.appliance_complaints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_store_orders_updated_at
  BEFORE UPDATE ON public.store_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medicine_requests_updated_at
  BEFORE UPDATE ON public.medicine_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_salon_chairs_updated_at
  BEFORE UPDATE ON public.salon_chairs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. RLS POLICIES

-- profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "No profile deletions allowed" ON public.profiles FOR DELETE USING (false);

-- user_roles
CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Super users can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'super_user'));
CREATE POLICY "Users can insert own role during signup" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "No role deletions allowed" ON public.user_roles FOR DELETE USING (false);
CREATE POLICY "No role updates allowed" ON public.user_roles FOR UPDATE USING (false);
CREATE POLICY "Super users can update role approval" ON public.user_roles FOR UPDATE USING (has_role(auth.uid(), 'super_user'));

-- approval_requests
CREATE POLICY "Users can insert own approval request" ON public.approval_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Super users can view all approval requests" ON public.approval_requests FOR SELECT USING (has_role(auth.uid(), 'super_user'));
CREATE POLICY "Super users can update approval requests" ON public.approval_requests FOR UPDATE USING (has_role(auth.uid(), 'super_user'));
CREATE POLICY "No approval request deletions" ON public.approval_requests FOR DELETE USING (false);

-- cleaning_requests
CREATE POLICY "Students can insert cleaning requests" ON public.cleaning_requests FOR INSERT WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'student'));
CREATE POLICY "Students can view own cleaning requests" ON public.cleaning_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all cleaning requests" ON public.cleaning_requests FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update cleaning requests" ON public.cleaning_requests FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "No cleaning request deletions allowed" ON public.cleaning_requests FOR DELETE USING (false);

-- blocked_cleaning_slots
CREATE POLICY "Anyone can view blocked slots" ON public.blocked_cleaning_slots FOR SELECT USING (true);
CREATE POLICY "Admins can insert blocked slots" ON public.blocked_cleaning_slots FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update blocked slots" ON public.blocked_cleaning_slots FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete blocked slots" ON public.blocked_cleaning_slots FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- appliance_complaints
CREATE POLICY "Students can insert appliance complaints" ON public.appliance_complaints FOR INSERT WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'student'));
CREATE POLICY "Students can view own appliance complaints" ON public.appliance_complaints FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all appliance complaints" ON public.appliance_complaints FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update appliance complaints" ON public.appliance_complaints FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "No appliance complaint deletions allowed" ON public.appliance_complaints FOR DELETE USING (false);

-- inventory_items
CREATE POLICY "Anyone can view inventory items" ON public.inventory_items FOR SELECT USING (true);
CREATE POLICY "Vendors can insert inventory items" ON public.inventory_items FOR INSERT WITH CHECK (has_role(auth.uid(), 'vendor'));
CREATE POLICY "Vendors can update inventory items" ON public.inventory_items FOR UPDATE USING (has_role(auth.uid(), 'vendor'));
CREATE POLICY "Vendors can delete inventory items" ON public.inventory_items FOR DELETE USING (has_role(auth.uid(), 'vendor'));
CREATE POLICY "Admins can manage inventory" ON public.inventory_items FOR ALL USING (has_role(auth.uid(), 'admin'));

-- store_orders
CREATE POLICY "Students can insert store orders" ON public.store_orders FOR INSERT WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'student'));
CREATE POLICY "Students can view own store orders" ON public.store_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all store orders" ON public.store_orders FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Vendors can view all store orders" ON public.store_orders FOR SELECT USING (has_role(auth.uid(), 'vendor'));
CREATE POLICY "Vendors can update store orders" ON public.store_orders FOR UPDATE USING (has_role(auth.uid(), 'vendor'));
CREATE POLICY "No store order deletions allowed" ON public.store_orders FOR DELETE USING (false);

-- medicine_requests
CREATE POLICY "Students can insert medicine requests" ON public.medicine_requests FOR INSERT WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'student'));
CREATE POLICY "Students can view own medicine requests" ON public.medicine_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all medicine requests" ON public.medicine_requests FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Vendors can view all medicine requests" ON public.medicine_requests FOR SELECT USING (has_role(auth.uid(), 'vendor'));
CREATE POLICY "Vendors can update medicine requests" ON public.medicine_requests FOR UPDATE USING (has_role(auth.uid(), 'vendor'));
CREATE POLICY "No medicine request deletions allowed" ON public.medicine_requests FOR DELETE USING (false);

-- salon_chairs
CREATE POLICY "Anyone authenticated can view salon chairs" ON public.salon_chairs FOR SELECT USING (true);
CREATE POLICY "Barbers can update salon chairs" ON public.salon_chairs FOR UPDATE USING (has_role(auth.uid(), 'barber'));

-- salon_queue
CREATE POLICY "Anyone authenticated can view salon queue" ON public.salon_queue FOR SELECT USING (true);
CREATE POLICY "Students can join queue" ON public.salon_queue FOR INSERT WITH CHECK (auth.uid() = student_id AND has_role(auth.uid(), 'student'));
CREATE POLICY "Students can leave own waiting queue entry" ON public.salon_queue FOR DELETE USING (auth.uid() = student_id AND status = 'waiting');
CREATE POLICY "Barbers can update queue entries" ON public.salon_queue FOR UPDATE USING (has_role(auth.uid(), 'barber'));
CREATE POLICY "Barbers can delete queue entries" ON public.salon_queue FOR DELETE USING (has_role(auth.uid(), 'barber'));

-- restock_history
CREATE POLICY "Vendors can insert restock history" ON public.restock_history FOR INSERT WITH CHECK (has_role(auth.uid(), 'vendor'));
CREATE POLICY "Vendors can view restock history" ON public.restock_history FOR SELECT USING (has_role(auth.uid(), 'vendor'));
CREATE POLICY "Admins can view restock history" ON public.restock_history FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "No restock history deletions" ON public.restock_history FOR DELETE USING (false);

-- announcements
CREATE POLICY "Vendors can insert announcements" ON public.announcements FOR INSERT WITH CHECK (has_role(auth.uid(), 'vendor'));
CREATE POLICY "Vendors can view own announcements" ON public.announcements FOR SELECT USING (has_role(auth.uid(), 'vendor') AND auth.uid() = vendor_id);
CREATE POLICY "Vendors can update own announcements" ON public.announcements FOR UPDATE USING (has_role(auth.uid(), 'vendor') AND auth.uid() = vendor_id);
CREATE POLICY "Vendors can delete own announcements" ON public.announcements FOR DELETE USING (has_role(auth.uid(), 'vendor') AND auth.uid() = vendor_id);
CREATE POLICY "Vendors can view targeted announcements" ON public.announcements FOR SELECT USING (has_role(auth.uid(), 'vendor') AND is_active = true AND (expires_at IS NULL OR expires_at > now()) AND target_audience IN ('vendors', 'both'));
CREATE POLICY "Admins can insert announcements" ON public.announcements FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all announcements" ON public.announcements FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update own announcements" ON public.announcements FOR UPDATE USING (has_role(auth.uid(), 'admin') AND auth.uid() = vendor_id);
CREATE POLICY "Admins can delete own announcements" ON public.announcements FOR DELETE USING (has_role(auth.uid(), 'admin') AND auth.uid() = vendor_id);
CREATE POLICY "Students can view active announcements" ON public.announcements FOR SELECT USING (has_role(auth.uid(), 'student') AND is_active = true AND (expires_at IS NULL OR expires_at > now()) AND target_audience IN ('students', 'both'));

-- laundry_orders
CREATE POLICY "Students can insert own laundry orders" ON public.laundry_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Students can view own laundry orders" ON public.laundry_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone authenticated can view laundry orders" ON public.laundry_orders FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can view all laundry orders" ON public.laundry_orders FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update laundry orders" ON public.laundry_orders FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Vendors can view all laundry orders" ON public.laundry_orders FOR SELECT USING (has_role(auth.uid(), 'vendor'));
CREATE POLICY "Vendors can update laundry orders" ON public.laundry_orders FOR UPDATE USING (has_role(auth.uid(), 'vendor'));
CREATE POLICY "No laundry order deletions" ON public.laundry_orders FOR DELETE USING (false);

-- laundry_order_items
CREATE POLICY "Anyone authenticated can insert laundry items" ON public.laundry_order_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Anyone authenticated can view laundry items" ON public.laundry_order_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "No laundry item deletions" ON public.laundry_order_items FOR DELETE USING (false);

-- laundry_vendor_orders
CREATE POLICY "Laundry owners can insert vendor orders" ON public.laundry_vendor_orders FOR INSERT WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'laundry'));
CREATE POLICY "Laundry owners can view vendor orders" ON public.laundry_vendor_orders FOR SELECT USING (has_role(auth.uid(), 'laundry'));
CREATE POLICY "Laundry owners can update vendor orders" ON public.laundry_vendor_orders FOR UPDATE USING (has_role(auth.uid(), 'laundry'));
CREATE POLICY "No vendor order deletions" ON public.laundry_vendor_orders FOR DELETE USING (false);

-- laundry_vendor_order_items
CREATE POLICY "Laundry owners can insert vendor order items" ON public.laundry_vendor_order_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'laundry'));
CREATE POLICY "Laundry owners can view vendor order items" ON public.laundry_vendor_order_items FOR SELECT USING (has_role(auth.uid(), 'laundry'));
CREATE POLICY "No vendor order item deletions" ON public.laundry_vendor_order_items FOR DELETE USING (false);

-- laundry_settings
CREATE POLICY "Users can view own laundry settings" ON public.laundry_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own laundry settings" ON public.laundry_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own laundry settings" ON public.laundry_settings FOR UPDATE USING (auth.uid() = user_id);

-- 6. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('appliance-images', 'appliance-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('prescriptions', 'prescriptions', false);

-- Storage policies for appliance-images
CREATE POLICY "Anyone can view appliance images" ON storage.objects FOR SELECT USING (bucket_id = 'appliance-images');
CREATE POLICY "Authenticated users can upload appliance images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'appliance-images' AND auth.uid() IS NOT NULL);

-- Storage policies for prescriptions
CREATE POLICY "Users can upload own prescriptions" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'prescriptions' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can view own prescriptions" ON storage.objects FOR SELECT USING (bucket_id = 'prescriptions' AND auth.uid() IS NOT NULL);

-- 7. REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.salon_chairs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.salon_queue;

-- 8. SEED DATA

-- Salon chairs (3 per block × 4 blocks)
INSERT INTO public.salon_chairs (hostel_block, chair_number) VALUES
  ('B1', 1), ('B1', 2), ('B1', 3),
  ('B2', 1), ('B2', 2), ('B2', 3),
  ('G1', 1), ('G1', 2), ('G1', 3),
  ('G2', 1), ('G2', 2), ('G2', 3);

-- Inventory items - Stationery (boys)
INSERT INTO public.inventory_items (name, category, hostel_section, price, quantity) VALUES
  ('Pen (Blue)', 'Stationery', 'boys', 10, 100),
  ('Pen (Black)', 'Stationery', 'boys', 10, 100),
  ('Pencil', 'Stationery', 'boys', 5, 100),
  ('Eraser', 'Stationery', 'boys', 5, 100),
  ('Notebook (200 pages)', 'Stationery', 'boys', 40, 50),
  ('A4 Sheets (Pack of 100)', 'Stationery', 'boys', 150, 30),
  ('Stapler', 'Stationery', 'boys', 50, 20),
  ('Highlighter Set', 'Stationery', 'boys', 60, 30);

-- Inventory items - Stationery (girls)
INSERT INTO public.inventory_items (name, category, hostel_section, price, quantity) VALUES
  ('Pen (Blue)', 'Stationery', 'girls', 10, 100),
  ('Pen (Black)', 'Stationery', 'girls', 10, 100),
  ('Pencil', 'Stationery', 'girls', 5, 100),
  ('Eraser', 'Stationery', 'girls', 5, 100),
  ('Notebook (200 pages)', 'Stationery', 'girls', 40, 50),
  ('A4 Sheets (Pack of 100)', 'Stationery', 'girls', 150, 30),
  ('Stapler', 'Stationery', 'girls', 50, 20),
  ('Highlighter Set', 'Stationery', 'girls', 60, 30);

-- Inventory items - Fruits (boys)
INSERT INTO public.inventory_items (name, category, hostel_section, price, quantity) VALUES
  ('Apple (1 kg)', 'Fruits', 'boys', 150, 20),
  ('Banana (1 dozen)', 'Fruits', 'boys', 50, 30),
  ('Orange (1 kg)', 'Fruits', 'boys', 80, 20),
  ('Grapes (500g)', 'Fruits', 'boys', 60, 15),
  ('Watermelon (1 piece)', 'Fruits', 'boys', 40, 10);

-- Inventory items - Fruits (girls)
INSERT INTO public.inventory_items (name, category, hostel_section, price, quantity) VALUES
  ('Apple (1 kg)', 'Fruits', 'girls', 150, 20),
  ('Banana (1 dozen)', 'Fruits', 'girls', 50, 30),
  ('Orange (1 kg)', 'Fruits', 'girls', 80, 20),
  ('Grapes (500g)', 'Fruits', 'girls', 60, 15),
  ('Watermelon (1 piece)', 'Fruits', 'girls', 40, 10);

-- Inventory items - Gym Supplements (boys)
INSERT INTO public.inventory_items (name, category, hostel_section, price, quantity) VALUES
  ('Whey Protein (1kg)', 'Gym Supplements', 'boys', 1500, 10),
  ('BCAA (30 servings)', 'Gym Supplements', 'boys', 800, 10),
  ('Creatine (250g)', 'Gym Supplements', 'boys', 600, 10),
  ('Protein Bar', 'Gym Supplements', 'boys', 100, 50),
  ('Pre-Workout (30 servings)', 'Gym Supplements', 'boys', 900, 8);

-- Inventory items - Gym Supplements (girls)
INSERT INTO public.inventory_items (name, category, hostel_section, price, quantity) VALUES
  ('Whey Protein (1kg)', 'Gym Supplements', 'girls', 1500, 10),
  ('BCAA (30 servings)', 'Gym Supplements', 'girls', 800, 10),
  ('Creatine (250g)', 'Gym Supplements', 'girls', 600, 10),
  ('Protein Bar', 'Gym Supplements', 'girls', 100, 50),
  ('Pre-Workout (30 servings)', 'Gym Supplements', 'girls', 900, 8);

-- Inventory items - Medicine (boys)
INSERT INTO public.inventory_items (name, category, hostel_section, price, quantity) VALUES
  ('Hot Water Bag', 'Medicine', 'boys', 250, 15),
  ('Band-Aid (Pack of 10)', 'Medicine', 'boys', 30, 50),
  ('Cotton Roll', 'Medicine', 'boys', 40, 30),
  ('ORS Sachets (Pack of 5)', 'Medicine', 'boys', 25, 40),
  ('Ice Pack', 'Medicine', 'boys', 100, 20);

-- Inventory items - Medicine (girls)
INSERT INTO public.inventory_items (name, category, hostel_section, price, quantity) VALUES
  ('Sanitary Pads (Pack of 8)', 'Medicine', 'girls', 45, 100),
  ('Hot Water Bag', 'Medicine', 'girls', 250, 15),
  ('Band-Aid (Pack of 10)', 'Medicine', 'girls', 30, 50),
  ('Cotton Roll', 'Medicine', 'girls', 40, 30),
  ('ORS Sachets (Pack of 5)', 'Medicine', 'girls', 25, 40),
  ('Ice Pack', 'Medicine', 'girls', 100, 20);

-- ============================================================
-- DONE! Your database is now fully configured.
-- ============================================================
