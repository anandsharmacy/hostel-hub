
## Add Announcements to Admin Dashboard with Target Audience Selection

### Overview
Add an "Announcements" tab to the Administration Dashboard, allowing admins to create and manage announcements targeted at either **Students**, **Vendors**, or **Both**. The existing vendor announcement system will also be updated to respect the new audience targeting.

### Database Changes

**1. Add `target_audience` column to `announcements` table**
- New column: `target_audience` (text, NOT NULL, default `'students'`)
- Valid values: `'students'`, `'vendors'`, `'both'`

**2. Rename `vendor_id` to `created_by`** -- Actually, keep `vendor_id` as-is for backward compatibility, but make it nullable so admins (who aren't vendors) can also create announcements. Add a new `created_by_role` column (text) to distinguish who created it.

Alternatively (simpler approach): Keep `vendor_id` but allow admins to use it too -- just store the admin's user ID in `vendor_id`. This avoids schema complexity.

**3. Update RLS Policies**
- Allow admins to INSERT announcements (with check for admin role)
- Allow admins to UPDATE their own announcements
- Allow admins to DELETE their own announcements
- Update student SELECT policy to only show announcements where `target_audience` is `'students'` or `'both'`
- Add vendor SELECT policy for announcements where `target_audience` is `'vendors'` or `'both'`

### Frontend Changes

**1. New Admin Announcement Manager Component**
- Create `src/components/admin/AdminAnnouncementManager.tsx`
- Reuse the same UI pattern as the existing `AnnouncementManager` from the vendor dashboard
- Add a **Target Audience** selector (radio group or select dropdown) with options: "Students", "Vendors", "Both"
- Admin sees all announcements they created, with audience badges
- Full CRUD: create, edit, toggle active/inactive, delete

**2. Update Admin Dashboard (`src/pages/admin/AdminDashboard.tsx`)**
- Add a 4th tab: "Announcements" with a Megaphone icon
- Render the new `AdminAnnouncementManager` component in the tab content

**3. Update Student Announcements Banner (`src/components/student/AnnouncementsBanner.tsx`)**
- Add filter for `target_audience` in the query: fetch where `target_audience` is `'students'` or `'both'`

**4. Add Vendor Announcements Banner**
- Show announcements targeted at vendors on the Vendor Dashboard (where `target_audience` is `'vendors'` or `'both'` and created by admins)

### Technical Details

**Migration SQL:**
```sql
-- Add target_audience column
ALTER TABLE public.announcements
  ADD COLUMN target_audience text NOT NULL DEFAULT 'students';

-- Admin INSERT policy
CREATE POLICY "Admins can insert announcements"
  ON public.announcements FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin UPDATE policy
CREATE POLICY "Admins can update own announcements"
  ON public.announcements FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = vendor_id);

-- Admin DELETE policy
CREATE POLICY "Admins can delete own announcements"
  ON public.announcements FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = vendor_id);

-- Update student SELECT to filter by audience
DROP POLICY "Students can view active announcements" ON public.announcements;
CREATE POLICY "Students can view active announcements"
  ON public.announcements FOR SELECT
  USING (
    has_role(auth.uid(), 'student'::app_role)
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (target_audience IN ('students', 'both'))
  );

-- Add vendor SELECT for targeted announcements
CREATE POLICY "Vendors can view targeted announcements"
  ON public.announcements FOR SELECT
  USING (
    has_role(auth.uid(), 'vendor'::app_role)
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (target_audience IN ('vendors', 'both'))
  );
```

**Admin Announcement Manager** will mirror the vendor's `AnnouncementManager` component with these additions:
- A target audience selector in the create/edit dialog (radio group: Students / Vendors / Both)
- Audience badge on each announcement card showing who it targets
- Stores admin's `auth.uid()` in the `vendor_id` field (reusing the existing column)

**Files to create:**
- `src/components/admin/AdminAnnouncementManager.tsx`

**Files to modify:**
- `src/pages/admin/AdminDashboard.tsx` -- add 4th tab
- `src/components/student/AnnouncementsBanner.tsx` -- filter by target audience
- `src/pages/vendor/VendorDashboard.tsx` -- add announcements banner for vendor-targeted messages

**Database migration:**
- One new migration adding the column and updating RLS policies
