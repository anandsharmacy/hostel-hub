

## Laundry Service Management System

A new standalone module accessible from the Student Dashboard with three tabs: Clothes Check-In, Clothes Check-Out, and Revenue Tracker.

### Database Changes

**New tables:**

1. **`laundry_orders`** — stores each check-in
   - `id`, `user_id`, `student_name`, `sap_id`, `hostel_block`, `contact_number`, `cleaning_type` (wash_only, iron_only, wash_and_iron, dry_clean), `status` (checked_in, checked_out), `checked_in_at`, `checked_out_at`, `total_amount` (calculated)

2. **`laundry_order_items`** — individual clothing items per order
   - `id`, `order_id` (FK to laundry_orders), `cloth_type` (shirt, pants, jacket, jeans, tshirt, etc.), `quantity`, `unit_price`, `is_special` (for blazer/coat at ₹100 dry clean rate)

3. **`laundry_settings`** — stores the laundry owner's 4-digit revenue PIN
   - `id`, `user_id`, `revenue_pin` (text, hashed or plain 4-digit)

**RLS policies:**
- Students can insert and view their own laundry orders
- Admins/vendors can view all and update status (for check-out)
- Revenue settings: only the owner can insert/view their own PIN

### Pricing Logic (computed at insert time)
- Wash only: ₹7/cloth
- Iron only: ₹7/cloth
- Wash & Iron: ₹15/cloth
- Dry Clean: ₹50/cloth, ₹100 if blazer or coat

### Frontend Changes

**1. New Student Dashboard tab: "Laundry"** (`src/pages/student/StudentDashboard.tsx`)
- Add a Laundry tab with `Shirt` icon from lucide-react

**2. New page: `src/pages/student/LaundryCheckInForm.tsx`**
- Form fields: Name (pre-filled from profile), SAP ID (pre-filled), Hostel Block (pre-filled), Contact Number
- Clothing items: dynamic list — select cloth type + quantity for each
- Cloth types: Shirt, T-Shirt, Pants, Jeans, Jacket, Blazer, Coat, Shorts, Kurta, Saree, Bedsheet, Towel, Other
- Cleaning type selector: Wash Only, Iron Only, Wash & Iron, Dry Clean
- Shows calculated total before submission
- Saves to `laundry_orders` + `laundry_order_items`

**3. New page: `src/pages/student/LaundryCheckOutForm.tsx`**
- Search by SAP ID, Name, or date range
- Shows list of checked-in orders matching search
- "Check Out" button marks order as checked_out with timestamp

**4. New component: `src/components/student/LaundryRevenueTracker.tsx`**
- First-time setup: prompt to set 4-digit PIN (stored in `laundry_settings`)
- On subsequent visits: ask for PIN before showing revenue
- Revenue dashboard: total revenue, breakdown by cleaning type, daily/weekly/monthly views
- Uses recharts for visualization

### Files to Create/Modify
- **Create:** `src/pages/student/LaundryCheckInForm.tsx`
- **Create:** `src/pages/student/LaundryCheckOutForm.tsx`
- **Create:** `src/components/student/LaundryRevenueTracker.tsx`
- **Modify:** `src/pages/student/StudentDashboard.tsx` (add Laundry tab)
- **Migration:** Create `laundry_orders`, `laundry_order_items`, `laundry_settings` tables with RLS

