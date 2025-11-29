# Viewing Ratings and Comments - Implementation Summary

## Current Implementation Status: ✅ ALREADY IMPLEMENTED

The ability for Students, Staff, Events Office, TAs, Professors, and Admins to view all ratings and comments on any event is **already fully implemented** in the system.

## Available Endpoints

### 1. View All Comments on an Event
**Endpoint:** `GET /events/:event_id/comments`

**Access:** All authenticated users (Student, Staff, EventsOffice, TA, Professor, Admin)

**Authorization:** `requireStudentOrAbove` middleware

**What it returns:**
- All visible comments
- All deleted comments (for moderation/admin purposes)
- Comment statistics (total, active, deleted)
- Author information for each comment

**Example Request:**
```bash
curl -X GET http://localhost:5001/events/652ad81e23f3c9b96a8120b4/comments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Response:**
```json
{
  "comments": [
    {
      "_id": "...",
      "event_id": "...",
      "author_id": {
        "_id": "...",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com"
      },
      "body": "Great event!",
      "status": "visible",
      "createdAt": "2025-11-23T...",
      "updatedAt": "2025-11-23T..."
    },
    // ... more comments
  ],
  "totalComments": 15,
  "activeComments": 13,
  "deletedComments": 2
}
```

### 2. View All Ratings on an Event
**Endpoint:** `GET /events/:eventId/ratings`

**Access:** All authenticated users (Student, Staff, EventsOffice, TA, Professor, Admin)

**Authorization:** `requireStudentOrAbove` middleware

**What it returns:**
- Event summary (name, average rating, total ratings)
- All individual ratings with reviewer details
- Review text for each rating

**Example Request:**
```bash
curl -X GET http://localhost:5001/events/652ad81e23f3c9b96a8120b4/ratings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Response:**
```json
{
  "event": {
    "id": "652ad81e23f3c9b96a8120b4",
    "name": "React Workshop",
    "average_rating": 4.5,
    "total_ratings": 10
  },
  "ratings": [
    {
      "_id": "...",
      "event_id": "...",
      "user_id": {
        "_id": "...",
        "first_name": "Jane",
        "last_name": "Smith",
        "email": "jane.smith@example.com"
      },
      "rating": 5,
      "review": "Excellent workshop! Very informative.",
      "createdAt": "2025-11-23T...",
      "updatedAt": "2025-11-23T..."
    },
    // ... more ratings
  ]
}
```

## Authorization Details

### Middleware: `requireStudentOrAbove`
Located in: `backend/middleware/auth.js`

**Includes the following roles:**
- ✅ Admin
- ✅ EventsOffice
- ✅ Staff
- ✅ Professor
- ✅ TA
- ✅ Student

**Definition:**
```javascript
export const requireStudentOrAbove = authorize('Admin', 'EventsOffice', 'Staff', 'Professor', 'TA', 'Student');
```

This means **any authenticated user** with one of these roles can view ratings and comments on any event.

## Implementation Files

### Routes
**File:** `backend/routes/eventRoutes.js`

```javascript
// GET event comments by ID
router.get("/:event_id/comments", auth, requireStudentOrAbove, getEventComments);

// GET all ratings for an event
router.get("/:eventId/ratings", auth, requireStudentOrAbove, getEventRatings);
```

### Controllers
**File:** `backend/controllers/eventController.js`

**Methods:**
1. `getEventComments` - Fetches all comments (visible and deleted) for an event
2. `getEventRatings` - Fetches all ratings for an event

## Key Features

### Comments View
✅ Returns both visible and deleted comments  
✅ Includes author information (name, email)  
✅ Shows who deleted a comment (for deleted comments)  
✅ Sorted by creation date (newest first)  
✅ Includes statistics (total, active, deleted counts)  

### Ratings View
✅ Shows event summary with average rating  
✅ Returns all individual ratings  
✅ Includes reviewer information (name, email)  
✅ Shows rating value (1-5) and review text  
✅ Sorted by creation date (newest first)  

## No Additional Development Needed

The requirement is **fully satisfied** by the existing implementation. All user types mentioned (Student, Staff, Events Office, TA, Professor, Admin) already have access to view ratings and comments through these endpoints.

### What Users Can Do:

| User Type | View Comments | View Ratings |
|-----------|--------------|--------------|
| Student | ✅ Yes | ✅ Yes |
| Staff | ✅ Yes | ✅ Yes |
| TA | ✅ Yes | ✅ Yes |
| Professor | ✅ Yes | ✅ Yes |
| EventsOffice | ✅ Yes | ✅ Yes |
| Admin | ✅ Yes | ✅ Yes |

## Additional Context

### Who Can Create Comments/Ratings?
Only users who **attended** the event (registered and paid/free status) can create comments and ratings.

### Who Can View Comments/Ratings?
**Everyone** with a valid account (any of the roles above) can view comments and ratings, regardless of whether they attended the event.

This design allows for:
- Transparency - Anyone can see feedback about events
- Decision-making - Users can read reviews before registering for similar future events
- Quality control - Event organizers can see all feedback
- Moderation - Admins can see deleted comments

## Testing

To test viewing capabilities for different user roles:

1. **As a Student (who didn't attend):**
```bash
# Login as student
curl -X POST http://localhost:5001/auth/login -H "Content-Type: application/json" -d '{"email":"student@example.com","password":"password"}'

# View comments
curl -X GET http://localhost:5001/events/EVENT_ID/comments -H "Authorization: Bearer STUDENT_TOKEN"

# View ratings
curl -X GET http://localhost:5001/events/EVENT_ID/ratings -H "Authorization: Bearer STUDENT_TOKEN"
```

2. **As Events Office:**
```bash
# Same pattern with EventsOffice credentials
```

3. **As Admin:**
```bash
# Same pattern with Admin credentials
```

All should return the same data (comments and ratings for the event).
