# Force Mode: Send Certificates Anytime

## Quick Overview

Admin/EventsOffice can now send workshop certificates **even before the workshop ends or starts** using force mode.

## How to Use

### Normal Mode (Default)
```http
PATCH /api/workshop/:workshopId/complete
Authorization: Bearer <token>
```
✅ Only works after workshop end_date  
❌ Blocked if workshop hasn't ended yet

### Force Mode (Override)
```http
PATCH /api/workshop/:workshopId/complete?force=true
Authorization: Bearer <token>
```
✅ Works anytime - before, during, or after workshop  
✅ Bypasses end_date validation  
⚠️ Use responsibly

## When to Use Force Mode

### ✅ Good Reasons

1. **Testing**
   - Test certificate generation before workshop
   - Verify email system is working
   - Check PDF formatting

2. **Early Completion**
   - Workshop ended earlier than scheduled
   - Don't want to wait for original end_date
   - Participants completed all requirements early

3. **Special Cases**
   - Emergency certificate issuance
   - Demo/practice workshops
   - Cancelled workshop but still want to issue certificates
   - Workshop date was incorrect in system

### ⚠️ Considerations

- Participants receive certificates immediately
- Workshop status changes to "completed"
- Cannot easily undo the action
- Sends to ALL eligible participants
- Use sparingly for production workshops

## Examples

### Example 1: Test Certificates

Workshop is scheduled for **December 2025**, but you want to test certificates now:

```bash
curl -X PATCH "http://localhost:5001/api/workshop/ABC123/complete?force=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Result: ✅ Certificates sent even though it's only November 2025

### Example 2: Workshop Ended Early

Workshop scheduled to end **December 31**, but actually ended **December 15**:

```bash
# Option 1: Use force mode
curl -X PATCH "http://localhost:5001/api/workshop/ABC123/complete?force=true" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Option 2: Update end_date first, then complete normally
# (Better for record-keeping)
```

### Example 3: Normal Completion

Workshop ended on schedule:

```bash
# No force needed - will work automatically if end_date passed
curl -X PATCH "http://localhost:5001/api/workshop/ABC123/complete" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Response Differences

### Without Force (Normal)

```json
{
  "success": true,
  "message": "Workshop marked as completed",
  "force_mode": false,
  "workshop": {
    "name": "AI Workshop",
    "status": "completed",
    "end_date": "2025-11-03T18:00:00Z",
    "current_date": "2025-11-04T10:00:00Z"
  },
  "certificates": { "total": 20, "sent": 20, "failed": 0 }
}
```
✅ `end_date` is before `current_date` (workshop has ended)

### With Force

```json
{
  "success": true,
  "message": "Workshop marked as completed (forced - end date not reached yet)",
  "force_mode": true,
  "workshop": {
    "name": "AI Workshop",
    "status": "completed",
    "end_date": "2025-12-31T18:00:00Z",
    "current_date": "2025-11-04T10:00:00Z"
  },
  "certificates": { "total": 20, "sent": 20, "failed": 0 }
}
```
⚠️ `end_date` is AFTER `current_date` (workshop hasn't ended yet)  
ℹ️ `force_mode: true` indicates override was used

## Error Handling

### Without Force Mode

```json
{
  "message": "Cannot complete workshop - end date has not been reached yet. Use force=true to override.",
  "end_date": "2025-12-31T18:00:00.000Z",
  "current_date": "2025-11-04T10:00:00.000Z",
  "hint": "Add ?force=true to the request to send certificates anyway"
}
```

### With Force Mode

No error - certificates are sent immediately!

## Frontend Integration

### JavaScript/TypeScript Example

```javascript
async function completeWorkshop(workshopId, forceMode = false) {
  const url = forceMode 
    ? `/api/workshop/${workshopId}/complete?force=true`
    : `/api/workshop/${workshopId}/complete`;
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const result = await response.json();
  
  if (result.force_mode) {
    console.warn('⚠️ Force mode was used - workshop completed early');
  }
  
  return result;
}

// Normal completion
await completeWorkshop('ABC123', false);

// Force completion
await completeWorkshop('ABC123', true);
```

### React Component Example

```jsx
function CompleteWorkshopButton({ workshopId, endDate }) {
  const [forceMode, setForceMode] = useState(false);
  const workshopEnded = new Date(endDate) < new Date();
  
  const handleComplete = async () => {
    try {
      const result = await completeWorkshop(workshopId, forceMode);
      
      if (result.force_mode) {
        alert('⚠️ Workshop completed with force mode - certificates sent early!');
      } else {
        alert('✅ Workshop completed - certificates sent!');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };
  
  return (
    <div>
      <button onClick={handleComplete}>
        Complete Workshop
      </button>
      
      {!workshopEnded && (
        <label>
          <input 
            type="checkbox" 
            checked={forceMode}
            onChange={(e) => setForceMode(e.target.checked)}
          />
          Force complete (workshop hasn't ended yet)
        </label>
      )}
    </div>
  );
}
```

## Security

### Who Can Use Force Mode?

- ✅ **Admin** - Full access
- ✅ **EventsOffice** - Full access
- ❌ **Professor** - Cannot complete workshops
- ❌ **Other roles** - No access

### Authorization

Same as normal completion - requires `requireAdminOrEventsOffice` middleware.

## Best Practices

### ✅ DO:

1. Use for testing/development
2. Use when workshop genuinely ended early
3. Add a note/comment about why force mode was used
4. Inform participants if they receive early certificates
5. Check the response to confirm force mode was applied

### ❌ DON'T:

1. Use as default for all workshops
2. Use without understanding implications
3. Use to send certificates weeks before workshop
4. Forget that participants will receive emails immediately
5. Use force mode in automated scripts without safeguards

## Troubleshooting

### Force Mode Not Working

**Check:**
1. Query parameter is exactly `?force=true` (lowercase)
2. User has Admin or EventsOffice role
3. Workshop exists and is of type "Workshop"
4. Authorization token is valid

### Certificates Still Not Sending

Force mode only bypasses the date check. Other requirements still apply:
- Participants must have paid (or event is free)
- Registrations must not be canceled
- Participants must be Student/Staff/TA/Professor
- Email service must be configured

### Sent Certificates by Mistake

Unfortunately, force mode action cannot be easily undone:
- Emails have been sent
- Workshop status is "completed"
- Certificates are already in participants' inboxes

**Options:**
1. Send follow-up email explaining the situation
2. Re-issue corrected certificates if needed
3. Update workshop status manually in database if necessary

## Summary

**Force Mode** = Send certificates anytime, bypassing end date validation

**Use it for**: Testing, early workshop endings, special cases

**Command**: Add `?force=true` to the complete workshop endpoint

**Result**: Immediate certificate sending to all eligible participants

---

**Remember**: With great power comes great responsibility! Use force mode wisely. 🎓✨
