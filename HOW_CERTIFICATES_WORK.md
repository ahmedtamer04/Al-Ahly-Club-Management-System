# How Certificates Work - Quick Guide

## 🎓 Automatic Certificate Sending

When a workshop finishes, Admin or EventsOffice can mark it as completed, which **automatically sends certificates to all participants via email**.

## 📋 Simple Process

### Step 1: Workshop Ends
The workshop reaches its scheduled end date.

### Step 2: Mark Workshop as Complete
**Admin or EventsOffice** calls this API:

```http
PATCH /api/workshop/:workshopId/complete
Authorization: Bearer <token>
```

**OR** to send certificates before workshop ends:

```http
PATCH /api/workshop/:workshopId/complete?force=true
Authorization: Bearer <token>
```

### Step 3: System Automatically:
✅ Verifies workshop has ended  
✅ Updates status to "completed"  
✅ Finds all participants who:
   - Have paid (or event is free)
   - Are registered (not canceled)
   - Are Student, Staff, TA, or Professor  
✅ Generates PDF certificate for each participant  
✅ Sends certificate via email  

### Step 4: Participants Receive Email
Each eligible participant gets an email with:
- 🎉 Congratulations message
- 📄 PDF certificate attached
- 📋 Workshop details
- 🔗 Link to dashboard

## 📧 What Participants Receive

**Email Subject**: `Certificate of Attendance - [Workshop Name]`

**Email Contains**:
- Congratulations message
- Workshop completion confirmation
- Details table (name, workshop, date, certificate ID)
- PDF certificate attachment

**PDF Certificate Includes**:
- GUC Al-Ahly Club branding
- Participant's full name
- Workshop name and date
- Unique Certificate ID (e.g., CERT-A1B2C3D4)
- Issue date
- Decorative professional design

## 👥 Who Gets Certificates?

### ✅ Eligible Participants
- **Student** 
- **Staff**
- **TA**
- **Professor**

### ✅ Must Have:
- Completed payment (or free event)
- Active registration (not canceled)
- Valid email address

### ❌ Not Eligible
- Admin (administrative role)
- EventsOffice (administrative role)
- Vendor (no workshop participation)
- Canceled registrations
- Pending payments

## 🔒 Force Mode (Admin Override)

Admins can send certificates **before a workshop ends or even before it starts** using force mode.

### When to Use Force Mode

✅ **Good Use Cases**:
- Testing the certificate system
- Workshop ended early (different from scheduled end_date)
- Emergency certificate issuance
- Practice/demo workshops
- Workshop cancelled but participants should receive certificates

⚠️ **Use with Caution**:
- Participants will receive certificates immediately
- Workshop status will be marked as "completed"
- Cannot be easily undone

### How to Use Force Mode

Add `?force=true` to the complete workshop request:

```http
PATCH /api/workshop/:workshopId/complete?force=true
Authorization: Bearer <admin_or_events_office_token>
```

**Or** include in request body:
```json
{
  "force": true
}
```

### Force Mode Response

```json
{
  "success": true,
  "message": "Workshop marked as completed (forced - end date not reached yet)",
  "force_mode": true,
  "workshop": {
    "_id": "...",
    "name": "AI Workshop",
    "status": "completed",
    "end_date": "2025-12-31T18:00:00.000Z",
    "current_date": "2025-11-04T23:20:00.000Z"
  },
  "certificates": {
    "total": 15,
    "sent": 15,
    "failed": 0,
    "details": { /* ... */ }
  }
}
```

Notice:
- `force_mode: true` indicates force was used
- Message shows it was forced
- `current_date` is before `end_date`

## 🔧 For Admins/EventsOffice

### API Endpoint
```
PATCH /api/workshop/:workshopId/complete
```

### Authentication Required
- Must be logged in as Admin or EventsOffice
- Include Bearer token in Authorization header

### Response Example
```json
{
  "success": true,
  "message": "Workshop marked as completed",
  "workshop": {
    "_id": "...",
    "name": "Web Development Workshop",
    "status": "completed"
  },
  "certificates": {
    "total": 25,
    "sent": 23,
    "failed": 2,
    "details": {
      "success": [ /* list of successful sends */ ],
      "failed": [ /* list of failures with reasons */ ]
    }
  }
}
```

### What If Some Fail?
The system continues sending to all participants even if some emails fail. You'll get a detailed report showing:
- ✅ Successfully sent certificates
- ❌ Failed sends with error messages
- Total count of each

## 🎯 Example Scenario

1. **Workshop**: "Introduction to AI"
2. **Date**: January 15, 2025
3. **Participants**: 30 students registered
4. **Workshop Ends**: January 15, 6:00 PM

### What Happens:
```
January 15, 6:01 PM - Workshop ends
January 15, 6:05 PM - Admin marks workshop complete
                      ⬇️
System automatically:
  ✅ Checks workshop has ended
  ✅ Finds 28 eligible participants (2 canceled)
  ✅ Generates 28 PDF certificates
  ✅ Sends 28 emails
  ✅ 27 sent successfully
  ❌ 1 failed (invalid email)
  
January 15, 6:06 PM - 27 participants receive certificates!
```

## ⚠️ Important Notes

### Timing
- Certificates are only sent when workshop is marked as "completed"
- By default, workshop must have reached its end_date
- **Admin Override**: Use `?force=true` to send certificates even before workshop ends (useful for testing or early completion)

### Email Delivery
- Certificates sent to participant's registered email
- Check spam folder if not received
- System logs all send attempts

### Certificate IDs
- Each certificate has unique ID: `CERT-XXXXXXXX`
- ID is based on registration ID
- Used for verification and record-keeping

### Retrying Failed Sends
If some certificates fail to send, Admin can:
1. Use manual batch send: `POST /api/certificates/batch-issue/:eventId`
2. Or individual send: `POST /api/certificates/issue/:registrationId`

## 📞 Troubleshooting

### "Cannot complete workshop - end date has not been reached yet"
**Solution**: 
1. Wait until workshop end_date passes
2. Update the workshop's end_date if it ended early
3. **OR** use force mode: Add `?force=true` to the request URL to override this check

### "No eligible participants found"
**Possible reasons**:
- All registrations were canceled
- All payments are still pending
- No Student/Staff/TA/Professor participants

### Certificate emails not received
**Check**:
1. Spam/junk folder
2. Email address is correct in registration
3. Email service is configured (EMAIL_USER, EMAIL_PASS in .env)
4. Check console logs for send errors

### Some certificates failed
**Review the response** - it shows exactly which participants failed and why. Common reasons:
- Invalid email address
- Email service temporarily down
- Attachment too large (rare)

## 🔗 Related Documentation

- Full documentation: `CERTIFICATE_OF_ATTENDANCE.md`
- Payment system: `PAYMENT_RECEIPT_EMAIL.md`
- Workshop creation: Check workshop controller docs

## 💡 Best Practices

1. **Mark complete promptly** after workshop ends
2. **Review the response** to see if any sends failed
3. **Retry failed sends** individually if needed
4. **Keep participants informed** that certificates are sent automatically
5. **Test email system** before first workshop completion

---

**Quick Summary**: Admin marks workshop complete → System automatically sends PDF certificates to all eligible participants via email! 🎓✨
