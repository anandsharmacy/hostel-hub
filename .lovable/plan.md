

## Problem

The Salon tab shows only the mirror with no chairs beneath it. This happens because the student's `hostel_block` in their profile (e.g. "Block B", "B", "B2") doesn't match the `salon_chairs` table values ("Hostel B1", "Hostel B2", etc.), so the query returns zero chairs.

## Fix: `src/components/student/SalonQueueView.tsx`

1. **Add a hostel block mapping function** that normalizes the student's profile `hostel_block` value to match the salon_chairs naming:
   - "B", "Block B", "block B", "B1" → "Hostel B1"
   - "B2" → "Hostel B2"  
   - "G1", "Hostel G1" → "Hostel G1"
   - etc.
   - Since B1 and B2 share a "B" block concept, if the value is ambiguous (just "B" or "Block B"), default to "Hostel B1" (or show both B1 and B2 salons).

2. **Ensure 3 chairs always render** even when no barber is assigned — each chair shows the `Armchair` icon, chair number, and "Vacant" or barber name, matching the reference layout (mirror on top, 3 chairs below with icons).

3. **Fallback**: If the mapping can't determine a hostel, show a message asking the student to update their profile with a valid hostel block value.

This is a single-file change to `SalonQueueView.tsx`.

