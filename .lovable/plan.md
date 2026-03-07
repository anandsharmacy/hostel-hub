

# NMIMS Hostel Service Management Portal — Flutter Documentation

## 1. Project Overview

A hostel service management portal for NMIMS Hyderabad with **6 user roles**: Student, Admin, Vendor, Super User, Barber, and Laundry Owner. Built with Supabase as the backend (auth + database + storage + realtime).

---

## 2. Authentication & Roles

### Auth Flow
- **Email + password** authentication via Supabase Auth
- Email verification required (no auto-confirm)
- Password reset via email with redirect to `/reset-password`
- Role-based routing after login

### Roles (stored as enum `app_role`)
```text
student | admin | vendor | super_user | barber | laundry
```

### Signup Rules
- `student` → auto-approved, can login immediately
- `admin`, `vendor`, `barber`, `laundry` → require Super User approval before login
- `super_user` → cannot be self-assigned (blocked by DB trigger `validate_user_role_insert`)
- `laundry` → must set a 4-digit revenue PIN during signup (stored in `laundry_settings`)
- Gender selection: `male` or `female` (determines hostel block options)
- Students select hostel block: Male → Hostel B1/B2, Female → Hostel G1/G2

### Login Page UI
- **Home view**: NMIMS logo (large), "Hostel Service Management" title, "Sign In" button (filled maroon), "Create Account" button (outlined), scrolling marquee text, small "Super User Login" link at bottom
- **Sign In view**: Card with email + password fields, "Forgot password?" link, "Create one" link
- **Super User Login view**: Separate card with shield icon, email + password
- **Sign Up view**: Card with fields: Email, Password, Full Name, Role (dropdown), Gender (dropdown, shown for student), SAP ID (student), Room Number (student), Hostel Block (student, filtered by gender), Revenue PIN (laundry only, 4-digit)
- **Forgot Password view**: Email input, sends reset link
- Nav header: NMIMS logo, links to About, Contact, Hostel Rules, Hostel Application (external), dark mode toggle
- Theme: NMIMS maroon (`hsl(350, 70%, 35%)`) as primary color

---

## 3. Database Schema

### Enum
```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'super_user', 'barber', 'laundry', 'student', 'vendor');
```

### Tables

#### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | auto-generated |
| user_id | uuid NOT NULL | references auth.users(id) |
| full_name | text NOT NULL | |
| sap_id | text | nullable, students only |
| room_number | text | nullable |
| hostel_block | text | nullable, e.g. "Hostel B1" |
| gender | text | nullable, "male"/"female" |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

**RLS**: Users can only read/insert/update their own profile. No deletions.

#### `user_roles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid NOT NULL | |
| role | app_role NOT NULL | |
| approved | boolean NOT NULL | default false |

**RLS**: Users can insert own role, view own role. Super users can view all and update approval. No deletions. A trigger prevents self-assigning `super_user`.

#### `approval_requests`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid NOT NULL | |
| role | text NOT NULL | |
| full_name | text NOT NULL | |
| email | text NOT NULL | |
| status | text | default 'pending' (pending/approved/rejected) |
| requested_at | timestamptz | default now() |
| approved_at | timestamptz | nullable |
| approved_by | uuid | nullable |

**RLS**: Users insert own. Super users view all and update. No deletions.

#### `cleaning_requests`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid NOT NULL | |
| student_name | text NOT NULL | |
| hostel_block | text NOT NULL | |
| room_number | text NOT NULL | |
| preferred_date | date NOT NULL | |
| preferred_time | text NOT NULL | formatted string e.g. "10:00 AM - 2:00 PM" |
| availability_start | text | e.g. "10:00 AM" |
| availability_end | text | e.g. "2:00 PM" |
| expected_arrival_start | text | calculated from queue position |
| expected_arrival_end | text | |
| notes | text | nullable |
| status | text | default 'pending' (pending/in-progress/completed) |
| created_at / updated_at | timestamptz | |

**RLS**: Students insert own + view own. Admins view all + update status. No deletions.

**Queue Logic**: When submitting, the app queries existing requests for the same date with overlapping time windows. Each booking ahead adds 30 min to the expected arrival start. If arrival would exceed the student's end time, submission is blocked ("Time slot full").

#### `blocked_cleaning_slots`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| blocked_date | date NOT NULL | |
| blocked_time_slot | text NOT NULL | |
| reason | text | nullable |
| created_by | uuid NOT NULL | |
| created_at | timestamptz | |

**RLS**: Anyone can view. Admins can insert/update/delete.

#### `appliance_complaints`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid NOT NULL | |
| student_name | text NOT NULL | |
| hostel_block | text NOT NULL | |
| room_number | text NOT NULL | |
| appliance | text NOT NULL | values: Fan, Light, AC, Geyser, Plug Point, Other |
| description | text NOT NULL | |
| image_url | text | nullable, path in `appliance-images` bucket |
| status | text | default 'pending' |
| created_at / updated_at | timestamptz | |

**RLS**: Students insert own + view own. Admins view all + update. No deletions.

**Storage**: `appliance-images` bucket (public). Images uploaded as `{userId}/{timestamp}.{ext}`, max 5MB.

#### `inventory_items`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text NOT NULL | |
| category | text NOT NULL | Stationery, Fruits, Gym Supplements, Medicine |
| quantity | integer | default 0 |
| price | numeric NOT NULL | |
| low_stock_threshold | integer | default 5 |
| is_available | boolean | default true |
| hostel_section | text | default 'boys' — values: 'boys' or 'girls' |
| created_at / updated_at | timestamptz | |

**Unique constraint**: (name, category, hostel_section)

**RLS**: Anyone can view. Vendors can insert/update/delete. Admins can manage.

**Section mapping**: Hostel B1/B2 → 'boys', Hostel G1/G2 → 'girls'

#### `store_orders`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid NOT NULL | |
| student_name | text NOT NULL | |
| hostel_block | text NOT NULL | |
| room_number | text NOT NULL | |
| category | text NOT NULL | |
| items | jsonb NOT NULL | default '[]', array of {name, quantity} |
| status | text | default 'pending' |
| receipt_number | text | nullable, auto-generated by trigger |
| created_at / updated_at | timestamptz | |

**Receipt number format**: `RCP-YYYYMMDD-XXXX` (auto-generated by `generate_receipt_number` trigger)

**RLS**: Students insert own + view own. Vendors view all + update. Admins view all. No deletions.

#### `medicine_requests`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid NOT NULL | |
| student_name | text NOT NULL | |
| hostel_block | text NOT NULL | |
| room_number | text NOT NULL | |
| medicine_name | text | nullable |
| prescription_url | text | nullable, path in `prescriptions` bucket |
| notes | text | nullable |
| status | text | default 'pending' |
| receipt_number | text | nullable, auto-generated `MED-YYYYMMDD-XXXX` |
| created_at / updated_at | timestamptz | |

**Storage**: `prescriptions` bucket (private). PDF only, max 5MB. Access via signed URLs (5 min expiry).

**RLS**: Students insert own + view own. Vendors view all + update. Admins view all. No deletions.

#### `salon_chairs`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| hostel_block | text NOT NULL | e.g. "Hostel B1" |
| chair_number | integer NOT NULL | |
| barber_id | uuid | nullable |
| barber_name | text | nullable |
| is_active | boolean | default false |
| created_at / updated_at | timestamptz | |

**RLS**: Anyone authenticated can view. Barbers can update. No insert/delete via API.

#### `salon_queue`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| chair_id | uuid NOT NULL | |
| student_id | uuid NOT NULL | |
| student_name | text NOT NULL | |
| position | integer NOT NULL | |
| status | text | default 'waiting' (waiting/in_service/completed) |
| joined_at | timestamptz | default now() |
| completed_at | timestamptz | nullable |

**RLS**: Anyone authenticated can view. Students can insert (own) and delete own waiting entries. Barbers can update and delete.

**Realtime**: Both `salon_chairs` and `salon_queue` use Supabase Realtime for live updates.

#### `restock_history`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| item_id | uuid NOT NULL | |
| previous_quantity | integer NOT NULL | |
| new_quantity | integer NOT NULL | |
| restocked_by | uuid NOT NULL | |
| notes | text | nullable |
| created_at | timestamptz | |

**RLS**: Vendors can insert and view. Admins can view. No updates/deletions.

#### `announcements`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| vendor_id | uuid NOT NULL | |
| title | text NOT NULL | |
| message | text NOT NULL | |
| target_audience | text | default 'students' (students/vendors/both) |
| is_active | boolean | default true |
| expires_at | timestamptz | nullable |
| created_at / updated_at | timestamptz | |

**RLS**: Admins and Vendors can insert/update/delete own. Students see active announcements targeting 'students' or 'both'. Vendors see active announcements targeting 'vendors' or 'both'.

#### `laundry_orders` (student-facing)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid NOT NULL | |
| student_name | text NOT NULL | |
| sap_id | text NOT NULL | |
| hostel_block | text NOT NULL | |
| contact_number | text NOT NULL | |
| cleaning_type | text | default 'wash_only' |
| total_amount | numeric | default 0 |
| status | text | default 'checked_in' (checked_in / checked_out) |
| checked_in_at | timestamptz | default now() |
| checked_out_at | timestamptz | nullable |

#### `laundry_order_items`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| order_id | uuid NOT NULL | |
| cloth_type | text NOT NULL | |
| quantity | integer | default 1 |
| unit_price | numeric | default 0 |
| is_special | boolean | default false |

#### `laundry_vendor_orders` and `laundry_vendor_order_items`
Same structure as laundry_orders but for vendor-side tracking.

#### `laundry_settings`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid NOT NULL | |
| revenue_pin | text NOT NULL | 4-digit PIN |
| created_at | timestamptz | |

**RLS**: Users can only view/insert/update own settings. No deletions.

### Database Functions
1. `has_role(uuid, app_role) → boolean` — SECURITY DEFINER, used in all RLS policies
2. `get_user_role(uuid) → app_role` — returns user's role
3. `validate_user_role_insert()` — trigger preventing self-assignment of super_user
4. `generate_receipt_number()` — trigger on store_orders, format `RCP-YYYYMMDD-XXXX`
5. `generate_medicine_receipt_number()` — trigger on medicine_requests, format `MED-YYYYMMDD-XXXX`
6. `update_updated_at_column()` — generic trigger for updated_at

---

## 4. Screens & UI Structure

### 4.1 Login / Home (`/login`)
- Home: Logo, title, Sign In / Create Account buttons, marquee banner, Super User link
- Sign In: Card form (email, password), forgot password link
- Sign Up: Card form with role-dependent fields
- Super User Login: Separate card
- Forgot Password: Email input

### 4.2 Student Dashboard (`/student`)
**Layout**: Navbar (logo, role badge, user name, dark mode toggle, logout) + content area + AI chatbot FAB

**7 tabs** (horizontal, responsive grid):
1. **Room Cleaning** — Form: student name (pre-filled), room number, preferred date (date picker, min today), availability window (flip time picker, 8AM-5PM, min 2hr gap), notes. Shows queue count and expected arrival time. Validates against blocked slots.
2. **Appliance Issue** — Form: student name, room number, appliance (dropdown: Fan, Light/Tube Light, AC, Geyser/Water Heater, Plug Point/Socket, Other), description (textarea), optional image upload (max 5MB).
3. **Store Orders** — Two-column layout (items grid + cart sidebar). Category tabs: Stationery, Fruits, Gym Supplements, Medicine. Items show name, price (₹), stock status badge (In Stock / X left / Out of Stock). Cart: item list with +/- quantity, total price, room number field, Place Order button. Receipt dialog on success.
4. **Medicine** — Form: room number, prescription PDF upload (drag & drop, max 5MB), OR manual medicine name entry, notes. Receipt dialog on success.
5. **My Requests** — 4 sections showing all user's requests: Cleaning (with expected arrival), Appliance (with "View Image" link), Store Orders (with receipt number, items list), Medicine (with receipt number, "View Prescription" link). Each shows StatusBadge (Pending/In Progress/Completed).
6. **Salon** — Shows salon chairs for student's hostel pair (B1+B2 or G1+G2). Mirror bar at top, chairs with SVG illustrations, barber names, queue counts. Students can join one queue and leave. Realtime updates.
7. **Notifications** — Announcements targeting students.

### 4.3 Admin Dashboard (`/admin`)
**4 tabs**:
1. **Cleaning Requests** — Stats cards (total, pending cleaning, total complaints, pending issues). List of all cleaning requests with student name, hostel (with hostel filter dropdown), room, date, expected arrival, queue position, notes, timestamp. Actions: Mark In Progress / Mark Completed.
2. **Appliance Issues** — List with appliance type, student name, hostel+room, description, image link. Actions: Mark In Progress / Mark Completed.
3. **Slot Settings** — Blocked slots manager (admins can block specific date+time combinations).
4. **Announcements** — Admin announcement manager.

### 4.4 Vendor Dashboard (`/vendor`)
**6 tabs**:
1. **Store Orders** — Stats cards (total, pending, in-progress, delivered). Search bar (by receipt #, name, room). Order list with receipt number, student name, category badge, hostel+room, items breakdown, timestamp. Actions: Start Preparing / Mark Delivered.
2. **Medicine** — Same pattern as store but for medicine requests. Shows prescription link. Actions: Start Preparing / Mark Delivered.
3. **Inventory** — Full CRUD for inventory items. Separate boys/girls sections. Add item, adjust quantities, toggle availability, restock with history.
4. **Analytics** — Charts and stats for orders/revenue.
5. **Announcements** — Vendor announcement manager.
6. **Notifications** — Vendor-targeted announcements.

### 4.5 Super User Dashboard (`/super-user`)
- Stats: Pending / Approved / Rejected counts
- **Pending Approval Requests**: Card per request showing name, role badge (Administrator/Store Vendor), email, timestamp. Approve (green) / Reject (red) buttons.
- **Recent Activity**: List of processed requests with status badges.

### 4.6 Barber Dashboard (`/barber`)
- If assigned to a chair: Shows active chair info (hostel, chair #), queue list with student names, position, status (Waiting/In Service). Actions: Start / Done. Release Chair button.
- All hostels grid (B1, B2, G1, G2): Each shows 3 chairs with status (Vacant/Barber name), queue count. Vacant chairs have "Sit Here" button.
- Realtime updates via Supabase channels.

### 4.7 Laundry Dashboard (`/laundry`)
**3 tabs**: Check-In, Check-Out, Revenue
- Check-In: Form for student laundry order (student name, SAP ID, hostel, contact, cleaning type, cloth items with quantities and prices)
- Check-Out: Search and complete checked-in orders
- Revenue: PIN-protected revenue tracking with stats/charts. Change PIN dialog.

---

## 5. Shared Components

- **DashboardLayout**: Navbar + content container + AI Chatbot FAB
- **DashboardNavbar**: Sticky header with NMIMS logo, portal label (role-specific), user name, role badge, dark mode toggle, logout button
- **StatusBadge**: Colored badge — pending (yellow), in-progress (blue), completed (green)
- **AnnouncementsBanner**: Scrolling banner of active announcements for students
- **NotificationsSection**: List of announcements filtered by target audience
- **FlipTimePicker**: Custom time picker with flip animation (hours 8AM-5PM, half-hour increments)
- **LoadingSpinner**: Centered spinner with optional text
- **AIChatBot**: Floating chat button (bottom-right) with AI-powered responses

---

## 6. Hostel Normalization

All hostel block strings are normalized to: `Hostel B1`, `Hostel B2`, `Hostel G1`, `Hostel G2`.

Mapping rules:
- `B1` → `Hostel B1`, `G2` → `Hostel G2`
- `Block B1` → `Hostel B1`
- `B` or `Block B` → `Hostel B1` (default)
- `G` or `Block G` → `Hostel G1` (default)

Inventory section mapping:
- B1/B2 → `boys`, G1/G2 → `girls`

---

## 7. Theming

**Font**: Poppins (300-700)

**Light mode primary**: `hsl(350, 70%, 35%)` (NMIMS Maroon)
**Dark mode primary**: `hsl(350, 70%, 45%)`

Status colors: success `hsl(142, 76%, 36%)`, warning `hsl(38, 92%, 50%)`, info `hsl(199, 89%, 48%)`, destructive `hsl(0, 84%, 60%)`

Dark mode supported with theme toggle on all screens.

---

## 8. Storage Buckets

| Bucket | Public | Content | Max Size |
|--------|--------|---------|----------|
| `appliance-images` | Yes | JPG/PNG photos | 5MB |
| `prescriptions` | No (signed URLs) | PDF only | 5MB |

---

## 9. Realtime

Salon features (chairs + queue) use Supabase Realtime with `postgres_changes` listener on `salon_chairs` and `salon_queue` tables. Both barber and student views subscribe to these channels.

---

## 10. Static Pages

- `/about` — About NMIMS page
- `/contact` — Contact information
- `/hostel-rules` — Hostel rules and regulations
- `/reset-password` — Password reset form (checks for `type=recovery` in URL hash)

---

## 11. Key Business Rules

1. Students are auto-approved; admins/vendors/barbers/laundry need Super User approval
2. Super User role cannot be self-assigned
3. Store items are segmented by hostel section (boys/girls) with composite unique constraint
4. Cleaning requests use a queue system with 30-min slots; overflow is rejected
5. Receipt numbers auto-generated: `RCP-YYYYMMDD-XXXX` for store, `MED-YYYYMMDD-XXXX` for medicine
6. Laundry revenue tracker is PIN-protected (4-digit PIN set during signup)
7. Salon: one student can be in only one queue at a time; one barber per chair
8. All status flows: `pending` → `in-progress` → `completed`

