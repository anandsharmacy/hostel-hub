

## Show Expected Arrival Time After Submitting Cleaning Request

### Problem
When a student submits a cleaning request, they only see a generic "Cleaning request submitted successfully!" toast message. The expected arrival time is calculated and saved, but the student doesn't get immediate confirmation of when to expect the cleaning staff.

### Solution
Update the success toast in `CleaningRequestForm.tsx` to include the expected arrival time window.

### Changes

**`src/pages/student/CleaningRequestForm.tsx`**
- Modify the `toast.success()` call after successful submission to include the expected arrival time
- Change from a simple string toast to a rich toast that shows:
  - "Cleaning request submitted successfully!"
  - "Staff may arrive between [start] - [end]"
- Save the expected arrival values before resetting the form state (currently the form resets `startHour`/`endHour` before the toast could reference them, but `expectedArrival.start`/`expectedArrival.end` are captured before the reset)

### Technical Detail
The `expectedArrival.start` and `expectedArrival.end` values need to be captured into local variables before the form state is reset, since resetting `startHour`/`endHour` would change the computed `expectedArrival` memo. The toast will use these captured values.

```
// Before reset:
const arrivalStart = expectedArrival.start;
const arrivalEnd = expectedArrival.end;

// Then reset form...

// Then show toast with saved values:
toast.success(`Request submitted! Staff may arrive between ${arrivalStart} - ${arrivalEnd}`);
```

### Files Modified
- `src/pages/student/CleaningRequestForm.tsx` (1 file, ~5 lines changed)
