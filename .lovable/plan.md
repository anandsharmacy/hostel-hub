

## Fix: Appliance Image URL Storage

### Root Cause
The `ApplianceComplaintForm` stores the full public URL in the database. When the admin dashboard calls `createSignedUrl()` with that full URL as a path, it produces a malformed double-prefixed URL, causing 404.

### Changes

**1. `src/pages/student/ApplianceComplaintForm.tsx`** — Store only the relative path
- Change `uploadImage` to return `path` (e.g., `userId/timestamp.png`) instead of calling `getPublicUrl` and returning the full URL

**2. `src/pages/admin/AdminDashboard.tsx`** — Handle both legacy full URLs and new paths
- If `complaint.imageUrl` starts with `http`, open it directly (legacy data)
- Otherwise, generate a signed URL from the storage path (new data)

**3. `src/pages/student/MyRequests.tsx`** — Same dual handling if appliance images are displayed there

No database or migration changes needed.

