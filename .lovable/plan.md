

## Problem

Cleaning requests store whatever `hostel_block` value comes from the student's profile (e.g. "Block B", "B", "B2", "block B"). The admin sees these raw values instead of the standardized "Hostel B1" / "Hostel B2" naming.

## Fix

**1. Create a shared hostel normalization utility** (`src/lib/hostelUtils.ts`)
- A function `normalizeHostelDisplay(raw: string): string` that maps common variants to proper names:
  - "B", "Block B", "block B" → "Hostel B1" (default for ambiguous "B")
  - "B1" → "Hostel B1", "B2" → "Hostel B2"
  - "G", "Block G" → "Hostel G1"
  - "G1" → "Hostel G1", "G2" → "Hostel G2"
  - Already correct values like "Hostel B1" pass through unchanged

**2. Update `src/pages/admin/AdminDashboard.tsx`**
- Import `normalizeHostelDisplay`
- In cleaning request display (line 192), replace `{request.hostelBlock}` with `{normalizeHostelDisplay(request.hostelBlock)}`
- Same for appliance complaint display (line 299)

**3. Update `src/pages/student/CleaningRequestForm.tsx`**
- Normalize the hostel block before saving, so future requests store the proper name
- `hostelBlock: normalizeHostelDisplay(formData.hostelBlock)`

**4. Update other student forms** (ApplianceComplaintForm, StoreOrderForm, MedicineRequestForm)
- Same normalization at submission time for consistency

This ensures both existing and new requests display properly in the admin view.

### Files changed
- `src/lib/hostelUtils.ts` (new)
- `src/pages/admin/AdminDashboard.tsx`
- `src/pages/student/CleaningRequestForm.tsx`
- `src/pages/student/ApplianceComplaintForm.tsx`
- `src/pages/student/StoreOrderForm.tsx`
- `src/pages/student/MedicineRequestForm.tsx`

