-- Create inventory_items table for vendor stock management
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  price DECIMAL(10,2) NOT NULL,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, category)
);

-- Enable RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view inventory items"
  ON public.inventory_items FOR SELECT
  USING (true);

CREATE POLICY "Vendors can insert inventory items"
  ON public.inventory_items FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'vendor'));

CREATE POLICY "Vendors can update inventory items"
  ON public.inventory_items FOR UPDATE
  USING (public.has_role(auth.uid(), 'vendor'));

CREATE POLICY "Vendors can delete inventory items"
  ON public.inventory_items FOR DELETE
  USING (public.has_role(auth.uid(), 'vendor'));

CREATE POLICY "Admins can manage inventory"
  ON public.inventory_items FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_inventory_items_updated_at
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create restock_history table to track restocking events
CREATE TABLE public.restock_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  restocked_by UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.restock_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for restock_history
CREATE POLICY "Vendors can view restock history"
  ON public.restock_history FOR SELECT
  USING (public.has_role(auth.uid(), 'vendor'));

CREATE POLICY "Vendors can insert restock history"
  ON public.restock_history FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'vendor'));

CREATE POLICY "No restock history deletions"
  ON public.restock_history FOR DELETE
  USING (false);

CREATE POLICY "Admins can view restock history"
  ON public.restock_history FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert default inventory items based on store categories
INSERT INTO public.inventory_items (name, category, quantity, price, low_stock_threshold) VALUES
-- Stationery
('Notebook (200 pages)', 'Stationery', 50, 60.00, 10),
('Pen Set (Pack of 5)', 'Stationery', 100, 50.00, 20),
('File Folder', 'Stationery', 75, 30.00, 15),
('Highlighters (Pack of 4)', 'Stationery', 40, 80.00, 10),
('Sticky Notes', 'Stationery', 60, 40.00, 15),
('Stapler', 'Stationery', 25, 120.00, 5),
-- Fruits
('Apples (1 kg)', 'Fruits', 30, 180.00, 10),
('Bananas (1 dozen)', 'Fruits', 40, 60.00, 10),
('Oranges (1 kg)', 'Fruits', 25, 120.00, 8),
('Grapes (500g)', 'Fruits', 20, 100.00, 5),
('Pomegranate (2 pcs)', 'Fruits', 15, 150.00, 5),
('Mixed Fruit Bowl', 'Fruits', 10, 200.00, 3),
-- Gym Supplements
('Protein Bar (Pack of 6)', 'Gym Supplements', 30, 450.00, 10),
('Energy Drink (500ml)', 'Gym Supplements', 50, 80.00, 15),
('Peanut Butter (500g)', 'Gym Supplements', 20, 320.00, 5),
('Protein Shake Mix', 'Gym Supplements', 15, 1200.00, 3),
('BCAA Powder', 'Gym Supplements', 10, 900.00, 3),
('Multivitamin (30 tablets)', 'Gym Supplements', 25, 350.00, 5),
-- Medicine (for pharmacy section)
('Paracetamol (10 tablets)', 'Medicine', 100, 20.00, 30),
('Crocin', 'Medicine', 80, 25.00, 20),
('Bandages (Pack)', 'Medicine', 50, 50.00, 15),
('Antiseptic Cream', 'Medicine', 40, 80.00, 10),
('Cough Syrup', 'Medicine', 30, 120.00, 10),
('ORS Packets (10)', 'Medicine', 60, 30.00, 20);