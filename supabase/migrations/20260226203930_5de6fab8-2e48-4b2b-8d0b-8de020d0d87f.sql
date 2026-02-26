
-- Drop old unique constraint that doesn't include hostel_section
ALTER TABLE public.inventory_items DROP CONSTRAINT IF EXISTS inventory_items_name_category_key;

-- Add new unique constraint that includes hostel_section
ALTER TABLE public.inventory_items ADD CONSTRAINT inventory_items_name_category_section_key UNIQUE (name, category, hostel_section);
