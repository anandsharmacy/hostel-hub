

## Plan: Add Medical Section to Store Orders

### Current State
- The `storeCategories` array in `StoreOrderForm.tsx` only includes `['Stationery', 'Fruits', 'Gym Supplements']`
- A "Medicine" category already exists in the database (Sanitary Pad is already there for girls)
- The inventory query on line 69 filters to only those 3 categories, excluding Medicine items

### Changes

**Step 1: Add medical items to database (data insert)**
Insert items into `inventory_items` for both boys and girls sections:
- Sanitary Pads (girls only, already exists)
- Hot Water Bag — both sections
- Band-Aid (Pack of 10) — both sections
- Cotton Roll — both sections
- ORS Sachets (Pack of 5) — both sections
- Ice Pack — both sections

**Step 2: Update `StoreOrderForm.tsx`**
- Add `'Medicine'` to the `storeCategories` array (line 18)
- Update the inventory query `.in('category', ...)` filter to include `'Medicine'` (line 69)

No other file changes needed — the rest of the component is fully dynamic.

