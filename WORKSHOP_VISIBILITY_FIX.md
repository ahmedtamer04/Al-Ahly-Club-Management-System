# Workshop Visibility Fix - Rejected Workshops

## Problem
When EventsOffice rejected a workshop, it was still visible to students and they could register for it. This didn't make sense since rejected workshops shouldn't be available.

## Solution Implemented

### 1. Updated Event Retrieval Endpoints (`backend/controllers/eventController.js`)

**Modified Functions:**
- `getUpcomingEvents()` - GET /api/events/upcoming
- `getAllEvents()` - GET /api/events/all
- `filterEvents()` - GET /api/events/filter/:field/:value
- `sortEventsByDate()` - GET /api/events/sort/date/:order
- `getEventById()` - GET /api/events/:id

**Filter Added:**
```javascript
{
  $or: [
    { type: { $ne: "Workshop" } }, // Include all non-workshop events
    { type: "Workshop", "workshop.approval_status": "accepted" } // Only include accepted workshops
  ]
}
```

This ensures that:
- All event types (Trips, Bazaars, Conferences, Booths) are shown normally
- **Only workshops with `approval_status: "accepted"` are visible to students**
- Workshops with status `pending`, `rejected`, or `revision_requested` are hidden from public view

### 2. Updated Registration Controller (`backend/controllers/registrationController.js`)

**Added Validation in `registerForEvent()`:**
```javascript
// Prevent registration for workshops that are not accepted
if (event.type === 'Workshop') {
  const approvalStatus = event.workshop?.approval_status || 'pending';
  if (approvalStatus !== 'accepted') {
    return res.status(403).json({ 
      message: "This workshop is not available for registration.", 
      approval_status: approvalStatus 
    });
  }
}
```

This provides **double protection** - even if someone tries to register directly via API with an event ID, it will be blocked.

### 3. Enhanced getEventById() for Role-Based Access

The `getEventById()` function now:
- Shows **accepted workshops** to everyone
- Shows **non-accepted workshops** only to:
  - EventsOffice users
  - Admin users  
  - The professor who created the workshop
- Returns 404 for all other users trying to access non-accepted workshops

## Workshop Visibility Matrix

| Workshop Status | Visible to Students? | Can Register? | Visible to Professor? | Visible to EventsOffice? |
|----------------|---------------------|---------------|---------------------|------------------------|
| **Pending** | ❌ No | ❌ No | ✅ Yes (own workshops) | ✅ Yes |
| **Accepted** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Rejected** | ❌ No | ❌ No | ✅ Yes (own workshops) | ✅ Yes |
| **Revision Requested** | ❌ No | ❌ No | ✅ Yes (own workshops) | ✅ Yes |

## Testing Checklist

✅ Test that rejected workshops don't appear in:
- Events listing pages
- Search/filter results
- Calendar views
- Upcoming events

✅ Test that students cannot:
- See rejected workshops
- Register for rejected workshops (even with direct API call)

✅ Test that professors can:
- Still see their own pending/rejected workshops
- Edit workshops with revision_requested status
- View their workshop status in "My Workshops" page

✅ Test that EventsOffice can:
- View all workshops regardless of status
- Review pending workshops
- Accept/reject/request edits

## Impact

This fix ensures that the workshop approval workflow is properly enforced:
1. Professors submit workshops → Status: `pending` (hidden from students)
2. EventsOffice reviews → Can accept, reject, or request edits
3. Only **accepted** workshops appear in student-facing views
4. Rejected/pending workshops remain accessible only to relevant staff

## Files Modified

1. `backend/controllers/eventController.js` - Updated 5 functions
2. `backend/controllers/registrationController.js` - Added validation

No database migration needed - the `approval_status` field was already added in the previous implementation.
