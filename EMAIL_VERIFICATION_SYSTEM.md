# Email Verification System

## Overview

This document describes the email verification system implemented for the Al-Ahly Club Management System. The system ensures that all users verify their email addresses before gaining access to the platform.

## User Flows

### 1. **Student Registration Flow**

1. Student registers via `/auth/register` with a `@guc.edu.eg` email
2. System creates account with:
   - `status: "pending"`
   - `is_verified: false`
   - Generates verification token (24-hour expiry)
3. Student receives **immediate** verification email
4. Student clicks verification link → redirected to `/verify-email/[token]`
5. Backend verifies token and activates account:
   - `status: "active"`
   - `is_verified: true`
6. Student redirected to login page
7. Student can now log in

**If student tries to log in before verification:**

- Login fails with message: "Please verify your email address. Check your inbox for the verification link."

---

### 2. **Staff / TA / Professor Registration Flow**

1. Staff/TA/Professor registers via `/auth/register` with a `@guc.edu.eg` email
2. System creates account with:
   - `status: "pending"`
   - `role_admin_verified: false`
   - `is_verified: false`
3. Account awaits admin approval (no email sent yet)
4. **Admin approves the role** via admin dashboard
5. Upon approval:
   - `role_admin_verified: true`
   - Generates verification token (24-hour expiry)
   - System sends verification email
6. User receives approval notification + verification email
7. User clicks verification link → redirected to `/verify-email/[token]`
8. Backend verifies token and activates account:
   - `status: "active"`
   - `is_verified: true`
9. User redirected to login page
10. User can now log in

**If user tries to log in before admin approval:**

- Login fails with message: "Your account is pending admin approval. Please wait for verification."

**If user tries to log in after admin approval but before email verification:**

- Login fails with message: "Your role has been approved. Please check your email to verify your account."

---

## Database Schema Changes

### User Model Fields

```javascript
{
  is_verified: { type: Boolean, default: false },
  role_admin_verified: {
    type: Boolean,
    default: null
    // null = not applicable (Student, Vendor)
    // false = waiting for admin approval (Staff/TA/Professor)
    // true = admin approved (Staff/TA/Professor)
  },
  email_verification_token: { type: String },
  email_verification_expires: { type: Date }
}
```

---

## API Endpoints

### 1. Student Registration

**Endpoint:** `POST /api/auth/signup`

**Request Body:**

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@guc.edu.eg",
  "id_number": "12345",
  "password": "password123",
  "role": "Student"
}
```

**Response (Success):**

```json
{
  "message": "Registration successful! Please check your email to verify your account.",
  "user": {
    "id": "...",
    "email": "john.doe@guc.edu.eg",
    "role": "Student",
    "status": "pending",
    "is_verified": false
  }
}
```

---

### 2. Admin Approves Staff/TA/Professor

**Endpoint:** `POST /api/admin/approve/:userId`

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Response (Success):**

```json
{
  "message": "Professor user approved. Verification email sent to user@guc.edu.eg",
  "user": {
    "id": "...",
    "email": "user@guc.edu.eg",
    "role": "Professor",
    "status": "pending",
    "is_verified": false,
    "role_admin_verified": true
  }
}
```

---

### 3. Email Verification

**Endpoint:** `GET /api/admin/verify-email/:token`

**No authentication required**

**Response (Success):**

```json
{
  "message": "Email verified successfully! Your registration is now complete and your account is active.",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john.doe@guc.edu.eg",
    "role": "Student",
    "status": "active"
  }
}
```

**Response (Expired/Invalid Token):**

```json
{
  "message": "Invalid or expired verification token. Please contact admin to resend verification email."
}
```

---

### 4. Resend Verification Email (Admin Only)

**Endpoint:** `POST /api/admin/resend-verification/:userId`

**Headers:**

```
Authorization: Bearer <admin_token>
```

**Response:**

```json
{
  "message": "Verification email resent to user@guc.edu.eg"
}
```

---

## Email Templates

### Student Verification Email

- **Subject:** "GUC Al-Ahly - Verify Your Email"
- **Content:** Welcome message + verification button
- **Note:** User won't be able to log in until verified

### Staff/TA/Professor Verification Email

- **Subject:** "GUC Al-Ahly - Your Account Has Been Approved"
- **Content:** Approval notification + verification button
- **Note:** Must verify email to log in

Both emails include:

- Verification button/link (24-hour expiry)
- Fallback plain-text link
- Contact information

---

## Frontend Pages

### 1. Registration Page (`/auth/register`)

- Shows role-specific success messages
- Students: "Please check your email to verify your account"
- Staff/TA/Professor: "Waiting for admin approval. You will receive a verification email once approved."

### 2. Login Page (`/auth/login`)

- Displays appropriate error messages for:
  - Unverified email
  - Pending admin approval
  - Blocked accounts

### 3. Email Verification Page (`/verify-email/[token]`)

- Shows loading spinner during verification
- Success state: Displays user info + auto-redirects to login (3s)
- Error state: Explains issue + provides action buttons
- No authentication required

---

## Environment Variables Required

```env
# Email Service (Gmail example)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Frontend URL for verification links
FRONTEND_URL=http://localhost:3000

# Existing variables
MONGO_URI=...
JWT_SECRET=...
PORT=5001
```

---

## Error Handling

### Login Errors

1. **"Please verify your email address"** → Student hasn't clicked verification link
2. **"Your account is pending admin approval"** → Staff/TA/Professor waiting for admin
3. **"Your role has been approved. Please check your email"** → Admin approved but email not verified
4. **"Your account has been blocked"** → Admin blocked the account

### Verification Errors

1. **Token expired** → Link older than 24 hours
2. **Invalid token** → Malformed or non-existent token
3. **Already verified** → User already completed verification

---

## Security Considerations

1. **Token Expiry:** All verification tokens expire after 24 hours
2. **One-time Use:** Tokens are deleted after successful verification
3. **Secure Generation:** Uses `crypto.randomBytes(32)` for token generation
4. **No Authentication Required:** Verification endpoint is public (by design)
5. **Email Validation:** Ensures `@guc.edu.eg` domain for non-vendor users

---

## Testing the System

### Test Student Registration & Verification

1. Register as Student with valid GUC email
2. Check email for verification link
3. Click verification link
4. Verify redirect to login page
5. Log in with credentials

### Test Staff/TA/Professor Registration & Verification

1. Register as Staff/TA/Professor
2. Login attempt should fail (pending approval)
3. Admin approves the account
4. User receives verification email
5. User clicks verification link
6. Verify redirect to login page
7. Log in with credentials

### Test Expired Token

1. Create account
2. Wait 24+ hours (or manually expire token in DB)
3. Click verification link
4. Verify error message displayed

---

## Admin Dashboard Integration

Admins can:

1. **View pending users:** `GET /api/admin/pending-users`
2. **Approve users:** `POST /api/admin/approve/:userId` (sends verification email)
3. **Resend verification:** `POST /api/admin/resend-verification/:userId`
4. **View all users:** `GET /api/admin/users` (includes verification status)

---

## Migration Notes

If updating an existing system:

1. Existing active users should have `is_verified: true` set
2. Existing Staff/TA/Professor with `status: "active"` should have both:
   - `is_verified: true`
   - `role_admin_verified: true`
3. Run migration script to update existing user records

---

## Support & Troubleshooting

### User didn't receive verification email

- Check spam/junk folder
- Verify EMAIL_USER and EMAIL_PASS are correctly set
- Check backend logs for email sending errors
- Admin can resend verification email

### Verification link not working

- Check if token expired (24-hour limit)
- Verify FRONTEND_URL is correctly set
- Check if user already verified

### Login still failing after verification

- Verify `is_verified` and `status` are both correct in database
- Check for any other account restrictions (blocked status)
- Clear browser cache/cookies

---

## Future Enhancements

1. **Password reset via email** (same token system)
2. **Email change verification** (verify new email before updating)
3. **Customizable token expiry** (per role or system-wide)
4. **Email templates in HTML builder** (for easier customization)
5. **Multi-language email support**
6. **SMS verification as fallback**

---

## Conclusion

This email verification system provides a secure, user-friendly way to ensure all users have valid email addresses before accessing the platform. The two-tier approval system (admin + email) for Staff/TA/Professor adds an extra layer of security while maintaining a smooth user experience.
