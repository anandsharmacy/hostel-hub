

# Complete SQL Migration Script for External Supabase Project

This is a documentation-only task — no code changes to the Lovable project. I will generate the full SQL migration script based on the existing database schema, functions, triggers, RLS policies, and seed data documented in this project.

## What the script will include

1. **Enum type**: `app_role` with all 6 active roles
2. **18 tables**: profiles, user_roles, approval_requests, cleaning_requests, blocked_cleaning_slots, appliance_complaints, inventory_items, store_orders, medicine_requests, salon_chairs, salon_queue, restock_history, announcements, laundry_orders, laundry_order_items, laundry_vendor_orders, laundry_vendor_order_items, laundry_settings
3. **6 database functions**: has_role, get_user_role, validate_user_role_insert, generate_receipt_number, generate_medicine_receipt_number, update_updated_at_column
4. **Triggers**: validate_user_role_insert on user_roles, receipt number generators on store_orders and medicine_requests, updated_at triggers on relevant tables
5. **RLS policies**: All 50+ policies exactly matching the current project
6. **Storage buckets**: appliance-images (public), prescriptions (private)
7. **Realtime**: Enable realtime on salon_chairs and salon_queue
8. **Seed data**: Salon chairs (3 per hostel block × 4 blocks = 12 chairs), inventory items for boys/girls sections across all categories including Medicine

## Delivery

The script will be written to `.lovable/plan.md` as a complete, copy-pasteable SQL block ready to run in the Supabase SQL Editor at `https://zvbhaehxojklmzylpjri.supabase.co`.

