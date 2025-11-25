# Vendor Requirements Implementation - Complete

## Overview
All 6 vendor requirements have been fully implemented on the `vendor-requirements-implementation` branch. This document outlines the complete implementation, API endpoints, database schema changes, and testing guide.

---

## Requirements Summary

### 1. ✅ Tax Card & Company Logo Upload
**Status:** Complete  
**Database Schema:** VendorApplication.js, User.js  
**Endpoint:** `POST /api/vendor/documents/upload`

#### Implementation Details
- Added to `User.vendor_info`:
  - `tax_card_url` (String): URL to uploaded tax card file
  - `company_logo_url` (String): URL to uploaded logo file
  - `documents_verified` (Boolean): Verification status flag

- Added to `VendorApplication.vendor_documents`:
  ```javascript
  vendor_documents: {
    tax_card: {
      file_url: String,
      file_name: String,
      uploaded_at: Date
    },
    company_logo: {
      file_url: String,
      file_name: String,
      uploaded_at: Date
    }
  }
  ```

#### API Usage
```bash
POST /api/vendor/documents/upload
Headers: Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
- tax_card: (File) - PDF/image file
- company_logo: (File) - image file
```

**Response:**
```json
{
  "message": "Vendor documents uploaded successfully",
  "documents": {
    "tax_card": {
      "file_url": "/uploads/vendor/{vendor_id}/tax_card_{timestamp}.pdf",
      "file_name": "tax_card.pdf",
      "uploaded_at": "2024-01-15T10:30:00Z"
    },
    "company_logo": {
      "file_url": "/uploads/vendor/{vendor_id}/logo_{timestamp}.png",
      "file_name": "logo.png",
      "uploaded_at": "2024-01-15T10:30:00Z"
    }
  },
  "vendor_verified": false
}
```

---

### 2. ✅ Attendee ID Upload
**Status:** Complete  
**Database Schema:** VendorApplication.js  
**Endpoint:** `POST /api/vendor/applications/:application_id/attendee-ids/upload`

#### Implementation Details
- Added to `VendorApplication.attendee_id_uploads`:
  ```javascript
  attendee_id_uploads: [{
    staff_name: String,
    staff_email: String,
    id_file_url: String,
    id_file_name: String,
    uploaded_at: Date,
    verification_status: String // 'pending', 'verified', 'rejected'
  }]
  ```

#### API Usage
```bash
POST /api/vendor/applications/{applicationId}/attendee-ids/upload
Headers: Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
- id_0: (File) - ID for first staff member
- id_1: (File) - ID for second staff member
- id_2: (File) - ID for third staff member
- etc.
```

**Response:**
```json
{
  "message": "Attendee ID documents uploaded successfully",
  "uploaded_ids": [
    {
      "staff_name": "Ahmed Mohamed",
      "staff_email": "ahmed@example.com",
      "id_file_url": "/uploads/vendor/{vendor_id}/id_{application_id}_0_{timestamp}.pdf",
      "id_file_name": "id.pdf",
      "uploaded_at": "2024-01-15T10:30:00Z",
      "verification_status": "pending"
    }
  ],
  "pending_verification_count": 1
}
```

---

### 3. ✅ Accept/Reject with 3-Day Payment Deadline & Email Notifications
**Status:** Complete  
**Email Service:** emailService.js  
**Endpoints:** 
- `POST /api/vendor/admin/applications/:application_id/accept`
- `POST /api/vendor/admin/applications/:application_id/reject`

#### Implementation Details

**Accept Application:**
- Sets `application.status = 'accepted'`
- Calculates `participation_fee`:
  - **Bazaar:** $200-400 based on booth size (2x2=$250, 4x4=$400)
  - **Booth Event:** $100/week + location premium ($150 for north/south walls)
- Sets `payment_deadline` = 3 days from now
- Sends acceptance email with deadline
- Updates `approved_by` and `approved_at` timestamps

**Reject Application:**
- Sets `application.status = 'rejected'`
- Stores `rejection_reason`
- Sends rejection email with reason
- Updates `approved_by` and `approved_at` timestamps

#### API Usage

```bash
# ACCEPT APPLICATION
POST /api/vendor/admin/applications/{applicationId}/accept
Headers: Authorization: Bearer {admin_token}
Content-Type: application/json

Response:
{
  "message": "Application accepted and email sent to vendor",
  "application": {
    "_id": "app123",
    "status": "accepted",
    "participation_fee": 400,
    "payment_deadline": "2024-01-18T10:30:00Z"
  }
}

# REJECT APPLICATION
POST /api/vendor/admin/applications/{applicationId}/reject
Headers: Authorization: Bearer {admin_token}
Content-Type: application/json

Body:
{
  "rejection_reason": "Tax card documentation incomplete. Please resubmit with clear copy of tax certificate."
}

Response:
{
  "message": "Application rejected and email sent to vendor",
  "application": {
    "_id": "app123",
    "status": "rejected",
    "rejection_reason": "Tax card documentation incomplete..."
  }
}
```

#### Email Examples

**Acceptance Email:**
- Subject: "🎉 Congratulations! Your [Bazaar/Booth Event] Application Has Been Accepted"
- Includes:
  - Company details
  - Participation fee ($XXX)
  - ⏰ PAYMENT DEADLINE (3 days from acceptance)
  - Link to payment page
  - Next steps
  - Warning: "If payment is not received by the deadline, your application may be cancelled"

**Rejection Email:**
- Subject: "Your [Bazaar/Booth Event] Application Status Update"
- Includes:
  - Rejection reason with specific feedback
  - What vendors can do next (address concerns, reapply, contact for clarification)
  - Encouragement to apply in future

---

### 4. ✅ Payment Processing with Deadline
**Status:** Complete  
**Endpoint:** `POST /api/vendor/applications/:application_id/pay`

#### Implementation Details
- Checks if application status is 'accepted'
- Verifies payment deadline hasn't passed
- Marks application as 'paid'
- Records payment date and method (wallet/stripe/card)
- Stores transaction in vendor wallet history
- Prevents payment if deadline exceeded

#### API Usage
```bash
POST /api/vendor/applications/{applicationId}/pay
Headers: Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "payment_method": "wallet"  // or "stripe", "card"
}

Response:
{
  "message": "Payment processed successfully",
  "application": {
    "_id": "app123",
    "payment_status": "paid",
    "payment_date": "2024-01-15T11:00:00Z",
    "participation_fee": 400
  }
}

Error (if deadline passed):
{
  "message": "Payment deadline has passed. Please contact admin to request extension."
}
```

#### Payment Deadline Calculation
- **Basis:** 3 days from application acceptance
- **Stored in:** `VendorApplication.payment_deadline`
- **Validation:** `payment_deadline` vs current date/time
- **Cannot proceed if:** Current time > payment_deadline

---

### 5. ✅ QR Code Generation & Delivery
**Status:** Complete  
**Endpoint:** `POST /api/vendor/applications/:application_id/qr-codes/send`

#### Implementation Details
- Generates unique QR code for each registered visitor
- QR data includes:
  - registration_id (unique identifier)
  - visitor_name
  - visitor_email
  - event_name
  - vendor_application_id
- Creates PNG images with error correction level H (highest)
- Sends via email with all QR codes as attachments
- Only available after payment is made

#### API Usage
```bash
POST /api/vendor/applications/{applicationId}/qr-codes/send
Headers: Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "visitors": [
    {
      "_id": "visitor1",
      "name": "Ahmed Mohamed",
      "email": "ahmed@example.com"
    },
    {
      "_id": "visitor2",
      "name": "Fatima Hassan",
      "email": "fatima@example.com"
    }
  ]
}

Response:
{
  "message": "QR codes generated and sent to vendor email",
  "total_qr_codes": 2
}
```

#### Email Details
- Subject: "🎫 Your QR Codes Ready - [Bazaar/Booth Event] Visitor Registration"
- Includes:
  - Stats box: Total visitors count and company name
  - Instructions on how to use QR codes
  - All QR codes as embedded images
  - Unique codes for each visitor (for manual verification)
  - Tips for printing and using at event

#### QR Code Features
- **Format:** PNG, 300x300px
- **Error Correction:** Level H (30% recovery)
- **Data:** JSON-encoded visitor information
- **Delivery:** Email attachment + display in vendor dashboard
- **Usage:** Scan at booth for visitor verification

---

### 6. ✅ Cancellation Logic with Payment Guard
**Status:** Complete  
**Endpoint:** `DELETE /api/vendor/applications/:application_id`

#### Implementation Details
- Allows vendor to cancel their application
- **Guard:** Can only cancel if `payment_status !== 'paid'`
- Sets `application.status = 'cancelled'`
- Sets `payment_status = 'refunded'` (for refund processing)
- Prevents cancellation after payment to avoid disputes

#### API Usage
```bash
DELETE /api/vendor/applications/{applicationId}
Headers: Authorization: Bearer {token}

Response (Success):
{
  "message": "Application cancelled successfully",
  "application": {
    "_id": "app123",
    "status": "cancelled",
    "payment_status": "refunded"
  }
}

Error (if already paid):
{
  "message": "Cannot cancel after payment has been made. Please contact admin for refund requests."
}
```

#### Cancellation Flow
1. Vendor requests cancellation
2. System checks payment_status
3. If NOT paid → Allow cancellation, mark as "cancelled"
4. If paid → Reject with error, guide to contact admin for refund

---

## Database Schema Changes

### VendorApplication.js
```javascript
// Added/Modified fields:
{
  vendor_documents: {
    tax_card: {
      file_url: String,
      file_name: String,
      uploaded_at: Date
    },
    company_logo: {
      file_url: String,
      file_name: String,
      uploaded_at: Date
    }
  },
  
  attendee_id_uploads: [{
    staff_name: String,
    staff_email: String,
    id_file_url: String,
    id_file_name: String,
    uploaded_at: Date,
    verification_status: String // 'pending', 'verified', 'rejected'
  }],
  
  status: String, // 'pending', 'accepted', 'rejected', 'cancelled'
  participation_fee: Number,
  payment_deadline: Date,
  payment_status: String, // 'not_paid', 'paid', 'refunded'
  payment_date: Date,
  rejection_reason: String
}
```

### User.js (vendor_info)
```javascript
vendor_info: {
  // ... existing fields ...
  tax_card_url: String,
  company_logo_url: String,
  documents_verified: Boolean
}
```

---

## File Structure

### Backend Files Modified/Created
```
backend/
├── controllers/
│   └── vendorDocumentsController.js (NEW) - All 6 requirements
│   └── vendorController.js (EXISTING - not modified for this PR)
├── models/
│   ├── VendorApplication.js (MODIFIED) - Added schema fields
│   └── User.js (MODIFIED) - Added vendor document URLs
├── routes/
│   └── vendorRoutes.js (MODIFIED) - Added 9 new endpoints
└── services/
    ├── emailService.js (MODIFIED) - Added rejection email, enhanced acceptance
    └── paymentService.js (EXISTING - can be used for Stripe integration)
```

### New Routes Added
1. `POST /api/vendor/documents/upload` - Upload vendor docs
2. `POST /api/vendor/applications/:id/attendee-ids/upload` - Upload attendee IDs
3. `POST /api/vendor/admin/applications/:id/accept` - Accept application
4. `POST /api/vendor/admin/applications/:id/reject` - Reject application
5. `POST /api/vendor/applications/:id/pay` - Process payment
6. `POST /api/vendor/applications/:id/qr-codes/send` - Generate & send QR codes
7. `DELETE /api/vendor/applications/:id` - Cancel application
8. `GET /api/vendor/applications/:id/status` - Get application status

---

## Testing Guide

### Prerequisites
```bash
# 1. Switch to the branch
git checkout vendor-requirements-implementation

# 2. Install dependencies
cd backend
npm install

# 3. Ensure .env has:
MONGODB_URI=mongodb://...
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
```

### Test Sequence

#### Test 1: Upload Vendor Documents (Requirement 1)
```bash
curl -X POST http://localhost:5001/api/vendor/documents/upload \
  -H "Authorization: Bearer {vendor_token}" \
  -F "tax_card=@tax_card.pdf" \
  -F "company_logo=@logo.png"

# Expected: 200 with document URLs
```

#### Test 2: Upload Attendee IDs (Requirement 2)
```bash
curl -X POST http://localhost:5001/api/vendor/applications/{appId}/attendee-ids/upload \
  -H "Authorization: Bearer {vendor_token}" \
  -F "id_0=@id1.pdf" \
  -F "id_1=@id2.pdf"

# Expected: 200 with uploaded IDs marked as "pending"
```

#### Test 3: Accept Application (Requirement 3)
```bash
curl -X POST http://localhost:5001/api/vendor/admin/applications/{appId}/accept \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json"

# Expected: 200, email sent to vendor with 3-day deadline
# Check email for: deadline date 3 days from now, participation fee
```

#### Test 4: Process Payment (Requirement 4)
```bash
curl -X POST http://localhost:5001/api/vendor/applications/{appId}/pay \
  -H "Authorization: Bearer {vendor_token}" \
  -H "Content-Type: application/json" \
  -d '{"payment_method": "wallet"}'

# Expected: 200, payment_status changes to "paid"
# Try after deadline: Should get error about deadline passed
```

#### Test 5: Generate QR Codes (Requirement 5)
```bash
curl -X POST http://localhost:5001/api/vendor/applications/{appId}/qr-codes/send \
  -H "Authorization: Bearer {vendor_token}" \
  -H "Content-Type: application/json" \
  -d '{"visitors": [{"_id": "v1", "name": "Ahmed", "email": "a@test.com"}]}'

# Expected: 200, email sent with QR code attachments
# Check email for: visitor list, QR code images, usage instructions
```

#### Test 6: Cancel Application (Requirement 6)
```bash
# Before payment (should succeed):
curl -X DELETE http://localhost:5001/api/vendor/applications/{appId} \
  -H "Authorization: Bearer {vendor_token}"

# Expected: 200, status changes to "cancelled"

# After payment (should fail):
# First accept & pay, then try delete
# Expected: 400 error about payment already made
```

#### Test 7: Reject Application (Requirement 3b)
```bash
curl -X POST http://localhost:5001/api/vendor/admin/applications/{appId}/reject \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"rejection_reason": "Incomplete documentation"}'

# Expected: 200, rejection email sent with reason
# Check email for: rejection reason, next steps, reapplication info
```

#### Test 8: Check Payment Deadline Validation
```bash
# 1. Accept application (sets 3-day deadline)
# 2. Manually set deadline to past date in MongoDB
# 3. Try to pay
# Expected: 400 error "Payment deadline has passed"
```

---

## Error Handling

All endpoints include comprehensive error handling:

```javascript
// File upload errors
400: "At least one file (tax_card or company_logo) is required"
403: "Only vendors can upload documents"
404: "Application not found"
403: "Unauthorized to upload IDs for this application"

// Payment errors
400: "Only accepted applications can be paid"
400: "Payment deadline has passed. Please contact admin..."
404: "Application not found"

// QR code errors
400: "QR codes can only be sent after payment is made"
404: "Application not found"

// Cancellation errors
400: "Cannot cancel after payment has been made..."
403: "Unauthorized to cancel this application"
404: "Application not found"

// Rejection errors
400: "Rejection reason is required"
404: "Application not found"
```

---

## Integration Notes

### Frontend Implementation Needed
1. **Vendor Profile Page**
   - Tax card upload component
   - Company logo upload component
   - Document verification status display

2. **Booth/Bazaar Application Form**
   - Attendee ID file upload for each staff member
   - Verification status tracking

3. **Payment Dashboard**
   - Show participation fee
   - Display 3-day payment deadline countdown
   - Payment button (link to wallet/Stripe)

4. **QR Code Distribution**
   - Show button after payment confirmation
   - Display when QR codes email is sent
   - Store QR codes for reprint/download

5. **Application Status Page**
   - Show application status
   - Display deadline if pending payment
   - Cancel button (disabled if paid)

### Email Configuration
- Gmail: Set up app-specific password
- Alternative: Configure SendGrid, Mailgun, or custom SMTP
- Templates: All emails use HTML with inline styles (no template files needed)

### Payment Integration
- Can use existing Stripe integration
- Wallet system implemented for test payments
- Both methods call same payment endpoint

---

## Success Criteria Met

✅ **Requirement 1:** Tax card & company logo upload with URL storage  
✅ **Requirement 2:** Attendee ID uploads with verification tracking  
✅ **Requirement 3:** Accept/reject with 3-day payment deadline + email notifications  
✅ **Requirement 4:** Participation fee calculation (bazaar size + booth weeks + location)  
✅ **Requirement 5:** QR code generation for each visitor + email delivery  
✅ **Requirement 6:** Cancellation guard (only before payment)  

---

## Deployment Checklist

- [ ] All tests passing locally
- [ ] Environment variables configured (.env)
- [ ] Email service working (test email sending)
- [ ] File upload directory configured
- [ ] S3 or file server URL configured
- [ ] Database migrations applied
- [ ] Frontend forms created for all uploads
- [ ] Stripe/payment gateway configured
- [ ] Admin dashboard updated for accept/reject
- [ ] Merge to main branch
- [ ] Deploy to production

---

## Troubleshooting

### Email Not Sending
```
Solution: Check EMAIL_USER and EMAIL_PASS in .env
Enable "Less secure app access" in Gmail settings
Or use app-specific password for Gmail
```

### File Upload Failing
```
Solution: Ensure multer middleware is configured
Check file size limits (min 5MB recommended)
Verify file permissions on upload directory
```

### Payment Deadline Issues
```
Solution: Check system time synchronization
Verify timezone in payment_deadline calculation
Test with manual deadline adjustment in MongoDB
```

### QR Code Email Issues
```
Solution: Verify email transporter is working
Check QRCode library installation (npm install qrcode)
Test with smaller visitor list first
```

---

## Future Enhancements

1. **Admin Dashboard:**
   - View all applications with filter by status
   - Bulk accept/reject functionality
   - Download attendee ID verification reports

2. **Vendor Dashboard:**
   - Upload progress tracker
   - Payment deadline countdown timer
   - QR code reprinting
   - Application history

3. **Document Verification:**
   - Manual verification workflow for admin
   - Automated OCR for tax card validation
   - Document quality checks

4. **Refund Processing:**
   - Admin refund portal
   - Automated refund for cancelled paid applications
   - Refund status tracking

5. **Attendance Tracking:**
   - Scan QR codes at event
   - Visitor check-in logging
   - Attendance reports for vendor

---

## Contact & Support

For questions or issues with this implementation:
1. Check the test guide section
2. Review error messages carefully
3. Check MongoDB data for accurate schema
4. Enable debug logging in .env
5. Contact development team

---

**Branch:** `vendor-requirements-implementation`  
**Last Updated:** 2024-01-15  
**Status:** Ready for Testing & Integration
