

## Plan: Add Revenue PIN during Laundry Owner Signup

When a user selects "Laundry Owner" as their role during account creation, show an additional 4-digit PIN field. This PIN gets saved to `laundry_settings` after successful signup.

### Changes

**1. Modify `src/pages/Login.tsx`**
- Add `revenuePin` field to the signup schema (conditionally required when role is `laundry`, must be exactly 4 digits)
- Add a PIN input field that appears only when "Laundry Owner" role is selected, below the role selector (near the approval warning)
- In `onSignupSubmit`, after successful account creation for laundry role, insert the PIN into `laundry_settings` table before signing out

**2. Modify `src/components/student/LaundryRevenueTracker.tsx`**
- Remove the "Set PIN" flow (first-time setup screen) since PIN is now collected at signup
- The component will always show the "Enter PIN to unlock" screen when locked, since PIN is guaranteed to exist for laundry users

### No database changes needed
The `laundry_settings` table already exists with the correct schema (`user_id`, `revenue_pin`).

