# Event Comment System Implementation

## Overview
This implementation allows Students, Staff, TAs, and Professors to comment on events they have attended. The system ensures that only users who registered and paid for (or attended free) events can submit comments.

## Features
- ✅ Post comments on attended events
- ✅ Update your own comments
- ✅ Delete your own comments
- ✅ View all comments for an event
- ✅ View your own comment for an event
- ✅ Comments limited to 1000 characters
- ✅ Validation to ensure only attended events can be commented on
- ✅ Soft delete for comments (marked as deleted, not permanently removed)
- ✅ Prevent editing or deleting already deleted comments

## Database Schema

### Comment Model (Updated)
```javascript
{
  event_id: ObjectId (ref: Event, required),
  author_id: ObjectId (ref: User, required),
  body: String (required, max 1000 chars, trimmed),
  status: String (enum: ["visible", "deleted"], default: "visible"),
  deleted_by: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ event_id: 1, status: 1 }` - For querying comments by event
- `{ author_id: 1, event_id: 1 }` - For querying user's comments

## API Endpoints

### 1. Create a Comment
**Endpoint:** `POST /events/:eventId/comments`

**Authentication:** Required (Student, Staff, TA, Professor)

**Request Body:**
```json
{
  "body": "This was an excellent event! I learned so much about React and modern web development."
}
```

**Response (Success):**
```json
{
  "message": "Comment created successfully",
  "comment": {
    "_id": "...",
    "event_id": "...",
    "author_id": {
      "_id": "...",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com"
    },
    "body": "This was an excellent event! I learned so much about React and modern web development.",
    "status": "visible",
    "createdAt": "2025-11-23T...",
    "updatedAt": "2025-11-23T..."
  }
}
```

**Error Responses:**
- `400` - Comment body is required
- `400` - Comment cannot exceed 1000 characters
- `403` - You can only comment on events you have attended
- `404` - Event not found

### 2. Get All Comments for an Event
**Endpoint:** `GET /events/:eventId/comments`

**Authentication:** Required (Student, Staff, TA, Professor)

**Response:**
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
    // ... more comments (includes deleted comments for admins)
  ],
  "totalComments": 15,
  "activeComments": 13,
  "deletedComments": 2
}
```

### 3. Get My Comment for an Event
**Endpoint:** `GET /events/:eventId/my-comment`

**Authentication:** Required (Student, Staff, TA, Professor)

**Response (Has Comment):**
```json
{
  "comment": {
    "_id": "...",
    "event_id": "...",
    "author_id": {
      "_id": "...",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com"
    },
    "body": "This was an excellent event!",
    "status": "visible",
    "createdAt": "2025-11-23T...",
    "updatedAt": "2025-11-23T..."
  }
}
```

**Response (No Comment):**
```json
{
  "message": "You have not commented on this event yet"
}
```

### 4. Update My Comment
**Endpoint:** `PUT /events/:eventId/comments/:commentId`

**Authentication:** Required (Student, Staff, TA, Professor)

**Request Body:**
```json
{
  "body": "Updated: This was an excellent event! I learned so much."
}
```

**Response:**
```json
{
  "message": "Comment updated successfully",
  "comment": {
    "_id": "...",
    "event_id": "...",
    "author_id": { ... },
    "body": "Updated: This was an excellent event! I learned so much.",
    "status": "visible",
    "createdAt": "2025-11-23T...",
    "updatedAt": "2025-11-23T..."
  }
}
```

**Error Responses:**
- `400` - Comment body is required
- `400` - Comment cannot exceed 1000 characters
- `400` - Cannot edit a deleted comment
- `403` - You can only edit your own comments
- `404` - Event not found
- `404` - Comment not found

### 5. Delete My Comment
**Endpoint:** `DELETE /events/:eventId/comments/:commentId`

**Authentication:** Required (Student, Staff, TA, Professor)

**Response:**
```json
{
  "message": "Comment deleted successfully",
  "comment": {
    "id": "...",
    "event_id": "...",
    "deleted_at": "2025-11-23T..."
  }
}
```

**Error Responses:**
- `400` - Comment is already deleted
- `403` - You can only delete your own comments
- `404` - Event not found
- `404` - Comment not found

## Business Rules

### Who Can Comment?
- Students, Staff, TAs, and Professors who have:
  1. Registered for the event
  2. Have a registration status of "registered" (not cancelled)
  3. Have a payment status of "paid" or "free"

### When Can They Comment?
- Anytime after attending the event
- No restriction on event completion status (unlike ratings)

### Comment Constraints
- Comment body is required and cannot be empty
- Maximum length: 1000 characters
- Comments are automatically trimmed of leading/trailing whitespace
- Users can post multiple comments on the same event (no unique constraint)
- Users can only edit or delete their own comments
- Deleted comments cannot be edited

### Soft Delete Implementation
- When a user or admin deletes a comment, it's marked as "deleted" rather than removed
- The `deleted_by` field stores who deleted it
- Deleted comments are still returned in the GET all comments endpoint (for admin visibility)
- Users cannot edit or interact with deleted comments

## Usage Examples

### Example 1: Create a Comment
```bash
curl -X POST http://localhost:5001/events/652ad81e23f3c9b96a8120b4/comments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "body": "This workshop was incredibly informative! The hands-on examples really helped me understand React hooks better."
  }'
```

### Example 2: Get All Comments
```bash
curl -X GET http://localhost:5001/events/652ad81e23f3c9b96a8120b4/comments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example 3: Get My Comment
```bash
curl -X GET http://localhost:5001/events/652ad81e23f3c9b96a8120b4/my-comment \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example 4: Update My Comment
```bash
curl -X PUT http://localhost:5001/events/652ad81e23f3c9b96a8120b4/comments/652bd92f34g4d0c07b9231c5 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "body": "Updated: This workshop was incredibly informative and well-paced!"
  }'
```

### Example 5: Delete My Comment
```bash
curl -X DELETE http://localhost:5001/events/652ad81e23f3c9b96a8120b4/comments/652bd92f34g4d0c07b9231c5 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Files Modified/Created

### Modified Files
1. `backend/models/Comment.js` - Added maxlength constraint and indexes
2. `backend/controllers/eventController.js` - Added comment controller methods:
   - `createComment` - Create a new comment
   - `updateComment` - Update user's own comment
   - `deleteUserComment` - Delete user's own comment
   - `getMyComment` - Get user's comment for an event
3. `backend/routes/eventRoutes.js` - Added comment routes

## Admin Functions
Admins still have their own delete comment functionality in `adminController.js` and `adminRoutes.js`:
- `DELETE /admin/comment/:commentId` - Admin can delete any comment

## Differences Between User and Admin Comment Deletion
- **User deletion**: Only own comments, same endpoint pattern as other user operations
- **Admin deletion**: Any comment, separate admin endpoint

## Testing Checklist

- [ ] Test creating a comment on an attended event
- [ ] Test updating your own comment
- [ ] Test deleting your own comment
- [ ] Test viewing all comments for an event
- [ ] Test viewing your own comment
- [ ] Test comment length validation (max 1000 chars)
- [ ] Test that users cannot comment on events they haven't attended
- [ ] Test that users cannot edit other users' comments
- [ ] Test that users cannot delete other users' comments
- [ ] Test that deleted comments cannot be edited
- [ ] Test that comment body is required
- [ ] Test trimming of whitespace in comments
- [ ] Test soft delete (comments marked as deleted, not removed)

## Frontend Integration Tips

### Comment Form Component
```javascript
const CommentForm = ({ eventId, existingComment, onSubmit }) => {
  const [body, setBody] = useState(existingComment?.body || '');
  const maxLength = 1000;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (existingComment) {
      await api.put(`/events/${eventId}/comments/${existingComment._id}`, { body });
    } else {
      await api.post(`/events/${eventId}/comments`, { body });
    }
    onSubmit();
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <textarea 
        value={body} 
        onChange={(e) => setBody(e.target.value)}
        maxLength={maxLength}
        placeholder="Share your thoughts about this event..."
        required
      />
      <div className="char-count">
        {body.length}/{maxLength} characters
      </div>
      <button type="submit">
        {existingComment ? 'Update Comment' : 'Post Comment'}
      </button>
    </form>
  );
};
```

### Display Comments
```javascript
const CommentsList = ({ eventId }) => {
  const [comments, setComments] = useState([]);
  
  useEffect(() => {
    fetchComments();
  }, [eventId]);
  
  const fetchComments = async () => {
    const response = await api.get(`/events/${eventId}/comments`);
    setComments(response.data.comments);
  };
  
  const handleDelete = async (commentId) => {
    await api.delete(`/events/${eventId}/comments/${commentId}`);
    fetchComments();
  };
  
  return (
    <div className="comments-list">
      <h3>Comments ({comments.length})</h3>
      {comments.map(comment => (
        <div key={comment._id} className={comment.status}>
          <div className="comment-header">
            <strong>
              {comment.author_id.first_name} {comment.author_id.last_name}
            </strong>
            <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
          </div>
          <p>{comment.body}</p>
          {comment.status === 'deleted' && (
            <em className="deleted-notice">This comment has been deleted</em>
          )}
        </div>
      ))}
    </div>
  );
};
```

## Notes
- Unlike ratings (one per user per event), users can technically post multiple comments, though it's recommended to implement UI logic to encourage updating existing comments
- Comments persist even if registration is cancelled later
- Soft delete allows admins to review deleted comments for moderation purposes
- The `getEventComments` endpoint returns both visible and deleted comments (for admin visibility)
- Consider adding pagination for events with many comments
- Consider adding a report/flag feature for inappropriate comments
