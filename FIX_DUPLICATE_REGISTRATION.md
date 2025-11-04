# Fix: "Already Registered" Error for Unpaid Registrations

## The Problem

When a user:
1. Registers for a paid event
2. Closes the payment modal without paying
3. Tries to register again

They get the error: **"You are already registered for this event"**

But they're NOT actually registered - they just have a pending (unpaid) registration in the database.

## Root Cause

The registration was created with `payment_status: 'pending'` when they first registered. MongoDB's unique index on `(user_id, event_id)` prevents creating a second registration, even though the first one was never paid.

## The Solution

Modified the registration controller to:

1. **Check for existing registrations** before creating a new one
2. **Delete pending registrations** automatically if user tries to register again
3. **Only prevent re-registration** if the existing registration is paid or free

### Code Changes

**File:** `backend/controllers/registrationController.js`

Added this logic before creating a new registration:

```javascript
// Check if user already has a registration for this event
const existingRegistration = await Registration.findOne({
  user_id,
  event_id
});

if (existingRegistration) {
  // If existing registration is pending (unpaid), delete it and allow re-registration
  if (existingRegistration.payment_status === 'pending') {
    console.log('Found pending registration, deleting it to allow re-registration');
    await Registration.findByIdAndDelete(existingRegistration._id);
  } else {
    // If already paid or free, they're truly registered
    return res.status(409).json({ 
      message: "You are already registered for this event.",
      payment_status: existingRegistration.payment_status
    });
  }
}
```

## How It Works Now

### Scenario 1: First Registration
1. User clicks "Register" → Registration created with `payment_status: 'pending'`
2. Payment modal opens
3. ✅ User can complete payment or close modal

### Scenario 2: Abandoned Payment - Try Again
1. User clicks "Register" (has pending registration)
2. Backend finds existing registration with `payment_status: 'pending'`
3. Backend **deletes** the pending registration
4. Backend creates **new** registration with `payment_status: 'pending'`
5. Payment modal opens again
6. ✅ User can try payment again

### Scenario 3: Already Paid - Can't Register Again
1. User clicks "Register" (has paid registration)
2. Backend finds existing registration with `payment_status: 'paid'`
3. ❌ Backend returns error: "You are already registered for this event"
4. This is correct - they shouldn't register twice!

### Scenario 4: Free Event
1. User clicks "Register"
2. Registration created with `payment_status: 'free'`
3. ✅ Immediately confirmed, no payment needed
4. If they try again: ❌ "You are already registered" (correct)

## Benefits

✅ **Fixes the "stuck" registration issue** - Users can retry if they abandon payment

✅ **Prevents actual duplicates** - Can't register twice for same event if already paid

✅ **Automatic cleanup** - Pending registrations are removed when user retries

✅ **Better UX** - No need to manually delete abandoned registrations

✅ **No data pollution** - Database stays clean without orphaned pending registrations

## Testing Scenarios

### Test 1: Abandon Payment and Retry
1. Register for paid workshop ($50)
2. Close payment modal without paying
3. Try to register again
4. ✅ Should work - allows re-registration

### Test 2: Complete Payment and Try Again
1. Register for paid trip ($100)
2. Complete payment with wallet/card
3. Try to register again
4. ❌ Should fail - "You are already registered"

### Test 3: Multiple Abandons
1. Register for event
2. Close payment modal
3. Register again
4. Close payment modal again
5. Register a third time
6. ✅ Should work every time until payment is completed

### Test 4: Free Event
1. Register for free workshop ($0)
2. Registration immediately complete
3. Try to register again
4. ❌ Should fail - "You are already registered"

## Database Impact

### Before Fix:
```javascript
// Multiple pending registrations could pile up
{ user_id: "123", event_id: "456", payment_status: "pending" }  // Abandoned
{ user_id: "123", event_id: "456", payment_status: "pending" }  // Can't create - unique constraint error!
```

### After Fix:
```javascript
// Old pending registration is deleted before creating new one
{ user_id: "123", event_id: "456", payment_status: "pending" }  // Deleted automatically
{ user_id: "123", event_id: "456", payment_status: "pending" }  // New registration created
```

## Edge Cases Handled

### Case 1: Network Error During Registration
- If registration API fails, no registration created
- User can retry immediately
- ✅ Works correctly

### Case 2: Browser Crash After Registration
- Pending registration exists in database
- User comes back and tries again
- Pending registration deleted, new one created
- ✅ Works correctly

### Case 3: User Abandons Multiple Times
- Each attempt deletes previous pending registration
- Only latest pending registration exists
- ✅ Works correctly

### Case 4: Two Users Register for Same Event
- Different `user_id`, so no conflict
- Each has their own registration
- ✅ Works correctly

## Files Modified

- `backend/controllers/registrationController.js` - Added duplicate check and cleanup logic

## Related Fixes

This fix works together with:
1. **Payment modal close handler** - Calls cancel-unpaid endpoint when modal closed
2. **Pending registration filter** - viewRegisteredEvents doesn't show pending registrations
3. **Payment status tracking** - Registration model tracks payment status

## Summary

**Before:** "Already registered" error even when not actually registered (just pending)

**After:** Pending registrations automatically cleaned up, allowing users to retry payment

**Result:** Better user experience, cleaner database, no stuck registrations

---

**Status:** FIXED ✅  
**Date:** 2025-01-04  
**Version:** 1.2
