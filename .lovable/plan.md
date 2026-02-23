
## Fix Dark Mode Input Visibility

### Problem
In dark mode, input fields on the Login and Reset Password pages have hardcoded `bg-white` backgrounds. Since dark mode sets text color to white/light, typing into these white-background inputs makes the text invisible (white on white).

### Solution
Replace all hardcoded `bg-white` classes with theme-aware alternatives across the affected files.

### Changes

**1. `src/pages/Login.tsx`**
- Replace all `className="bg-white h-11"` on Input components with `className="bg-background h-11"`
- Replace `<SelectTrigger className="bg-white h-11">` with `className="bg-background h-11"`
- Replace all `bg-white/95` on Card components with `bg-card/95` (so cards adapt to dark mode too)

**2. `src/pages/ResetPassword.tsx`**
- Replace `className="bg-white h-11"` on the two password Input fields with `className="bg-background h-11"`
- Replace `bg-white/95` on Card components with `bg-card/95`

**3. `src/pages/About.tsx`**
- Replace `bg-white/95` on the Card with `bg-card/95`

### What stays the same
- The `bg-white/10` classes on header buttons are fine -- those are translucent overlays on the maroon header, not input backgrounds
- The base Input/Textarea/Select components already use `bg-background` by default; the issue is only where individual pages override with `bg-white`

### Result
All form inputs and cards will use theme-aware CSS variables, so text will be visible in both light and dark modes.
