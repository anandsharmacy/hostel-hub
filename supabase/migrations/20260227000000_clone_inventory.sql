-- Migration: Clone Boys inventory items to Girls section and add new items
-- Description: Duplicates all existing active and inactive items from 'boys' hostel_section to 'girls'
--              and inserts 'Sanitary Pad' and 'Hair Band' specifically for girls.

BEGIN;

-- 1. Clone existing items from 'boys' to 'girls'
-- We only copy if the item doesn't already exist for 'girls'
INSERT INTO inventory_items (
    name, 
    category, 
    quantity, 
    price, 
    low_stock_threshold, 
    is_available, 
    hostel_section
)
SELECT 
    name, 
    category, 
    quantity, 
    price, 
    low_stock_threshold, 
    is_available, 
    'girls'
FROM inventory_items
WHERE hostel_section = 'boys'
ON CONFLICT (name, category, hostel_section) DO NOTHING;

-- 2. Add 'girly' items specifically to the 'girls' section
INSERT INTO inventory_items (
    name, 
    category, 
    quantity, 
    price, 
    low_stock_threshold, 
    is_available, 
    hostel_section
)
VALUES 
    ('Sanitary Pad', 'Medicine', 100, 50, 20, true, 'girls'),
    ('Hair Band', 'Stationery', 50, 20, 10, true, 'girls')
ON CONFLICT (name, category, hostel_section) DO NOTHING;

COMMIT;
