

## Add Notifications Section to Student and Vendor Dashboards

### Overview
Add a dedicated "Notifications" tab to both the Student Dashboard and Vendor Dashboard that displays all announcements in a full list view (not just the dismissible banner). This gives users a persistent place to review all current announcements.

### What Changes

**1. Create a shared Notifications component**
- New file: `src/components/shared/NotificationsSection.tsx`
- Accepts a `role` prop (`'students'` | `'vendors'`) to fetch the correct announcements
- Fetches active, non-expired announcements from the database filtered by `target_audience` (matching the role or `'both'`)
- Displays announcements as a scrollable list of cards, each showing the title, message, and date
- Shows an empty state when there are no announcements

**2. Update Student Dashboard**
- Add a 6th tab: "Notifications" with a Bell icon
- Render the `NotificationsSection` component with `role="students"`

**3. Update Vendor Dashboard**
- Add a 6th tab: "Notifications" with a Bell icon
- Render the `NotificationsSection` component with `role="vendors"`

### Technical Details

**New file: `src/components/shared/NotificationsSection.tsx`**
- Queries `announcements` table with filters: `is_active = true`, `target_audience IN [role, 'both']`
- Client-side filters out expired announcements
- Each announcement rendered as a Card with Megaphone icon, title, date badge, and full message text
- Loading state with spinner, empty state with friendly message

**Modified file: `src/pages/student/StudentDashboard.tsx`**
- Import `Bell` from lucide-react and `NotificationsSection`
- Add "Notifications" TabsTrigger and TabsContent
- Grid changes from `grid-cols-5` to accommodate 6 tabs (`grid-cols-3 md:grid-cols-6`)

**Modified file: `src/pages/vendor/VendorDashboard.tsx`**
- Import `Bell` from lucide-react and `NotificationsSection`
- Add "Notifications" TabsTrigger and TabsContent
- Grid changes from `grid-cols-5` to `grid-cols-6`

No database changes needed -- the existing `announcements` table and RLS policies already support filtering by `target_audience` for both students and vendors.

