# Vendor Requirements API Quick Reference

## Base URL
```
http://localhost:5000/api/vendor
```

## Authentication
All endpoints require:
```
Headers: {
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json" (except file uploads)
}
```

---

## 1. Document Upload Endpoints

### Upload Vendor Documents
```
POST /documents/upload
Headers: Authorization, Content-Type: multipart/form-data
Body: tax_card (file), company_logo (file)
Response: 200 { documents, vendor_verified }
```

### Upload Attendee IDs
```
POST /applications/:application_id/attendee-ids/upload
Headers: Authorization, Content-Type: multipart/form-data
Body: id_0, id_1, id_2 (files)
Response: 200 { uploaded_ids, pending_verification_count }
```

---

## 2. Payment Endpoints

### Check Application Status
```
GET /applications/:application_id/status
Headers: Authorization
Response: 200 { 
  status, 
  payment_status, 
  participation_fee, 
  payment_deadline,
  is_payment_overdue,
  days_until_deadline 
}
```

### Process Payment
```
POST /applications/:application_id/pay
Headers: Authorization
Body: { payment_method: "wallet|stripe|card" }
Response: 200 { payment_status, payment_date, participation_fee }
Error: 400 "Payment deadline has passed"
```

---

## 3. Admin Acceptance/Rejection

### Accept Application (Admin Only)
```
POST /admin/applications/:application_id/accept
Headers: Authorization (admin token)
Response: 200 {
  application: {
    status: "accepted",
    participation_fee: number,
    payment_deadline: date
  }
}
```

### Reject Application (Admin Only)
```
POST /admin/applications/:application_id/reject
Headers: Authorization (admin token)
Body: { rejection_reason: "string" }
Response: 200 {
  application: {
    status: "rejected",
    rejection_reason: "string"
  }
}
```

---

## 4. QR Code Endpoints

### Generate & Send QR Codes
```
POST /applications/:application_id/qr-codes/send
Headers: Authorization
Body: {
  visitors: [
    { _id: "id", name: "Name", email: "email@example.com" },
    ...
  ]
}
Response: 200 { message, total_qr_codes }
Requirement: payment_status must be "paid"
```

---

## 5. Cancellation Endpoint

### Cancel Application
```
DELETE /applications/:application_id
Headers: Authorization
Response: 200 { status: "cancelled", payment_status: "refunded" }
Error: 400 "Cannot cancel after payment has been made"
Requirement: payment_status must NOT be "paid"
```

---

## Fee Calculation

### Bazaar Fees
```
2x2 Booth: $250
4x4 Booth: $400
```

### Booth Event Fees
```
Base: $100 per week
Location Premium:
  - North wall: +$150
  - South wall: +$150
  - Other locations: +$0

Example: 2 weeks, south wall = $100*2 + $150 = $350
```

---

## Payment Deadline

- Set automatically when application is ACCEPTED
- Deadline = Current date/time + 3 days
- Vendor cannot pay after deadline (returns 400 error)
- Admin must approve extension for late payments

---

## Email Notifications

### Automatic Emails Sent

**1. Acceptance Email**
- Trigger: Admin accepts application
- To: Vendor email
- Includes: Participation fee, 3-day deadline, payment link

**2. Rejection Email**
- Trigger: Admin rejects application  
- To: Vendor email
- Includes: Rejection reason, reapplication info

**3. QR Code Email**
- Trigger: Vendor requests after payment
- To: Vendor email
- Includes: All visitor QR codes, usage instructions

---

## Response Format

### Success (2xx)
```json
{
  "message": "Description of action",
  "data": { /* endpoint-specific */ }
}
```

### Error (4xx/5xx)
```json
{
  "message": "Error description"
}
```

---

## Common Status Values

### Application Status
- `pending` - Awaiting admin review
- `accepted` - Approved, waiting for payment
- `paid` - Payment received, approved
- `rejected` - Application declined
- `cancelled` - Vendor cancelled

### Payment Status
- `not_paid` - Awaiting payment
- `paid` - Payment received
- `refunded` - Payment refunded

### Verification Status
- `pending` - Awaiting admin verification
- `verified` - Admin verified, approved
- `rejected` - Failed verification

---

## Example Workflow

```
1. Vendor uploads documents
   POST /documents/upload
   
2. Vendor applies to bazaar/booth
   (existing endpoint)
   
3. Admin accepts application
   POST /admin/applications/{id}/accept
   → Vendor receives email with deadline
   
4. Vendor uploads attendee IDs
   POST /applications/{id}/attendee-ids/upload
   
5. Vendor processes payment
   POST /applications/{id}/pay
   → Payment must be within 3 days
   
6. Vendor requests QR codes
   POST /applications/{id}/qr-codes/send
   → Vendor receives email with QR codes
   
7. At event, scan QR codes for visitor verification
   (separate endpoint, not implemented in this PR)
```

---

## Testing Tips

### Postman Collection Template

```json
{
  "info": {
    "name": "Vendor Requirements API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Upload Documents",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/vendor/documents/upload",
        "header": [
          {"key": "Authorization", "value": "Bearer {{vendor_token}}"}
        ]
      }
    },
    {
      "name": "Admin Accept Application",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/vendor/admin/applications/{{app_id}}/accept",
        "header": [
          {"key": "Authorization", "value": "Bearer {{admin_token}}"}
        ]
      }
    }
  ]
}
```

### Database Verification

Check MongoDB for test data:
```javascript
// Check vendor documents
db.users.findOne({ _id: ObjectId("...") }, { "vendor_info": 1 })

// Check application status and payment
db.vendorapplications.findOne({ _id: ObjectId("...") }, {
  status: 1,
  participation_fee: 1,
  payment_deadline: 1,
  payment_status: 1,
  vendor_documents: 1
})

// Check attendee IDs
db.vendorapplications.findOne(
  { _id: ObjectId("...") },
  { attendee_id_uploads: 1 }
)
```

---

## Troubleshooting Quick Answers

**Q: Payment returned "Payment deadline has passed" but deadline is tomorrow**
A: Check system time. Verify `payment_deadline` in database matches expected date.

**Q: QR code email not received**
A: Check spam folder. Verify `payment_status` is "paid" before requesting QR codes.

**Q: File upload returned "Unauthorized"**
A: Verify authorization token is valid and user role is "Vendor".

**Q: Cancellation returned "Cannot cancel"**
A: Application was already paid. Contact admin for refund processing.

---

**All 6 requirements are fully implemented and ready for testing!**
