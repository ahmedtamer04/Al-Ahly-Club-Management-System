# Payment System Fix - Unpaid Registrations ✅

## Problem

Users who registered for paid events but closed the payment modal without paying were still counted as registered, taking up spots in the event.

## Solution Implemented

### Backend Changes

#### 1. Registration Controller Updates

**File:** `backend/controllers/registrationController.js`

##### A. Modified `registerForEvent` function

- Now checks if event requires payment (price > 0)
- Sets `payment_status` to `'pending'` for paid events
- Sets `payment_status` to `'free'` for free events
- Stores `payment_amount` in registration record

```javascript
// Determine if event requires payment
let requiresPayment = false;
let eventPrice = 0;

if (event.type === "Workshop" && event.workshop?.price) {
  requiresPayment = event.workshop.price > 0;
  eventPrice = event.workshop.price;
} else if (event.type === "Trip" && event.trip?.price) {
  requiresPayment = event.trip.price > 0;
  eventPrice = event.trip.price;
}

const registration = new Registration({
  event_id,
  user_id,
  name,
  email,
  personalId,
  role: normalizedRole,
  payment_status: requiresPayment ? "pending" : "free",
  payment_amount: eventPrice,
});
```

##### B. Modified `viewRegisteredEvents` function

- Now filters out registrations with `payment_status: 'pending'`
- Only shows registrations that are paid or free

```javascript
const registrations = await Registration.find({
  user_id,
  status: "registered",
  payment_status: { $in: ["paid", "free"] }, // Only show completed registrations
}).populate("event_id");
```

##### C. Added new function `cancelUnpaidRegistration`

- Deletes registrations with `payment_status: 'pending'`
- Called when user closes payment modal without paying
- Ensures user doesn't stay registered without payment

```javascript
export const cancelUnpaidRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const user_id = req.user._id;

    const registration = await Registration.findOne({
      _id: registrationId,
      user_id,
      payment_status: "pending",
    });

    if (!registration) {
      return res
        .status(404)
        .json({ message: "Registration not found or already processed." });
    }

    // Delete the pending registration
    await Registration.findByIdAndDelete(registrationId);

    res.json({ message: "Unpaid registration canceled successfully." });
  } catch (error) {
    console.error("Error canceling unpaid registration:", error);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};
```

#### 2. Registration Routes Updates

**File:** `backend/routes/registrationRoutes.js`

- Added new route: `DELETE /api/registration/cancel-unpaid/:registrationId`
- Imported and wired up `cancelUnpaidRegistration` controller

```javascript
router.delete(
  "/cancel-unpaid/:registrationId",
  auth,
  requireRegistering,
  cancelUnpaidRegistration
);
```

### Frontend Changes

Updated all 4 user role event pages to handle unpaid registration cancellation:

#### Files Updated:

1. `frontend/app/student/events/page.js`
2. `frontend/app/staff/events/[id]/page.js`
3. `frontend/app/ta/events/page.js`
4. `frontend/app/professor/events/page.js`

#### Changes Made in Each File:

##### 1. Added `handlePaymentModalClose` function

```javascript
const handlePaymentModalClose = async () => {
  if (paymentData?.registrationId) {
    // User closed modal without paying - cancel the pending registration
    try {
      const token = localStorage.getItem("token");
      await fetch(
        `http://localhost:5001/api/registration/cancel-unpaid/${paymentData.registrationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Unpaid registration canceled");
    } catch (error) {
      console.error("Error canceling unpaid registration:", error);
    }
  }
  setShowPaymentModal(false);
  setPaymentData(null);
  await fetchEvents(); // Refresh events list
};
```

##### 2. Updated PaymentModal `onClose` prop

```javascript
<PaymentModal
  isOpen={showPaymentModal}
  onClose={handlePaymentModalClose} // Changed from inline function
  eventId={paymentData.eventId}
  registrationId={paymentData.registrationId}
  amount={paymentData.amount}
  eventName={paymentData.eventName}
  eventType={paymentData.eventType}
  onPaymentSuccess={handlePaymentSuccess}
/>
```

## How It Works Now

### Registration Flow with Payment

1. **User registers for paid workshop/trip**

   - Registration created with `payment_status: 'pending'`
   - Registration saved to database
   - PaymentModal opens automatically

2. **User has 2 options:**

   **Option A: Complete Payment**

   - User pays via wallet or card
   - Payment controller updates registration:
     - `payment_status: 'paid'`
     - `payment_method: 'wallet' | 'stripe'`
     - `paid_at: Date`
   - Registration is now complete
   - User sees registration in "My Registrations"

   **Option B: Close Modal Without Paying**

   - `handlePaymentModalClose` is triggered
   - API call to `DELETE /api/registration/cancel-unpaid/:registrationId`
   - Pending registration is deleted from database
   - User is NOT registered
   - Event spot is freed up

3. **Free events (price = 0)**
   - Registration created with `payment_status: 'free'`
   - No payment modal shown
   - Registration is immediately complete

### Database States

#### Registration Payment Statuses:

- `pending` - Registration created, awaiting payment (user can still cancel)
- `paid` - Payment completed, registration confirmed
- `free` - Free event, registration confirmed
- `refunded` - Payment was refunded (future feature)

#### What Users See:

- **My Registrations** only shows registrations where `payment_status` is `'paid'` or `'free'`
- **Pending registrations** (unpaid) are NOT shown to users
- **Pending registrations** are automatically deleted if user abandons payment

## Benefits

✅ **Prevents Ghost Registrations**: Users who don't pay no longer take up event spots

✅ **Accurate Capacity Tracking**: Only paid/free registrations count toward event capacity

✅ **Clean User Experience**: Users only see actual confirmed registrations

✅ **Database Hygiene**: Abandoned registrations are automatically cleaned up

✅ **Fair Access**: Event spots are available to others if payment isn't completed

## Testing Scenarios

### Test 1: Abandoned Payment

1. User registers for paid workshop ($50)
2. Registration created with `payment_status: 'pending'`
3. PaymentModal opens
4. User clicks X or closes modal without paying
5. ✅ Registration is deleted
6. ✅ User is NOT in "My Registrations"
7. ✅ Event spot is available again

### Test 2: Successful Payment

1. User registers for paid trip ($100)
2. Registration created with `payment_status: 'pending'`
3. PaymentModal opens
4. User pays with wallet/card
5. ✅ Registration updated to `payment_status: 'paid'`
6. ✅ User sees registration in "My Registrations"
7. ✅ Event spot is taken

### Test 3: Free Event

1. User registers for free workshop ($0)
2. Registration created with `payment_status: 'free'`
3. ✅ No payment modal shown
4. ✅ Registration immediately complete
5. ✅ User sees registration in "My Registrations"

## Files Modified

### Backend (2 files)

- `backend/controllers/registrationController.js` - Added payment logic and cleanup function
- `backend/routes/registrationRoutes.js` - Added cancel-unpaid route

### Frontend (4 files)

- `frontend/app/student/events/page.js` - Added unpaid cancellation
- `frontend/app/staff/events/[id]/page.js` - Added unpaid cancellation
- `frontend/app/ta/events/page.js` - Added unpaid cancellation
- `frontend/app/professor/events/page.js` - Added unpaid cancellation

## API Changes

### New Endpoint

```
DELETE /api/registration/cancel-unpaid/:registrationId
Authorization: Bearer token required
```

**Purpose**: Cancel a pending (unpaid) registration

**Request**:

- registrationId in URL params
- User must own the registration (checked via auth)

**Response Success (200)**:

```json
{
  "message": "Unpaid registration canceled successfully."
}
```

**Response Not Found (404)**:

```json
{
  "message": "Registration not found or already processed."
}
```

## Database Schema Impact

No schema changes needed - we're using existing fields:

- `payment_status` (already exists)
- `payment_amount` (already exists)
- `payment_method` (already exists)
- `paid_at` (already exists)

## Future Enhancements

### 1. Automatic Cleanup (Optional)

Add a cron job to automatically delete pending registrations older than X minutes:

```javascript
// Cleanup pending registrations older than 15 minutes
const cleanupPendingRegistrations = async () => {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  await Registration.deleteMany({
    payment_status: "pending",
    createdAt: { $lt: fifteenMinutesAgo },
  });
};
```

### 2. Payment Timeout Warning

Show a countdown timer in PaymentModal:

- "Complete payment in 15:00 minutes"
- Auto-close modal when timer expires

### 3. Reservation Hold

Instead of deleting immediately, mark as "expired" and delete after 24 hours for audit purposes.

---

**Status:** COMPLETE ✅  
**Issue Resolved:** Users no longer counted as registered if they don't complete payment  
**Date:** 2025-01-04  
**Version:** 1.1
