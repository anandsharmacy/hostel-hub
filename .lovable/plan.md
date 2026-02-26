

## Rework Signup Form: Add Gender Field with Conditional Hostel Blocks

### Changes to `src/pages/Login.tsx`

1. **Add `gender` field to signup schema** — Add `gender: z.enum(['male', 'female']).optional()` to the Zod schema

2. **Watch gender value** — Add `watch('gender')` alongside existing `watch('role')`

3. **Add Gender selector for all roles** — After the role selector, show a "Gender" select (Male / Female) for Student, Vendor, and Admin

4. **Conditional hostel block options for Students** — When role is Student:
   - If gender is Male: show only Hostel B1, Hostel B2
   - If gender is Female: show only Hostel G1, Hostel G2
   - Reset hostel block value when gender changes

5. **For Vendor/Admin** — Gender field is shown but hostel block is not displayed (existing behavior preserved)

6. **Reset logic** — When gender changes, clear the hostel block selection to prevent invalid combinations

### No database or backend changes needed
Gender is only used for form filtering; it is not stored in the database.

