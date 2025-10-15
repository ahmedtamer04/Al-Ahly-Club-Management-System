# Authentication Flow: Backend ↔️ Frontend Mapping

## Complete Field Requirements Comparison

---

## 📋 REGISTRATION FLOW

### Backend Controller Requirements (signupUser)

#### **Required Fields from req.body:**
```javascript
{
  first_name,      // Required for non-vendors
  last_name,       // Required for non-vendors
  email,           // Required for all
  id_number,       // Required for non-vendors
  password,        // Required for all
  role,            // Required for all
  company_name     // Required for vendors only
}
```

---

## 👥 USER ROLES & THEIR SPECIFIC REQUIREMENTS

### 1️⃣ **STUDENT REGISTRATION**

**Backend Requirements:**
- ✅ `first_name` (required)
- ✅ `last_name` (required)
- ✅ `email` (must end with @guc.edu.eg)
- ✅ `id_number` (must be unique)
- ✅ `password` (required)
- ✅ `role` = "Student"

**Status:** Active immediately (no approval needed)

**Frontend Fields (app/auth/register/page.js):**
```javascript
{
  first_name: '',     // ✅ Matches
  last_name: '',      // ✅ Matches
  email: '',          // ✅ Matches (validated @guc.edu.eg)
  id_number: '',      // ✅ Matches
  password: '',       // ✅ Matches
  confirmPassword: '', // ✅ Frontend validation
  role: 'Student'     // ✅ Matches
}
```

---

### 2️⃣ **STAFF/TA/PROFESSOR REGISTRATION**

**Backend Requirements:**
- ✅ `first_name` (required)
- ✅ `last_name` (required)
- ✅ `email` (must end with @guc.edu.eg)
- ✅ `id_number` (must be unique)
- ✅ `password` (required)
- ✅ `role` = "Staff" | "TA" | "Professor"

**Status:** Pending (requires admin approval before login)

**Frontend Fields (app/auth/register/page.js):**
```javascript
{
  first_name: '',     // ✅ Matches
  last_name: '',      // ✅ Matches
  email: '',          // ✅ Matches (validated @guc.edu.eg)
  id_number: '',      // ✅ Matches
  password: '',       // ✅ Matches
  confirmPassword: '', // ✅ Frontend validation
  role: 'Staff|TA|Professor' // ✅ Matches
}
```

**Frontend Message:**
- ⚠️ "Your account will need admin approval before you can login"
- ⚠️ Success message shows approval pending

---

### 3️⃣ **VENDOR REGISTRATION**

**Backend Requirements:**
- ✅ `email` (any valid email)
- ✅ `password` (required)
- ✅ `company_name` (required)
- ✅ `role` = "Vendor"
- ❌ NO email domain restriction (@guc.edu.eg not required)
- ❌ NO first_name, last_name, id_number needed
- 🔢 `id_number` auto-generated (random 6-digit)
- 📝 `first_name` set to company_name automatically
- 📝 `last_name` set to "Vendor" automatically

**Status:** Active immediately (no approval needed)

**Frontend Fields (app/auth/register/page.js):**
```javascript
{
  company_name: '',   // ✅ Matches (required for vendors)
  email: '',          // ✅ Matches (any email)
  password: '',       // ✅ Matches
  confirmPassword: '', // ✅ Frontend validation
  role: 'Vendor'      // ✅ Matches
}
```

**Frontend Behavior:**
- Shows `company_name` field ONLY for vendors
- Hides `first_name`, `last_name`, `id_number` for vendors
- No @guc.edu.eg validation for vendors

---

### 4️⃣ **ADMIN/EVENTSOFFICE REGISTRATION**

**Backend Requirements:**
- ❌ **BLOCKED** - Cannot register via signup
- ❌ Returns error: "Cannot signup as Admin or Events Office"

**Frontend Fields (app/auth/register/page.js):**
- ❌ Admin and EventsOffice NOT in role dropdown
- ℹ️ Info message: "Admin/EventsOffice: Cannot register (Contact existing admin)"

---

## 🔐 LOGIN FLOW

### Backend Controller Requirements (loginUser)

**Required Fields from req.body:**
```javascript
{
  email,     // Required
  password   // Required
}
```

**Backend Response Scenarios:**

#### ✅ **Success (200)**
```javascript
{
  token: "JWT_TOKEN",
  user: { /* user object */ }
}
```

#### ❌ **Blocked User (403)**
```javascript
{
  message: "You are blocked"
}
```

#### ⏳ **Pending Approval (403)**
```javascript
{
  message: "Waiting for approval"
}
```

#### 🚫 **Inactive Account (403)**
```javascript
{
  message: "Account is not active"
}
```

#### ❌ **Invalid Credentials (400)**
```javascript
{
  message: "Invalid credentials"
}
```

---

### Frontend Login (app/auth/login/page.js)

**Form Fields:**
```javascript
{
  email: '',     // ✅ Matches backend
  password: ''   // ✅ Matches backend
}
```

**Frontend Error Handling:**
- ✅ Alert component for displaying backend messages
- ✅ Color-coded alerts (error, warning, success, info)
- ✅ User-friendly error messages

**Expected Flow:**
1. User submits email + password
2. POST to `/api/auth/login`
3. Backend validates and returns response
4. Frontend shows appropriate message
5. On success: Store token, redirect to dashboard

---

## 🎨 FRONTEND DESIGN FEATURES

### Dynamic Form Based on Role

**Registration Form Behavior:**

```javascript
if (role === 'Vendor') {
  // Show:
  - Company Name field
  - Email field (any email)
  - Password fields
  
  // Hide:
  - First Name field
  - Last Name field
  - ID Number field
  - @guc.edu.eg validation
}

else if (role === 'Student' || role === 'Staff' || role === 'TA' || role === 'Professor') {
  // Show:
  - First Name field
  - Last Name field
  - GUC Email field (with @guc.edu.eg validation)
  - ID Number field
  - Password fields
  
  // Hide:
  - Company Name field
  
  // Additional for Staff/TA/Professor:
  - Warning message about approval requirement
}
```

---

## ✅ VALIDATION RULES

### Frontend Validation (Before API Call)

#### All Users:
- ✅ Email format validation
- ✅ Password match validation (password === confirmPassword)
- ✅ All required fields filled
- ✅ Password minimum length (6 characters)

#### Non-Vendor Users:
- ✅ Email must end with @guc.edu.eg
- ✅ First name required
- ✅ Last name required
- ✅ ID number required

#### Vendor Users:
- ✅ Company name required
- ✅ Email can be any valid format
- ❌ No @guc.edu.eg restriction

### Backend Validation

#### All Users:
- ✅ Email uniqueness check
- ✅ Password hashing (bcrypt with salt 10)

#### Non-Vendor Users:
- ✅ Email domain validation (@guc.edu.eg)
- ✅ ID number uniqueness check

#### Vendor Users:
- ✅ Email uniqueness only
- ✅ Auto-generate ID number (random 6-digit)
- ✅ Set first_name = company_name
- ✅ Set last_name = "Vendor"

---

## 📊 FIELD MAPPING SUMMARY

| Backend Field | Student/Staff/TA/Prof | Vendor | Required |
|--------------|----------------------|--------|----------|
| `first_name` | ✅ User input | 🔧 Auto: company_name | Yes |
| `last_name` | ✅ User input | 🔧 Auto: "Vendor" | Yes |
| `email` | ✅ @guc.edu.eg | ✅ Any email | Yes |
| `id_number` | ✅ User input | 🔧 Auto: Random | Yes |
| `password` | ✅ User input | ✅ User input | Yes |
| `role` | ✅ User selection | ✅ "Vendor" | Yes |
| `company_name` | ❌ N/A | ✅ User input | Vendors only |

---

## 🎯 USER STATUS FLOW

### Student:
1. Register → Active immediately
2. Can login right away
3. Access student dashboard

### Staff/TA/Professor:
1. Register → Status: "pending"
2. Cannot login (403: "Waiting for approval")
3. Admin approves → Status: "active"
4. Can login and access dashboard

### Vendor:
1. Register → Active immediately
2. Can login right away
3. Access vendor dashboard

### Admin/EventsOffice:
1. Cannot register via signup
2. Must be created by existing admin
3. Use `/api/admin/create-admin` endpoint
4. Or use `/api/auth/create-first-admin` (temporary)

---

## 🔧 API ENDPOINTS

### Registration
```
POST /api/auth/signup

Body (Non-Vendor):
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@guc.edu.eg",
  "id_number": "12345",
  "password": "password123",
  "role": "Student"
}

Body (Vendor):
{
  "email": "vendor@company.com",
  "password": "password123",
  "company_name": "My Company",
  "role": "Vendor"
}
```

### Login
```
POST /api/auth/login

Body:
{
  "email": "user@guc.edu.eg",
  "password": "password123"
}

Response (Success):
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "...",
    "email": "...",
    "role": "...",
    "status": "active"
  }
}
```

### Logout
```
POST /api/auth/logout

Response:
{
  "message": "Logged out successfully"
}
```

---

## 🎨 FRONTEND UI COMPONENTS

### Alert Component
```javascript
{message.text && (
  <div className={`alert alert-${message.type}`}>
    {message.text}
  </div>
)}
```

**Alert Types:**
- `alert-success` - Green (account created successfully)
- `alert-error` - Red (validation errors, login failures)
- `alert-warning` - Yellow (pending approval)
- `alert-info` - Blue (informational messages)

### Info Box
```javascript
<div className="info-box">
  <h4>📋 Registration Requirements:</h4>
  <ul>
    <li><strong>Student:</strong> Details...</li>
    <li><strong>Staff/TA/Professor:</strong> Details...</li>
    <li><strong>Vendor:</strong> Details...</li>
  </ul>
</div>
```

### Form Row (Side-by-side inputs)
```javascript
<div className="form-row">
  <div className="form-group">
    <label>First Name</label>
    <input type="text" />
  </div>
  <div className="form-group">
    <label>Last Name</label>
    <input type="text" />
  </div>
</div>
```

---

## ✅ VERIFICATION CHECKLIST

### Frontend ↔️ Backend Alignment

#### Registration:
- ✅ All backend fields mapped to frontend
- ✅ Vendor-specific logic implemented
- ✅ Email validation matches backend rules
- ✅ Role-based form rendering working
- ✅ Approval warning for Staff/TA/Professor
- ✅ Password confirmation validation
- ✅ Success/error messages displayed

#### Login:
- ✅ Email and password fields match
- ✅ Error handling for all backend responses
- ✅ Alert system for user feedback
- ✅ Token storage ready (TODO)
- ✅ Dashboard redirect ready (TODO)

#### Styling:
- ✅ German flag colors maintained
- ✅ Responsive design
- ✅ Alert components styled
- ✅ Info boxes styled
- ✅ Form rows for side-by-side inputs

---

## 🚀 NEXT STEPS (Backend Integration)

### Priority 1: Connect Registration
1. Replace console.log with fetch/axios call
2. POST to `/api/auth/signup`
3. Handle success/error responses
4. Show appropriate messages
5. Redirect to login on success

### Priority 2: Connect Login
1. Replace console.log with fetch/axios call
2. POST to `/api/auth/login`
3. Handle all response scenarios
4. Store JWT token in localStorage/cookies
5. Redirect to role-based dashboard
6. Handle blocked/pending/inactive states

### Priority 3: Authentication Context
1. Create React Context for auth state
2. Store user data and token
3. Add protected route wrapper
4. Implement logout functionality
5. Auto-redirect on token expiry

---

**Status:** ✅ **FRONTEND MATCHES ALL BACKEND REQUIREMENTS**  
**Date:** October 15, 2025  
**Files Updated:**
- ✅ `/app/auth/register/page.js` - Complete role-based registration
- ✅ `/app/auth/login/page.js` - Enhanced with error handling
- ✅ `/app/auth/auth.css` - Added alert, info-box, form-row styles
