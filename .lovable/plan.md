

## Rework: Room Availability Sliders + Expected Arrival Time

### Overview
Replace the current 20-minute time slot dropdown with a dual-handle hour range slider where students specify when they are available in their room. The system enforces a minimum 2-hour window and tells the student that cleaning staff may arrive anytime within that window (up to 2 hours from the start).

### How It Will Work (Student Experience)

1. Student picks a date (same as now)
2. Instead of a time slot dropdown, they see a **dual-handle slider** (8 AM to 5 PM range)
3. The slider enforces a **minimum 2-hour gap** between start and end
4. Labels show the selected availability window (e.g., "10:00 AM - 1:00 PM")
5. Below the slider, a prominent alert says: **"Our cleaning staff may arrive anytime between 10:00 AM and 12:00 PM"** (i.e., up to 2 hours from the start of availability)
6. The full availability window and the expected arrival window are both saved to the database

### Database Changes

Add 4 new columns to `cleaning_requests`:
- `availability_start` (text) -- e.g., "10:00 AM"
- `availability_end` (text) -- e.g., "1:00 PM"  
- `expected_arrival_start` (text) -- same as availability_start
- `expected_arrival_end` (text) -- availability_start + 2 hours

The existing `preferred_time` column will store a summary string like "10:00 AM - 1:00 PM" for backward compatibility.

### Files to Modify

**1. New database migration**
- Add `availability_start`, `availability_end`, `expected_arrival_start`, `expected_arrival_end` columns to `cleaning_requests`

**2. `src/pages/student/CleaningRequestForm.tsx`**
- Remove the time slot dropdown and related logic (generateTimeSlots, blockedSlots filtering for time)
- Add a dual-handle Slider component (Radix slider supports multiple thumbs) with range 8-17 (representing hours)
- Enforce minimum 2-hour gap via the slider's `minStepsBetweenThumbs` prop
- Display formatted time labels above/below the slider
- Show the "Expected Arrival" alert: start of availability to start + 2 hours
- On submit, save the availability window and computed arrival window

**3. `src/contexts/DataContext.tsx`**
- Update `CleaningRequest` interface to add `availabilityStart`, `availabilityEnd`, `expectedArrivalStart`, `expectedArrivalEnd`
- Update `mapCleaningRequest` to map the new columns
- Update `addCleaningRequest` to insert the new fields

**4. `src/pages/student/MyRequests.tsx`**
- Show the expected arrival time window prominently for each cleaning request (e.g., a colored badge: "Staff may arrive between 10:00 AM - 12:00 PM")
- Show the full availability window as secondary info

**5. `src/pages/admin/AdminDashboard.tsx`**
- Display both the student's availability window and expected arrival time for each cleaning request

### Technical Details

**Slider Configuration:**
- Range: 8 to 17 (representing 8 AM to 5 PM)
- Step: 1 (hourly increments)
- `minStepsBetweenThumbs`: 2 (enforces minimum 2-hour window)
- Default value: [10, 14] (10 AM - 2 PM)

**Expected Arrival Calculation:**
- `expectedArrivalStart` = availability start time
- `expectedArrivalEnd` = availability start + 2 hours (capped at availability end)

**Time Formatting Helper:**
```text
hour 8  -> "8:00 AM"
hour 12 -> "12:00 PM"
hour 17 -> "5:00 PM"
```

**Migration SQL:**
```text
ALTER TABLE public.cleaning_requests
ADD COLUMN availability_start text,
ADD COLUMN availability_end text,
ADD COLUMN expected_arrival_start text,
ADD COLUMN expected_arrival_end text;
```
