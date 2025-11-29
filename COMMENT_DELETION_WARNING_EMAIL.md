# Comment Deletion Warning Email System

## Overview
When an admin deletes a user's comment for being inappropriate, the system automatically sends a warning email to the comment author. This helps maintain community standards and provides transparency about content moderation.

## Implementation

### Affected User Roles
Users who can receive warning emails:
- ✅ Students
- ✅ Staff
- ✅ TAs
- ✅ Professors
- ✅ Events Office

### How It Works

1. **Admin Deletes Comment**: An admin uses the delete comment endpoint with an optional reason
2. **System Captures Details**: The system saves comment details (author, content, event) before deletion
3. **Email Sent**: An automated warning email is sent to the comment author
4. **Soft Delete**: The comment is marked as deleted (not permanently removed)

## API Endpoint

### Delete Comment (Admin Only)
**Endpoint:** `DELETE /admin/comment/:commentId`

**Authentication:** Required (Admin only)

**Request Body (Optional):**
```json
{
  "reason": "The comment contained offensive language and violated our community guidelines regarding respectful communication."
}
```

**Response:**
```json
{
  "message": "Comment deleted successfully",
  "comment": {
    "id": "652ad81e23f3c9b96a8120b4",
    "event_id": "652bd92f34g4d0c07b9231c5",
    "deleted_by": "652cd03g45h5e1d18c0342d6",
    "deleted_at": "2025-11-23T10:30:00.000Z"
  },
  "warning_email_sent": true
}
```

## Email Template Features

### Email Content Includes:
1. **Warning Header**: Clear indication that the comment was removed
2. **User Greeting**: Personalized with user's full name
3. **Removal Details**:
   - Event name where comment was posted
   - Who removed the comment (Admin name)
   - When it was removed (date and time)
   - Reason for removal (if provided)
4. **Removed Comment**: Shows the user what they wrote (truncated if >200 chars)
5. **Community Guidelines**: Lists the expected standards for comments
6. **Consequence Warning**: Notes that repeated violations may lead to account suspension
7. **Call to Action**: Link to return to dashboard

### Email Design
- Professional HTML template with responsive design
- Color-coded sections (red for warnings, blue for guidelines)
- Clear typography and spacing
- Mobile-friendly layout

## Email Example

**Subject:** ⚠️ Warning: Your Comment Has Been Removed

**Key Sections:**

### 1. Warning Notice (Red Background)
```
⚠️ Comment Removal Notice
GUC Al-Ahly Club

Warning: Inappropriate Content
Your comment has been removed by our moderation team.
```

### 2. Removal Details Table
```
Event:          React Workshop
Removed By:     John Admin (Admin)
Removal Date:   Saturday, November 23, 2025, 10:30 AM
Reason:         The comment contained offensive language
```

### 3. Removed Comment Display
```
Your Removed Comment:
"[The actual comment text is shown here]"
```

### 4. Community Guidelines (Blue Background)
```
📌 Community Guidelines Reminder:
• Be respectful and courteous to all members
• Avoid offensive, discriminatory, or inappropriate language
• Keep comments relevant and constructive
• Do not spam or post misleading information
• Respect privacy and confidentiality
```

### 5. Warning Message
```
⚠️ Important: Repeated violations of our community guidelines 
may result in account suspension or termination.
```

## Technical Implementation

### Files Modified

#### 1. `backend/services/emailService.js`
**New Function:** `sendCommentDeletionWarning(email, warningDetails)`

**Parameters:**
```javascript
{
  userName: string,        // Full name of comment author
  eventName: string,       // Name of the event
  commentBody: string,     // The deleted comment text
  deletedBy: string,       // Name of admin who deleted it
  deletionDate: Date,      // When it was deleted
  reason: string          // Optional reason for deletion
}
```

**Returns:** `Promise<boolean>` - true if email sent successfully

#### 2. `backend/controllers/adminController.JS`
**Updated Function:** `deleteComment`

**Changes:**
- Populates author and event details before deletion
- Captures comment content and metadata
- Sends warning email asynchronously
- Handles email failures gracefully (doesn't block deletion)
- Returns email status in response

### Request Body Schema
```javascript
{
  reason: {
    type: String,
    optional: true,
    description: "Explanation for why the comment was deleted"
  }
}
```

## Usage Examples

### Example 1: Delete Comment with Reason
```bash
curl -X DELETE http://localhost:5001/admin/comment/652ad81e23f3c9b96a8120b4 \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "The comment contained profanity and violated our respectful communication policy."
  }'
```

### Example 2: Delete Comment without Reason (uses default)
```bash
curl -X DELETE http://localhost:5001/admin/comment/652ad81e23f3c9b96a8120b4 \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

**Default Reason:** "The comment violated our community guidelines."

## Error Handling

### Email Failure
If the email fails to send:
- The comment is still deleted successfully
- The error is logged to console
- The response includes `warning_email_sent: false`
- The admin is informed but the operation completes

### Missing Author Information
If the comment author's email is not available:
- Comment is still deleted
- No email is sent (gracefully skipped)
- Response includes `warning_email_sent: false`

### Invalid Comment ID
If the comment doesn't exist:
- Returns 404 error
- No email is sent
- Operation halts

## Environment Variables Required

Ensure these are set in `.env`:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
FRONTEND_URL=http://localhost:3000
```

## Testing Checklist

- [ ] Admin can delete comment and email is sent
- [ ] Email contains correct user name
- [ ] Email contains correct event name
- [ ] Email shows the deleted comment text
- [ ] Email includes the admin's name who deleted it
- [ ] Custom reason appears in email when provided
- [ ] Default reason appears when no reason provided
- [ ] Email is sent to correct author email address
- [ ] Email has professional formatting and styling
- [ ] System handles email failure gracefully
- [ ] Comment is deleted even if email fails
- [ ] Long comments are truncated properly (>200 chars)
- [ ] Response indicates if email was sent
- [ ] Email contains working dashboard link
- [ ] Community guidelines are clearly listed

## Best Practices for Admins

### When to Delete Comments:
- Offensive or discriminatory language
- Spam or irrelevant content
- Personal attacks or harassment
- Misleading or false information
- Privacy violations

### Writing Deletion Reasons:
✅ **Good Reasons:**
- "The comment contained profanity directed at other users."
- "This comment included false information about the event details."
- "The comment violated our policy against personal attacks."

❌ **Poor Reasons:**
- "Bad comment"
- "Inappropriate"
- "Removed"

**Tip:** Specific, educational reasons help users understand what they did wrong and prevent future violations.

## User Experience Flow

1. **User posts comment** on an event they attended
2. **Admin reviews** comments and identifies inappropriate content
3. **Admin deletes** comment with specific reason
4. **System sends email** to user immediately
5. **User receives email** with:
   - Clear explanation of what happened
   - Specific reason why
   - Guidelines for future behavior
   - Warning about consequences
6. **User can respond** by contacting support if they believe it was an error

## Benefits

### For Users:
- **Transparency**: Know exactly why their content was removed
- **Education**: Learn what constitutes appropriate behavior
- **Accountability**: Understand the consequences of violations
- **Fairness**: Can appeal if they believe it was a mistake

### For Administrators:
- **Efficiency**: Automated notification saves time
- **Consistency**: Same message format for all deletions
- **Documentation**: Email trail of moderation actions
- **Prevention**: Warnings may reduce repeat violations

### For the Platform:
- **Community Standards**: Reinforces expected behavior
- **Legal Protection**: Paper trail of content moderation
- **User Trust**: Transparent moderation builds trust
- **Quality Control**: Maintains high-quality discussions

## Future Enhancements (Optional)

Consider implementing:
- [ ] Strike system (track number of violations per user)
- [ ] Automatic account suspension after X violations
- [ ] Appeal system for users to contest deletions
- [ ] Different warning levels (first warning vs. final warning)
- [ ] Admin dashboard to view moderation history
- [ ] User notification center in the app (in addition to email)
- [ ] Statistics on most common violation types

## Notes

- Emails are sent asynchronously to avoid blocking the deletion operation
- The email service uses Gmail by default (configurable in `emailService.js`)
- Comment content is preserved in the database (soft delete) for audit purposes
- Admins can still view deleted comments through the admin panel
- The system gracefully handles missing user data or email failures
