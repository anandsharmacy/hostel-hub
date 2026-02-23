
-- Add hostel_section column to inventory_items
-- 'boys' for B1/B2 hostels, 'girls' for G1/G2 hostels
ALTER TABLE public.inventory_items 
ADD COLUMN hostel_section text NOT NULL DEFAULT 'boys';

-- Update existing items to have a default section (vendor can reassign)
-- No constraint needed, we'll handle validation in the app
