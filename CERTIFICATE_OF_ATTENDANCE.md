# Certificate of Attendance Feature

## Overview
Students, Staff, TAs, and Professors automatically receive a PDF certificate of attendance via email upon completing a workshop.

## Implementation Details

### PDF Certificate Generation
**File**: `backend/services/certificateService.js`

Uses PDFKit library to generate professional PDF certificates with:
- GUC Al-Ahly Club branding
- Decorative borders and accents
- Participant name (prominently displayed)
- Workshop name
- Workshop date
- Issue date
- Unique certificate ID
- Signature line
- A4 landscape format (842 x 595 points)

### Email Service
**File**: `backend/services/emailService.js`

Added `sendCertificateEmail()` function that:
- Sends congratulatory email with certificate attached as PDF
- Includes workshop details in email body
- Professional HTML formatting
- Attaches PDF certificate with descriptive filename
- Links to dashboard

### Certificate Controller
**File**: `backend/controllers/certificateController.js`

#### Individual Certificate Issuance
- **Endpoint**: `POST /api/certificates/issue/:registrationId`
- **Access**: Admin and EventsOffice only
- **Function**: `issueCertificate()`

Validates:
- Registration exists
- Event is a Workshop (not Trip, Conference, etc.)
- Workshop status is "completed"
- Payment is completed (not pending)
- Registration not canceled
- User role is Student, Staff, TA, or Professor

#### Batch Certificate Issuance
- **Endpoint**: `POST /api/certificates/batch-issue/:eventId`
- **Access**: Admin and EventsOffice only
- **Function**: `batchIssueCertificates()`

Issues certificates to all eligible participants of a completed workshop:
- Filters for registered participants with paid/free status
- Only issues to Student, Staff, TA, Professor roles
- Provides detailed success/failure report
- Continues processing even if some certificates fail

### Routes
**File**: `backend/routes/certificateRoutes.js`

```javascript
POST /api/certificates/issue/:registrationId        // Single certificate
POST /api/certificates/batch-issue/:eventId         // All participants
```

Both routes require authentication and Admin/EventsOffice role.

## Certificate Details

### Certificate ID Format
`CERT-XXXXXXXX` where XXXXXXXX is the last 8 characters of the registration ID in uppercase.

Example: `CERT-A1B2C3D4`

### Certificate Layout

```
┌─────────────────────────────────────────────────┐
│                 GUC AL-AHLY CLUB                │
│                                                 │
│         Certificate of Attendance               │
│                                                 │
│           This is to certify that               │
│                                                 │
│              [PARTICIPANT NAME]                 │
│                                                 │
│    has successfully attended and completed      │
│                                                 │
│             [WORKSHOP NAME]                     │
│                                                 │
│        Workshop Date: [DATE]                    │
│                                                 │
│  Certificate ID: CERT-XXXXX    Issue Date: ...  │
│                                                 │
│                        ___________________      │
│                        Authorized Signature     │
└─────────────────────────────────────────────────┘
```

## Workflow

### Automatic Certificate Issuance (Recommended)

1. **Workshop Ends**: Workshop reaches its end_date
2. **Admin/EventsOffice Marks Complete**: 
   - Calls `PATCH /api/workshop/:id/complete`
   - System automatically validates workshop has ended
3. **Auto-Generate & Send**: System automatically:
   - Updates workshop status to "completed"
   - Finds all eligible participants
   - Generates PDF certificates for each
   - Sends certificates via email
4. **Confirmation**: Admin receives report of successful/failed sends

### Manual Certificate Issuance (Alternative)

1. **Workshop Already Completed**: Workshop status is "completed"
2. **Trigger Certificate Issuance**: 
   - Option A: Issue certificate for individual participant
   - Option B: Batch issue for all eligible participants
3. **System Validates**: Checks all eligibility criteria
4. **PDF Generation**: Creates personalized PDF certificate
5. **Email Delivery**: Sends certificate via email with attachment

### Eligibility Criteria

✅ **Required Conditions**:
- Event type: Workshop
- Workshop status: Completed
- Registration status: Registered (not canceled)
- Payment status: Paid or Free (not pending)
- User role: Student, Staff, TA, or Professor

❌ **Excluded**:
- Trips (no certificates for trips)
- Uncompleted workshops
- Canceled registrations
- Pending payments
- Admin, EventsOffice, Vendor roles

## API Usage

### Complete Workshop & Auto-Send Certificates (Recommended)

**Request**:
```http
PATCH /api/workshop/:id/complete
Authorization: Bearer <admin_or_events_office_token>
```

**Response**:
```json
{
  "success": true,
  "message": "Workshop marked as completed",
  "workshop": {
    "_id": "652ad81e23f3c9b96a8120b4",
    "name": "Web Development Workshop",
    "status": "completed",
    "end_date": "2025-01-15T18:00:00.000Z"
  },
  "certificates": {
    "total": 25,
    "sent": 23,
    "failed": 2,
    "details": {
      "success": [
        {
          "userName": "John Doe",
          "email": "john@student.guc.edu.eg",
          "certificateId": "CERT-A1B2C3D4"
        },
        // ... more successful sends
      ],
      "failed": [
        {
          "userName": "Jane Smith",
          "email": "jane@staff.guc.edu.eg",
          "error": "Email service temporarily unavailable"
        }
      ]
    }
  }
}
```

### Issue Single Certificate (Manual)

**Request**:
```http
POST /api/certificates/issue/:registrationId
Authorization: Bearer <admin_or_events_office_token>
```

**Response**:
```json
{
  "success": true,
  "message": "Certificate issued and sent via email successfully",
  "certificateData": {
    "userName": "John Doe",
    "workshopName": "Web Development Workshop",
    "certificateId": "CERT-A1B2C3D4",
    "email": "john@student.guc.edu.eg"
  }
}
```

### Issue Batch Certificates

**Request**:
```http
POST /api/certificates/batch-issue/:eventId
Authorization: Bearer <admin_or_events_office_token>
```

**Response**:
```json
{
  "success": true,
  "message": "Certificates issued: 25 successful, 2 failed",
  "results": {
    "success": [
      {
        "userName": "John Doe",
        "email": "john@student.guc.edu.eg",
        "certificateId": "CERT-A1B2C3D4"
      },
      // ... more successful issuances
    ],
    "failed": [
      {
        "userName": "Jane Smith",
        "email": "jane@staff.guc.edu.eg",
        "error": "Email service unavailable"
      }
    ]
  }
}
```

## Email Content

### Subject
`Certificate of Attendance - [Workshop Name]`

### Body
- Congratulations message
- Workshop completion confirmation
- Workshop details table (participant, workshop name, date, certificate ID)
- Note about PDF attachment
- Link to dashboard
- Footer with support information

### Attachment
- Filename: `Certificate_Workshop_Name.pdf`
- Type: PDF (application/pdf)
- Size: ~10-20 KB

## User Roles

### Who Receives Certificates
✅ **Student** - Eligible for certificates  
✅ **Staff** - Eligible for certificates  
✅ **TA** - Eligible for certificates  
✅ **Professor** - Eligible for certificates  

### Who Can Issue Certificates
✅ **Admin** - Can issue certificates  
✅ **EventsOffice** - Can issue certificates  

### Excluded from Certificates
❌ **Vendor** - No workshop participation  
❌ **Admin** - Administrative role  
❌ **EventsOffice** - Administrative role  

## Error Handling

### Common Errors

1. **Workshop Not Completed**
   ```json
   {
     "message": "Cannot issue certificate - workshop is not yet completed"
   }
   ```

2. **Payment Pending**
   ```json
   {
     "message": "Cannot issue certificate - payment is pending"
   }
   ```

3. **Wrong Event Type**
   ```json
   {
     "message": "Certificates are only issued for workshops"
   }
   ```

4. **Invalid Role**
   ```json
   {
     "message": "Certificates are only issued to Students, Staff, TAs, and Professors"
   }
   ```

## Dependencies

### NPM Packages
```json
{
  "pdfkit": "^0.15.0",
  "nodemailer": "^7.0.9"
}
```

### Installation
```bash
cd backend
npm install pdfkit
```

## Testing

### Test Certificate Generation

1. **Setup Test Workshop**:
   - Create a workshop event
   - Register participants (Student/Staff/TA/Professor)
   - Ensure payments are completed
   - Mark workshop as "completed"

2. **Issue Individual Certificate**:
   ```bash
   POST /api/certificates/issue/:registrationId
   ```

3. **Issue Batch Certificates**:
   ```bash
   POST /api/certificates/batch-issue/:eventId
   ```

4. **Verify**:
   - Check participant emails for certificate
   - Verify PDF opens correctly
   - Confirm all details are accurate
   - Check certificate ID is unique

### Test Scenarios

✅ Valid certificate issuance  
✅ Batch issuance to multiple participants  
✅ Rejection of non-workshop events  
✅ Rejection of uncompleted workshops  
✅ Rejection of pending payments  
✅ Rejection of canceled registrations  
✅ Rejection of non-eligible roles  
✅ Email delivery with PDF attachment  
✅ PDF generation and formatting  

## Security Considerations

### Access Control
- Only Admin and EventsOffice can issue certificates
- Certificate generation validates all eligibility criteria
- No certificates for unauthorized event types

### Data Privacy
- Certificates only sent to participant's registered email
- Certificate IDs are derived from registration IDs
- No sensitive payment information in certificates

## Future Enhancements

- Digital signature on certificates
- QR code for certificate verification
- Certificate template customization
- Certificate download from user dashboard
- Certificate revocation system
- Multi-language certificates
- Custom workshop logos/branding
- Certificate verification portal
- Analytics on certificate issuance
- Automated certificate issuance on workshop completion

## Troubleshooting

### Certificate Not Generated
1. Check PDFKit installation: `npm list pdfkit`
2. Verify workshop is marked as "completed"
3. Check console logs for PDF generation errors
4. Ensure sufficient memory for PDF generation

### Email Not Received
1. Check spam/junk folder
2. Verify EMAIL_USER and EMAIL_PASS in `.env`
3. Check email service logs
4. Verify participant's email address
5. Check attachment size limits

### PDF Display Issues
- Ensure PDF viewer is up to date
- Try different PDF viewers (Adobe, Chrome, Edge)
- Check file is not corrupted (re-download)
- Verify PDF file size is reasonable

### Batch Issuance Failures
- Check results object for specific failures
- Review failed items for individual error messages
- Common issues: email failures, invalid data
- System continues processing even with failures

## Logging

### Success Logs
```
✅ Certificate email sent to john@student.guc.edu.eg
Message ID: <xyz@gmail.com>
```

### Error Logs
```
❌ Error sending certificate email: [error details]
Certificate issuance error: [detailed error]
Failed to issue certificate for jane@staff.guc.edu.eg: [specific error]
```

## Support

For issues or questions about certificates:
1. Check this documentation
2. Review console logs for detailed errors
3. Verify all eligibility criteria
4. Contact system administrator
5. Check email configuration settings
