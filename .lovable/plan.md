

## Salon Queue System

This is a large feature spanning database, auth, routing, and multiple new pages. Here is the full plan.

### 1. Database Changes (migration)

**Add `barber` to the `app_role` enum:**
```sql
ALTER TYPE public.app_role ADD VALUE 'barber';
```

**Create `salon_chairs` table** — tracks which barber is on which chair at which salon today:
```text
salon_chairs
├── id (uuid, PK)
├── hostel_block (text, NOT NULL) — e.g. "Hostel B1"
├── chair_number (int, NOT NULL) — 1, 2, or 3
├── barber_id (uuid, nullable) — references auth.users
├── barber_name (text, nullable) — display name
├── is_active (bool, default false) — barber currently working
├── created_at (timestamptz)
├── updated_at (timestamptz)
└── UNIQUE (hostel_block, chair_number)
```

**Create `salon_queue` table** — students waiting in line:
```text
salon_queue
├── id (uuid, PK)
├── chair_id (uuid, FK → salon_chairs.id, NOT NULL)
├── student_id (uuid, NOT NULL)
├── student_name (text, NOT NULL)
├── position (int, NOT NULL) — queue position
├── status (text, default 'waiting') — waiting | in_service | completed
├── joined_at (timestamptz, default now())
├── completed_at (timestamptz, nullable)
```

**Seed the 12 chairs** (4 hostels x 3 chairs):
Insert rows for Hostel B1 chairs 1-3, Hostel B2 chairs 1-3, Hostel G1 chairs 1-3, Hostel G2 chairs 1-3.

**RLS policies:**
- `salon_chairs`: Anyone authenticated can SELECT; barbers can UPDATE (assign/unassign themselves)
- `salon_queue`: Students can INSERT (own queue entry); anyone authenticated can SELECT; barbers can UPDATE (mark in_service/completed); students can DELETE own waiting entry (leave queue)

**Enable realtime** on both tables for live queue updates.

### 2. Auth & Routing Changes

**`src/contexts/AuthContext.tsx`:**
- Add `'barber'` to the `UserRole` type

**`src/pages/Login.tsx`:**
- Add `"barber"` as a role option in the signup form: `<SelectItem value="barber">Barber</SelectItem>`
- Barbers need approval (like admin/vendor), so add `'barber'` to the `needsApproval` check

**`src/App.tsx`:**
- Add route: `/barber` → `BarberDashboard` (protected, `allowedRoles: ['barber']`)

**`src/pages/Index.tsx`:**
- Add barber redirect: `case 'barber': navigate('/barber')`

**`src/pages/superuser/SuperUserDashboard.tsx`:**
- Barber approval requests will automatically appear since they use the same `approval_requests` table

### 3. Barber Dashboard — New Page

**`src/pages/barber/BarberDashboard.tsx`:**
- Wrapped in `DashboardLayout`
- Shows all 4 hostel salons as cards
- Each salon card shows 3 chairs with current assignment status
- Barber can tap a vacant chair to assign themselves (sets `barber_id`, `barber_name`, `is_active = true`)
- Barber can release their chair (clears assignment)
- Shows their current queue for their active chair with ability to mark students as "in service" or "completed"
- Uses Supabase realtime subscription for live updates

### 4. Student Salon Tab — New Component

**`src/components/student/SalonQueueView.tsx`:**
- Reads student's `hostel_block` from profile to determine which salon to show
- Displays 3 chairs as a visual layout (matching the reference image: mirror on top, 3 chairs with barber names below)
- Each chair shows: barber name (or "Vacant"), queue count
- Student can tap "Join Queue" on a chair that has an active barber
- Student can see their position in queue
- Student can "Leave Queue" if still waiting
- Realtime subscription for live queue count updates

**`src/pages/student/StudentDashboard.tsx`:**
- Add a new "Salon" tab with a `Scissors` icon alongside existing tabs

### 5. Visual Layout (Reference Image)

The salon view will render:
```text
┌─────────────────────────────────┐
│           MIRROR                │
├─────────┬─────────┬─────────────┤
│  Chair  │  Chair  │   Chair     │
│  [icon] │  [icon] │   [icon]    │
│         │         │             │
│  1.     │  2.     │   3.        │
│  Barber │  Barber │   Barber    │
│  Name   │  Name   │   Name      │
│ Queue:3 │ Queue:1 │  Queue:0    │
│[Join Q] │[Join Q] │  [Vacant]   │
└─────────┴─────────┴─────────────┘
```

### Summary of New Files
- `src/pages/barber/BarberDashboard.tsx`
- `src/components/student/SalonQueueView.tsx`
- 1 database migration (enum + 2 tables + seed data + RLS + realtime)

### Files Modified
- `src/contexts/AuthContext.tsx` — add `barber` to UserRole
- `src/pages/Login.tsx` — add barber role option + approval logic
- `src/App.tsx` — add barber route
- `src/pages/Index.tsx` — add barber redirect
- `src/pages/student/StudentDashboard.tsx` — add Salon tab

