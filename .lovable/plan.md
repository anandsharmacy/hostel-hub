

## Plan: Copy Boys Inventory to Girls Section

### Problem
The `inventory_items` table has a unique constraint on `(name, category)` only — it does not include `hostel_section`. This means inserting the same item names for the "girls" section will fail with a duplicate key error.

### Solution (2 steps)

**Step 1: Database migration — Update the unique constraint**
- Drop existing constraint: `inventory_items_name_category_key UNIQUE (name, category)`
- Add new constraint: `inventory_items_name_category_section_key UNIQUE (name, category, hostel_section)`
- This allows the same item to exist in both "boys" and "girls" sections

**Step 2: Insert data — Clone boys items to girls**
- Use the data insertion tool to copy all 40 "boys" items into the "girls" section with the same name, category, quantity, price, thresholds, and availability
- Uses `ON CONFLICT DO NOTHING` to safely skip any that might already exist

No code changes are needed — the app already filters inventory by `hostel_section` and supports both sections.

