# Event Rating System Implementation

## Overview
This implementation allows Students, Staff, TAs, and Professors to rate events they have attended. The system ensures that only users who registered and paid for (or attended free) events can submit ratings.

## Features
- ✅ Rate events with a score from 1-5 stars
- ✅ Add optional review text (up to 500 characters)
- ✅ Update existing ratings
- ✅ Delete ratings
- ✅ View all ratings for an event
- ✅ View your own rating for an event
- ✅ Automatic calculation of average rating and total ratings count
- ✅ Validation to ensure only attended events can be rated
- ✅ Validation to ensure only completed events can be rated
- ✅ One rating per user per event

## Database Schema

### Rating Model
```javascript
{
  event_id: ObjectId (ref: Event),
  user_id: ObjectId (ref: User),
  rating: Number (1-5, required),
  review: String (optional, max 500 chars),
  createdAt: Date,
  updatedAt: Date
}
```

### Event Model Updates
Added two new fields to the Event model:
```javascript
{
  average_rating: Number (0-5, default: 0),
  total_ratings: Number (default: 0)
}
```

## API Endpoints

### 1. Submit or Update a Rating
**Endpoint:** `POST /events/:eventId/rate`

**Authentication:** Required (Student, Staff, TA, Professor)

**Request Body:**
```json
{
  "rating": 5,
  "review": "Great event! Very informative and well organized."
}
```

**Response (Success - New Rating):**
```json
{
  "message": "Rating submitted successfully",
  "rating": {
    "_id": "...",
    "event_id": "...",
    "user_id": "...",
    "rating": 5,
    "review": "Great event! Very informative and well organized.",
    "createdAt": "2025-11-23T...",
    "updatedAt": "2025-11-23T..."
  },
  "event": {
    "id": "...",
    "name": "Workshop Name",
    "average_rating": 4.5,
    "total_ratings": 10
  }
}
```

**Response (Success - Updated Rating):**
```json
{
  "message": "Rating updated successfully",
  "rating": { ... },
  "event": { ... }
}
```

**Error Responses:**
- `400` - Rating must be between 1 and 5
- `400` - You can only rate events that have been completed
- `403` - You can only rate events you have attended
- `404` - Event not found

### 2. Get All Ratings for an Event
**Endpoint:** `GET /events/:eventId/ratings`

**Authentication:** Required (Student, Staff, TA, Professor)

**Response:**
```json
{
  "event": {
    "id": "...",
    "name": "Workshop Name",
    "average_rating": 4.5,
    "total_ratings": 10
  },
  "ratings": [
    {
      "_id": "...",
      "event_id": "...",
      "user_id": {
        "_id": "...",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com"
      },
      "rating": 5,
      "review": "Great event!",
      "createdAt": "2025-11-23T...",
      "updatedAt": "2025-11-23T..."
    },
    // ... more ratings
  ]
}
```

### 3. Get My Rating for an Event
**Endpoint:** `GET /events/:eventId/my-rating`

**Authentication:** Required (Student, Staff, TA, Professor)

**Response (Has Rating):**
```json
{
  "rating": {
    "_id": "...",
    "event_id": "...",
    "user_id": { ... },
    "rating": 5,
    "review": "Great event!",
    "createdAt": "2025-11-23T...",
    "updatedAt": "2025-11-23T..."
  },
  "event": {
    "id": "...",
    "name": "Workshop Name",
    "average_rating": 4.5,
    "total_ratings": 10
  }
}
```

**Response (No Rating):**
```json
{
  "message": "You have not rated this event yet",
  "canRate": false
}
```

### 4. Delete My Rating
**Endpoint:** `DELETE /events/:eventId/rate`

**Authentication:** Required (Student, Staff, TA, Professor)

**Response:**
```json
{
  "message": "Rating deleted successfully",
  "event": {
    "id": "...",
    "name": "Workshop Name",
    "average_rating": 4.3,
    "total_ratings": 9
  }
}
```

**Error Responses:**
- `404` - Event not found
- `404` - Rating not found

## Business Rules

### Who Can Rate?
- Students, Staff, TAs, and Professors who have:
  1. Registered for the event
  2. Have a registration status of "registered" (not cancelled)
  3. Have a payment status of "paid" or "free"

### When Can They Rate?
- Only after the event has been completed (event.status === "completed" OR event.end_date < current date)

### Rating Constraints
- Rating value must be between 1 and 5 (inclusive)
- Review is optional but limited to 500 characters
- Each user can only have one rating per event
- If a user rates an event they've already rated, their previous rating is updated

### Average Rating Calculation
- Automatically recalculated whenever a rating is added, updated, or deleted
- Rounded to 1 decimal place (e.g., 4.3, 4.7)
- Stored in the Event model for quick access

## Usage Examples

### Example 1: Submit a Rating
```bash
curl -X POST http://localhost:5001/events/652ad81e23f3c9b96a8120b4/rate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "review": "Excellent workshop! Learned a lot about React."
  }'
```

### Example 2: Get All Ratings
```bash
curl -X GET http://localhost:5001/events/652ad81e23f3c9b96a8120b4/ratings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example 3: Get My Rating
```bash
curl -X GET http://localhost:5001/events/652ad81e23f3c9b96a8120b4/my-rating \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example 4: Update My Rating
```bash
curl -X POST http://localhost:5001/events/652ad81e23f3c9b96a8120b4/rate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 4,
    "review": "Good workshop, but could be better organized."
  }'
```

### Example 5: Delete My Rating
```bash
curl -X DELETE http://localhost:5001/events/652ad81e23f3c9b96a8120b4/rate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Files Modified/Created

### Created Files
1. `backend/models/Rating.js` - Rating model schema

### Modified Files
1. `backend/models/Events.js` - Added average_rating and total_ratings fields
2. `backend/controllers/eventController.js` - Added rating controller methods
3. `backend/routes/eventRoutes.js` - Added rating routes

## Testing Checklist

- [ ] Test submitting a rating for an attended event
- [ ] Test updating an existing rating
- [ ] Test deleting a rating
- [ ] Test viewing all ratings for an event
- [ ] Test viewing your own rating
- [ ] Test rating validation (1-5 range)
- [ ] Test that users cannot rate events they haven't attended
- [ ] Test that users cannot rate events that haven't completed
- [ ] Test that average rating is calculated correctly
- [ ] Test that total ratings count is updated correctly
- [ ] Test that duplicate ratings are prevented (one per user per event)

## Frontend Integration Tips

### Display Event Rating
```javascript
const EventCard = ({ event }) => (
  <div>
    <h3>{event.name}</h3>
    <div className="rating">
      <span>⭐ {event.average_rating.toFixed(1)}</span>
      <span>({event.total_ratings} ratings)</span>
    </div>
  </div>
);
```

### Rating Form Component
```javascript
const RatingForm = ({ eventId, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post(`/events/${eventId}/rate`, { rating, review });
    onSubmit();
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <StarRating value={rating} onChange={setRating} />
      <textarea 
        value={review} 
        onChange={(e) => setReview(e.target.value)}
        maxLength={500}
        placeholder="Write your review (optional)"
      />
      <button type="submit">Submit Rating</button>
    </form>
  );
};
```

## Notes
- Ratings are preserved even if a user's registration is cancelled later
- Event organizers and admins can view all ratings but cannot manipulate them
- Consider adding admin functionality to hide/flag inappropriate reviews if needed
- The average rating is displayed with the event details for all users to see
