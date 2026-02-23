

## Remove Hostel Block Selection from Student Forms

### Overview
Instead of asking students to pick their hostel block every time they submit a form, the app will automatically use the hostel block they chose during account registration (stored in their profile).

### What Changes

The hostel block dropdown will be removed from all 4 student forms:

1. **CleaningRequestForm.tsx** -- Remove the hostel block Select dropdown from the grid. The form already initializes `hostelBlock` from `profile?.hostel_block`.

2. **ApplianceComplaintForm.tsx** -- Same removal. Already initializes from profile.

3. **StoreOrderForm.tsx** -- Remove the hostel block Select from the cart sidebar. Already initializes from profile.

4. **MedicineRequestForm.tsx** -- Remove the hostel block Select. Already initializes from profile.

### Technical Details

In each file:
- Remove the `hostelBlocks` array constant (no longer needed)
- Remove the `<div className="input-group">` block containing the hostel block `<Select>`
- Remove the `Select`-related imports if no other Select remains in the file
- The `formData.hostelBlock` state field stays as-is since it is already pre-filled from `profile?.hostel_block` and is used when submitting
- Adjust grid layouts where needed (e.g., if 2-column grid has an odd number of fields after removal)

No database or backend changes are needed -- the hostel block value still gets submitted with each request, it just comes from the profile automatically.

