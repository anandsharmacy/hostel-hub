

## Plan: Dedicated Laundry Tables & Editable Student Fields

### Problem
1. The current `laundry_orders` table's INSERT policy only allows students (`auth.uid() = user_id`), so laundry owners can't insert orders.
2. The check-in form auto-fills Name, SAP ID, and Hostel Block from the logged-in user's profile and disables them — but the laundry owner should manually enter the student's details.

### Approach
Rather than fighting with shared RLS policies, create dedicated tables for the laundry owner role and update the forms.

### Database Migration
Create two new tables owned by the laundry role:

- **`laundry_vendor_orders`** — same columns as `laundry_orders` but `user_id` = the laundry owner (not the student). RLS: laundry role can INSERT, SELECT, UPDATE.
- **`laundry_vendor_order_items`** — same columns as `laundry_order_items`, FK to new orders table. RLS: laundry role can INSERT, SELECT.

### Code Changes

**1. `src/pages/student/LaundryCheckInForm.tsx`**
- Make Name, SAP ID, and Hostel Block **editable text inputs** (remove `disabled`, remove auto-fill from `profile`)
- Add local state for `studentName`, `sapId`, `hostelBlock`
- Insert into `laundry_vendor_orders` and `laundry_vendor_order_items` instead of the old tables
- Set `user_id` to the logged-in laundry owner's ID

**2. `src/pages/student/LaundryCheckOutForm.tsx`**
- Query from `laundry_vendor_orders` instead of `laundry_orders`
- Update status in `laundry_vendor_orders`

**3. `src/components/student/LaundryRevenueTracker.tsx`**
- Query revenue data from `laundry_vendor_orders` instead of `laundry_orders`

**4. `src/integrations/supabase/types.ts`**
- Will be auto-updated after migration

