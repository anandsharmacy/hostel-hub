

## Rework: Dynamic Expected Arrival Based on Queue Position

### Overview
Instead of always showing "first 2 hours of availability," the expected arrival time will now be calculated based on how many other cleaning bookings already exist for the same date with overlapping time windows. Each cleaning takes approximately 30 minutes, so the student's position in the queue determines when staff will likely arrive.

### How It Will Work

1. Student selects their availability window (e.g., 10 AM - 2 PM) using the existing slider
2. The system queries the database for all existing pending/in-progress cleaning requests on the same date whose availability overlaps with the student's window
3. The student's queue position = number of overlapping bookings ahead of them
4. Expected arrival is calculated as:
   - **Start**: availability_start + (queue_position x 30 minutes)
   - **End**: expected_arrival_start + 30 minutes
   - Capped within the student's availability window
5. The form shows a live-updating expected arrival time as the student adjusts their date and availability
6. If the queue is full (arrival would exceed the availability window), a warning is shown

### Example

- Student picks: **10 AM - 2 PM** on March 1st
- There are already **3 bookings** overlapping that window on March 1st
- Queue position = 3 (0-indexed: 4th in line)
- Expected arrival: **11:30 AM - 12:00 PM** (10 AM + 3 x 30 min)

### Files to Modify

**1. `src/pages/student/CleaningRequestForm.tsx`**
- Add a database query that fetches existing cleaning requests for the selected date
- Count overlapping bookings (those whose availability window intersects with the student's chosen window, with status pending or in-progress)
- Dynamically calculate expected arrival based on queue position
- Show the queue count to the student (e.g., "There are 3 bookings ahead of you")
- Show a warning if the calculated arrival time falls outside the availability window
- Re-query whenever the date or availability slider changes

**2. `src/contexts/DataContext.tsx`**
- No structural changes needed; the form will query the database directly for the count since it needs a filtered, real-time query specific to the form's inputs

**3. `src/pages/student/MyRequests.tsx`**
- No changes needed; it already displays expectedArrivalStart and expectedArrivalEnd from the saved data

**4. `src/pages/admin/AdminDashboard.tsx`**
- Add a display of queue position number alongside the expected arrival time for staff visibility

### Technical Details

**Queue Count Query:**
When the student selects a date and adjusts the slider, the form queries:
```text
SELECT COUNT(*) FROM cleaning_requests
WHERE preferred_date = [selected_date]
  AND status IN ('pending', 'in-progress')
  AND availability_start IS NOT NULL
  AND availability_end IS NOT NULL
  -- Overlap check: other booking's window intersects with student's window
```

The overlap is checked by comparing hour values. Since availability times are stored as text like "10:00 AM", we parse them for comparison.

**Arrival Calculation Logic:**
```text
queuePosition = number of overlapping bookings
arrivalStartHour = availabilityStartHour + (queuePosition * 0.5)
arrivalEndHour = arrivalStartHour + 0.5

if arrivalEndHour > availabilityEndHour:
  show warning "Your window is full, please choose a wider range or different date"
```

**Real-time Updates:**
- The query re-runs when the student changes the date or moves the slider
- A debounce is used on slider changes to avoid excessive database calls
- A loading indicator shows while the count is being fetched

**What the Student Sees:**
- The availability slider (unchanged)
- A small info line: "X bookings ahead of you on this date"
- The expected arrival badge dynamically calculated
- A warning alert if the window is too crowded

