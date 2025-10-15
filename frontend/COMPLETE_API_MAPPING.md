# 🔌 Complete API Integration Mapping

## Overview
This document maps all backend controllers, routes, and authentication requirements to frontend pages with exact field specifications.

---

## 📋 Table of Contents
1. [Authentication APIs](#authentication-apis)
2. [Workshop APIs](#workshop-apis)
3. [Trip APIs](#trip-apis)
4. [Bazaar APIs](#bazaar-apis)
5. [Conference APIs](#conference-apis)
6. [Gym Session APIs](#gym-session-apis)
7. [Facility APIs](#facility-apis)
8. [Event APIs (General)](#event-apis-general)
9. [Registration APIs](#registration-apis)
10. [Vendor APIs](#vendor-apis)
11. [Admin APIs](#admin-apis)

---

## 🔐 Authentication APIs

### POST /api/auth/signup
**Controller**: `authController.js` → `signupUser`  
**Route**: `authRoutes.js` → No auth required  
**Who can use**: Anyone (public endpoint)

**Required Fields by Role**:

**Student/Staff/TA/Professor**:
```javascript
{
  first_name: string,
  last_name: string,
  email: string,        // Must end with @guc.edu.eg
  id_number: string,
  password: string,
  role: "Student" | "Staff" | "TA" | "Professor"
}
```

**Vendor**:
```javascript
{
  company_name: string,
  email: string,        // Any valid email
  password: string,
  role: "Vendor"
}
```

**Response**:
```javascript
{
  message: "User created",
  user: { ...userObject }
}
```

**Frontend Page**: `app/auth/register/page.js` ✅ IMPLEMENTED

---

### POST /api/auth/login
**Controller**: `authController.js` → `loginUser`  
**Route**: `authRoutes.js` → No auth required  
**Who can use**: Anyone (public endpoint)

**Required Fields**:
```javascript
{
  email: string,
  password: string
}
```

**Possible Responses**:
- **200 Success**: `{ token: string, user: {...} }`
- **403 Blocked**: `{ message: "You are blocked" }`
- **403 Pending**: `{ message: "Waiting for approval" }`
- **403 Inactive**: `{ message: "Account is not active" }`
- **400 Invalid**: `{ message: "Invalid credentials" }`

**Frontend Page**: `app/auth/login/page.js` ✅ IMPLEMENTED

---

## 🎓 Workshop APIs

### POST /api/workshop/
**Controller**: `workshopController.js` → `createWorkshop`  
**Route**: `workshopRoutes.js` → `requireEventsOffice`  
**Who can use**: EventsOffice only

**Required Fields**:
```javascript
{
  name: string,
  location: string,
  short_description: string,
  start_date: Date,     // ISO string
  end_date: Date,       // ISO string
  time: string,
  full_agenda: string,
  faculty_responsible: string,
  professors_participating: string,
  required_budget: number,
  funding_source: string,
  extra_resources: string,
  capacity: number,
  registration_deadline: Date  // ISO string
}
```

**Response**:
```javascript
{
  message: "Workshop created successfully",
  workshop: { ...workshopObject }
}
```

**Frontend Page**: `app/eventsoffice/workshops/create/page.js` ⏳ NEEDS UPDATE

---

### PUT /api/workshop/:id
**Controller**: `workshopController.js` → `editWorkshop`  
**Route**: `workshopRoutes.js` → `requireEventsOffice`  
**Who can use**: EventsOffice only (must be creator)

**Optional Fields** (send only what you want to update):
- Same fields as create, all optional

**Frontend Page**: `app/eventsoffice/workshops/page.js` ⏳ NEEDS UPDATE

---

### GET /api/workshop/my
**Controller**: `workshopController.js` → `getMyWorkshops`  
**Route**: `workshopRoutes.js` → `requireEventsOffice`  
**Who can use**: EventsOffice only

**No Request Body Required**

**Response**:
```javascript
{
  workshops: [ ...workshopArray ]
}
```

**Frontend Page**: `app/eventsoffice/workshops/page.js` ⏳ NEEDS UPDATE

---

## 🚌 Trip APIs

### POST /api/trip/createTrip
**Controller**: `tripController.js` → `createTrip`  
**Route**: `tripRoutes.js` → `requireEventsOffice`  
**Who can use**: EventsOffice only

**Required Fields**:
```javascript
{
  name: string,
  location: string,
  price: number,
  start_date: Date,     // ISO string
  end_date: Date,       // ISO string
  time: string,
  short_description: string,
  capacity: number,
  registration_deadline: Date  // ISO string
}
```

**Response**:
```javascript
{
  message: "Trip created successfully",
  trip: { ...tripObject }
}
```

**Frontend Page**: `app/eventsoffice/trips/create/page.js` ⏳ NEEDS UPDATE

---

### PUT /api/trip/updateTrip/:id
**Controller**: `tripController.js` → `updateTrip`  
**Route**: `tripRoutes.js` → `requireEventsOffice`  
**Who can use**: EventsOffice only

**Optional Fields** (send only what you want to update)

**Frontend Page**: `app/eventsoffice/trips/page.js` ⏳ NEEDS UPDATE

---

### GET /api/trip/listTrips
**Controller**: `tripController.js` → `listTrips`  
**Route**: `tripRoutes.js` → `requireStudentOrAbove`  
**Who can use**: Student, TA, Staff, Professor, EventsOffice, Admin

**Query Parameters**:
- `page`: number (default: 1)
- `limit`: number (default: 10, max: 100)
- `status`: "upcoming" | "ongoing" | "completed"
- `location`: string

**Response**:
```javascript
{
  trips: [ ...tripArray ],
  page: number,
  totalPages: number,
  total: number
}
```

**Frontend Pages**:
- `app/eventsoffice/trips/page.js` ⏳ NEEDS UPDATE
- `app/student/trips/page.js` ⏳ NEEDS UPDATE

---

### GET /api/trip/getTrip/:id
**Controller**: `tripController.js` → `getTrip`  
**Route**: `tripRoutes.js` → `requireStudentOrAbove`  
**Who can use**: Student, TA, Staff, Professor, EventsOffice, Admin

**No Request Body Required**

**Response**:
```javascript
{
  trip: { ...tripObject }
}
```

**Frontend Pages**: Various trip detail pages ⏳ NEEDS IMPLEMENTATION

---

## 🎪 Bazaar APIs

### POST /api/bazaar/createBazaar
**Controller**: `bazaarController.js` → `createBazaar`  
**Route**: `bazaarRoutes.js` → `requireEventsOffice`  
**Who can use**: EventsOffice only

**Required Fields**:
```javascript
{
  name: string,
  location: string,
  short_description: string,
  start_date: Date,     // ISO string
  end_date: Date,       // ISO string
  time: string,
  registration_deadline: Date  // ISO string
}
```

**Response**:
```javascript
{
  message: "Bazaar created successfully",
  bazaar: { ...bazaarObject }
}
```

**Frontend Page**: `app/eventsoffice/bazaars/create/page.js` ⏳ NEEDS UPDATE

---

### PUT /api/bazaar/editBazaar/:id
**Controller**: `bazaarController.js` → `editBazaar`  
**Route**: `bazaarRoutes.js` → `requireEventsOffice`  
**Who can use**: EventsOffice only

**Optional Fields** (send only what you want to update)

**Frontend Page**: `app/eventsoffice/bazaars/page.js` ⏳ NEEDS UPDATE

---

### GET /api/bazaar/all
**Controller**: `bazaarController.js` → `getAllBazaars`  
**Route**: `bazaarRoutes.js` → `auth` (any authenticated user)  
**Who can use**: Any authenticated user

**No Request Body Required**

**Response**:
```javascript
{
  bazaars: [ ...bazaarArray ]
}
```

**Frontend Pages**:
- `app/eventsoffice/bazaars/page.js` ⏳ NEEDS UPDATE
- `app/vendor/bazaars/page.js` ⏳ NEEDS UPDATE

---

### GET /api/bazaar/:id
**Controller**: `bazaarController.js` → `getBazaarById`  
**Route**: `bazaarRoutes.js` → `auth`  
**Who can use**: Any authenticated user

**Response**:
```javascript
{
  bazaar: { ...bazaarObject }
}
```

---

## 🎤 Conference APIs

### POST /api/conference/create
**Controller**: `conferenceController.js` → `createConference`  
**Route**: `conferenceRoutes.js` → `requireEventsOffice`  
**Who can use**: EventsOffice only

**Required Fields**:
```javascript
{
  name: string,
  location: string,
  short_description: string,
  start_date: Date,     // ISO string
  end_date: Date,       // ISO string
  time: string,
  campus: string,
  professors_participating: string,
  full_agenda: string,
  conference_website: string,
  required_budget: number,
  funding_source: string,
  extra_required_sources: string
}
```

**Frontend Page**: `app/eventsoffice/create/page.js` ⏳ NEEDS UPDATE

---

### PUT /api/conference/:id
**Controller**: `conferenceController.js` → `editConference`  
**Route**: `conferenceRoutes.js` → `requireEventsOffice`  
**Who can use**: EventsOffice only

**Optional Fields** (send only what you want to update)

---

## 🏋️ Gym Session APIs

### GET /api/gymSession/schedule
**Controller**: `gymSessionController.js` → `viewGymSchedule`  
**Route**: `gymSessionsRoutes.js` → `requireStudentOrAbove`  
**Who can use**: Student, TA, Staff, Professor, EventsOffice, Admin

**Query Parameters**:
- `month`: number (1-12)
- `year`: number
- `type`: "cardio" | "strength" | "yoga" | "pilates" | "crossfit"

**Response**:
```javascript
{
  message: "Gym schedule retrieved successfully",
  count: number,
  sessions: [ ...sessionArray ]
}
```

**Frontend Pages**:
- `app/eventsoffice/gym/page.js` ⏳ NEEDS UPDATE
- `app/student/gym/schedule/page.js` ⏳ NEEDS UPDATE

---

### POST /api/gymSession/create
**Controller**: `gymSessionController.js` → `createGymSession`  
**Route**: `gymSessionsRoutes.js` → `requireAdminOrEventsOffice`  
**Who can use**: Admin, EventsOffice

**Required Fields**:
```javascript
{
  date: Date,           // ISO string, must be in future
  time: string,
  duration: number,     // minutes
  type: "cardio" | "strength" | "yoga" | "pilates" | "crossfit",
  maxParticipants: number
}
```

**Response**:
```javascript
{
  message: "Gym session created successfully",
  session: { ...sessionObject }
}
```

**Frontend Page**: `app/eventsoffice/gym/page.js` ⏳ NEEDS UPDATE

---

### PUT /api/gymSession/edit/:id
**Controller**: `gymSessionController.js` → `editGymSession`  
**Route**: `gymSessionsRoutes.js` → `requireAdminOrEventsOffice`  
**Who can use**: Admin, EventsOffice

**Optional Fields**:
```javascript
{
  date: Date,
  time: string,
  duration: number
}
```

**Frontend Page**: `app/eventsoffice/gym/page.js` ⏳ NEEDS UPDATE

---

### PATCH /api/gymSession/cancel/:id
**Controller**: `gymSessionController.js` → `cancelGymSession`  
**Route**: `gymSessionsRoutes.js` → `requireAdminOrEventsOffice`  
**Who can use**: Admin, EventsOffice

**No Request Body Required**

**Response**:
```javascript
{
  message: "Gym session cancelled",
  cancelledSession: { ...sessionObject }
}
```

**Frontend Page**: `app/eventsoffice/gym/page.js` ⏳ NEEDS UPDATE

---

## 🏟️ Facility APIs

### GET /api/facility/getAll
**Controller**: `facilityController.js` → `getAllFacilities`  
**Route**: `facilityRoutes.js` → `requireStudent`  
**Who can use**: Any authenticated user (Student minimum)

**No Request Body Required**

**Response**:
```javascript
[
  {
    _id: string,
    type: "Football" | "Basketball" | "Tennis" | "Volleyball" | "Squash" | "Gym" | "Pool",
    capacity: number,
    hourly_rate: number,
    status: "available" | "maintenance" | "unavailable"
  },
  ...
]
```

**Frontend Pages**:
- `app/eventsoffice/facilities/page.js` ⏳ NEEDS UPDATE
- `app/student/facilities/page.js` ⏳ NEEDS UPDATE

---

### POST /api/facility/add
**Controller**: `facilityController.js` → `addFacility`  
**Route**: `facilityRoutes.js` → `requireAdminOrEventsOffice`  
**Who can use**: Admin, EventsOffice

**Required Fields**:
```javascript
{
  type: "Football" | "Basketball" | "Tennis" | "Volleyball" | "Squash" | "Gym" | "Pool",
  capacity: number,
  hourly_rate: number,
  status: "available" | "maintenance" | "unavailable"
}
```

**Response**:
```javascript
{
  message: "Facility added successfully",
  facility: { ...facilityObject }
}
```

**Frontend Page**: `app/eventsoffice/facilities/page.js` ⏳ NEEDS UPDATE

---

## 🎉 Event APIs (General)

### GET /api/events/upcoming
**Controller**: `eventController.js` → `getUpcomingEvents`  
**Route**: `eventRoutes.js` → `requireStudentOrAbove`  
**Who can use**: Student, TA, Staff, Professor, EventsOffice, Admin

**No Request Body Required**

**Response**:
```javascript
[
  {
    _id: string,
    type: "Workshop" | "Trip" | "Bazaar" | "Conference",
    name: string,
    location: string,
    short_description: string,
    start_date: Date,
    end_date: Date,
    time: string,
    status: "upcoming" | "ongoing" | "completed" | "cancelled",
    ...typeSpecificFields
  },
  ...
]
```

**Frontend Pages**:
- `app/student/page.js` ⏳ NEEDS UPDATE
- `app/student/events/page.js` ⏳ NEEDS UPDATE
- `app/ta/events/page.js` ⏳ NEEDS UPDATE
- `app/professor/page.js` ⏳ NEEDS UPDATE

---

### GET /api/events/filter/:field/:value
**Controller**: `eventController.js` → `filterEvents`  
**Route**: `eventRoutes.js` → `requireStudentOrAbove`  
**Who can use**: Student, TA, Staff, Professor, EventsOffice, Admin

**Path Parameters**:
- `field`: "name" | "type" | "professor" | "location"
- `value`: string (case-insensitive regex search)

**Examples**:
- `/api/events/filter/name/workshop`
- `/api/events/filter/type/Trip`
- `/api/events/filter/location/Cairo`

**Response**: Array of matching events

---

### GET /api/events/sort/date/:order
**Controller**: `eventController.js` → `sortEventsByDate`  
**Route**: `eventRoutes.js` → `requireStudentOrAbove`  
**Who can use**: Student, TA, Staff, Professor, EventsOffice, Admin

**Path Parameters**:
- `order`: "asc" | "desc"

**Response**: Sorted array of events

---

## 📝 Registration APIs

### POST /api/registration/register
**Controller**: `registrationController.js` → `registerForEvent`  
**Route**: `registrationRoutes.js` → `requireRegistering` (Student, TA, Staff, Professor)  
**Who can use**: Student, TA, Staff, Professor

**Required Fields**:
```javascript
{
  event_id: string,
  name: string,
  email: string,
  personalId: string,
  role: "student" | "staff" | "TA" | "professor"
}
```

**Response**:
```javascript
{
  message: "Registration successful",
  registration: { ...registrationObject }
}
```

**Possible Errors**:
- **400**: Registration already exists
- **400**: Registration is closed
- **400**: Event is at capacity
- **404**: Event not found

**Frontend Pages**:
- `app/student/workshops/page.js` ⏳ NEEDS UPDATE
- `app/student/trips/page.js` ⏳ NEEDS UPDATE

---

### GET /api/registration/:user_id/events
**Controller**: `registrationController.js` → `viewRegisteredEvents`  
**Route**: `registrationRoutes.js` → `requireRegistering`  
**Who can use**: Student, TA, Staff, Professor (own registrations only)

**No Request Body Required**

**Response**:
```javascript
{
  message: "Registered events retrieved successfully",
  upcoming: [ ...upcomingEventsArray ],
  past: [ ...pastEventsArray ],
  totals: {
    upcoming: number,
    past: number,
    total: number
  }
}
```

**Frontend Pages**:
- `app/student/page.js` ⏳ NEEDS UPDATE
- `app/ta/my-events/page.js` ⏳ NEEDS UPDATE

---

## 🏪 Vendor APIs

### GET /api/vendor/upcoming/bazaars
**Controller**: `vendorController.js` → `getUpcomingBazaars`  
**Route**: `vendorRoutes.js` → `requireVendor`  
**Who can use**: Vendor only

**No Request Body Required**

**Response**:
```javascript
{
  message: "Upcoming bazaars retrieved successfully",
  bazaars: [ ...bazaarArray ],
  total: number
}
```

**Frontend Page**: `app/vendor/bazaars/page.js` ⏳ NEEDS UPDATE

---

### GET /api/vendor/upcoming/booths
**Controller**: `vendorController.js` → `getUpcomingBooths`  
**Route**: `vendorRoutes.js` → `requireVendor`  
**Who can use**: Vendor only

**Response**:
```javascript
{
  message: "Upcoming booths retrieved successfully",
  booths: [ ...boothArray ],
  total: number
}
```

**Frontend Page**: `app/vendor/booths/page.js` ⏳ NEEDS UPDATE

---

### POST /api/vendor/apply/bazaar
**Controller**: `vendorController.js` → `applyToBazaar`  
**Route**: `vendorRoutes.js` → `requireVendor`  
**Who can use**: Vendor only

**Required Fields**:
```javascript
{
  event_id: string,
  application: {
    business_description: string,
    products: string,
    previous_experience: string,
    booth_size: string,
    // ... other application-specific fields
  }
}
```

**Response**:
```javascript
{
  message: "Bazaar application submitted successfully",
  application: { ...applicationObject }
}
```

**Frontend Page**: `app/vendor/bazaars/page.js` ⏳ NEEDS UPDATE

---

### POST /api/vendor/apply/booth
**Controller**: `vendorController.js` → `applyForBooth`  
**Route**: `vendorRoutes.js` → `requireVendor`  
**Who can use**: Vendor only

**Similar structure to bazaar application**

**Frontend Page**: `app/vendor/booths/page.js` ⏳ NEEDS UPDATE

---

### GET /api/vendor/applications/accepted
**Controller**: `vendorController.js` → `getAcceptedApplications`  
**Route**: `vendorRoutes.js` → `requireVendor`  
**Who can use**: Vendor only

**Response**:
```javascript
{
  applications: [ ...acceptedApplicationsArray ]
}
```

**Frontend Page**: `app/vendor/page.js` ⏳ NEEDS UPDATE

---

### GET /api/vendor/applications/pending-rejected
**Controller**: `vendorController.js` → `getPendingAndRejectedApplications`  
**Route**: `vendorRoutes.js` → `requireVendor`  
**Who can use**: Vendor only

**Response**:
```javascript
{
  pending: [ ...pendingArray ],
  rejected: [ ...rejectedArray ]
}
```

**Frontend Page**: `app/vendor/page.js` ⏳ NEEDS UPDATE

---

### GET /api/vendor/applications/my-applications
**Controller**: `vendorController.js` → `getMyApplications`  
**Route**: `vendorRoutes.js` → `requireVendor`  
**Who can use**: Vendor only

**Response**:
```javascript
{
  applications: [ ...allApplicationsArray ]
}
```

**Frontend Page**: `app/vendor/page.js` ⏳ NEEDS UPDATE

---

### GET /api/vendor/applications/:applicationId
**Controller**: `vendorController.js` → `getApplicationById`  
**Route**: `vendorRoutes.js` → `requireVendor`  
**Who can use**: Vendor only (own applications)

**Response**:
```javascript
{
  application: { ...applicationObject }
}
```

---

### PATCH /api/vendor/applications/:applicationId/cancel
**Controller**: `vendorController.js` → `cancelApplication`  
**Route**: `vendorRoutes.js` → `requireVendor`  
**Who can use**: Vendor only (own pending applications)

**No Request Body Required**

**Response**:
```javascript
{
  message: "Application cancelled successfully",
  application: { ...updatedApplicationObject }
}
```

---

## 👔 Admin APIs

### GET /api/admin/vendor-requests
**Controller**: `adminController.js` → `getAllVendorRequests`  
**Route**: `adminRoutes.js` → `requireAdminOrEventsOffice`  
**Who can use**: Admin, EventsOffice

**Query Parameters**:
- `status`: "pending" | "accepted" | "rejected"
- `page`: number
- `limit`: number

**Response**:
```javascript
{
  applications: [ ...applicationArray ],
  pagination: {
    page: number,
    totalPages: number,
    total: number
  }
}
```

**Frontend Page**: `app/eventsoffice/vendors/page.js` ⏳ NEEDS UPDATE

---

### GET /api/admin/vendor-requests/stats
**Controller**: `adminController.js` → `getVendorRequestsStats`  
**Route**: `adminRoutes.js` → `requireAdminOrEventsOffice`  
**Who can use**: Admin, EventsOffice

**Response**:
```javascript
{
  total: number,
  pending: number,
  accepted: number,
  rejected: number
}
```

**Frontend Page**: `app/eventsoffice/vendors/page.js` ⏳ NEEDS UPDATE

---

### GET /api/admin/vendor-requests/:applicationId
**Controller**: `adminController.js` → `getVendorRequestById`  
**Route**: `adminRoutes.js` → `requireAdminOrEventsOffice`  
**Who can use**: Admin, EventsOffice

**Response**:
```javascript
{
  application: { ...fullApplicationObject }
}
```

---

### POST /api/admin/vendor-requests/:applicationId/accept
**Controller**: `adminController.js` → `acceptVendorRequest`  
**Route**: `adminRoutes.js` → `requireAdminOrEventsOffice`  
**Who can use**: Admin, EventsOffice

**No Request Body Required**

**Response**:
```javascript
{
  message: "Vendor request accepted successfully",
  application: { ...updatedApplicationObject }
}
```

**Frontend Page**: `app/eventsoffice/vendors/page.js` ⏳ NEEDS UPDATE

---

### POST /api/admin/vendor-requests/:applicationId/reject
**Controller**: `adminController.js` → `rejectVendorRequest`  
**Route**: `adminRoutes.js` → `requireAdminOrEventsOffice`  
**Who can use**: Admin, EventsOffice

**Optional Request Body**:
```javascript
{
  reason: string  // Optional rejection reason
}
```

**Response**:
```javascript
{
  message: "Vendor request rejected",
  application: { ...updatedApplicationObject }
}
```

**Frontend Page**: `app/eventsoffice/vendors/page.js` ⏳ NEEDS UPDATE

---

### GET /api/admin/pending-users
**Controller**: `adminController.js` → `getPendingUsers`  
**Route**: `adminRoutes.js` → `requireAdmin`  
**Who can use**: Admin only

**Response**:
```javascript
{
  pendingUsers: [ ...userArray ]
}
```

**Frontend Page**: `app/admin/page.js` ⏳ NEEDS IMPLEMENTATION

---

### POST /api/admin/approve/:userId
**Controller**: `adminController.js` → `approveUser`  
**Route**: `adminRoutes.js` → `requireAdmin`  
**Who can use**: Admin only

**No Request Body Required**

**Response**:
```javascript
{
  message: "User approved and verification email sent",
  user: { ...userObject }
}
```

**Frontend Page**: `app/admin/page.js` ⏳ NEEDS IMPLEMENTATION

---

### POST /api/admin/user/:userId/block
**Controller**: `adminController.js` → `toggleUserBlock`  
**Route**: `adminRoutes.js` → `requireAdmin`  
**Who can use**: Admin only

**No Request Body Required** (toggles block status)

**Response**:
```javascript
{
  message: "User blocked" | "User unblocked",
  user: { ...userObject }
}
```

**Frontend Page**: `app/admin/page.js` ⏳ NEEDS IMPLEMENTATION

---

### GET /api/admin/users
**Controller**: `adminController.js` → `getAllUsers`  
**Route**: `adminRoutes.js` → `requireAdmin`  
**Who can use**: Admin only

**Response**:
```javascript
{
  users: [ ...userArray ]
}
```

**Frontend Page**: `app/admin/page.js` ⏳ NEEDS IMPLEMENTATION

---

## 🎯 Implementation Status

### ✅ Completed
1. `utils/api.js` - Complete API utility with all endpoints
2. `app/auth/login/page.js` - Login with role-based redirect
3. `app/auth/register/page.js` - Registration with role-specific forms

### ⏳ Priority 1 (EventsOffice Core Functions)
1. `app/eventsoffice/workshops/create/page.js` - Create workshop
2. `app/eventsoffice/workshops/page.js` - List/edit workshops
3. `app/eventsoffice/trips/create/page.js` - Create trip
4. `app/eventsoffice/trips/page.js` - List/edit trips
5. `app/eventsoffice/bazaars/create/page.js` - Create bazaar
6. `app/eventsoffice/bazaars/page.js` - List/edit bazaars
7. `app/eventsoffice/gym/page.js` - Manage gym sessions
8. `app/eventsoffice/vendors/page.js` - Vendor request management
9. `app/eventsoffice/facilities/page.js` - Facility management

### ⏳ Priority 2 (Student Functions)
1. `app/student/page.js` - Dashboard with upcoming events
2. `app/student/events/page.js` - Browse all events
3. `app/student/workshops/page.js` - Register for workshops
4. `app/student/trips/page.js` - Register for trips
5. `app/student/gym/schedule/page.js` - View gym schedule
6. `app/student/facilities/page.js` - View facilities

### ⏳ Priority 3 (Vendor Functions)
1. `app/vendor/page.js` - Vendor dashboard
2. `app/vendor/bazaars/page.js` - Apply to bazaars
3. `app/vendor/booths/page.js` - Apply for booths

### ⏳ Priority 4 (Admin Functions)
1. `app/admin/page.js` - Admin dashboard
2. User approval system
3. User blocking/unblocking

---

## 📌 Key Notes

1. **Authentication**: All authenticated endpoints require `Authorization: Bearer <token>` header
2. **Token Storage**: Tokens stored in localStorage via `utils/api.js`
3. **Role-Based Access**: Backend enforces role permissions via middleware
4. **Date Formats**: Use ISO 8601 strings for all dates (e.g., "2025-01-15T10:00:00Z")
5. **Error Handling**: All API functions throw errors that need to be caught with try/catch
6. **Loading States**: Implement loading states for all async operations
7. **Success Messages**: Show user feedback after successful operations
8. **Form Validation**: Client-side validation before sending to backend

---

## 🔄 Next Steps

1. Update EventsOffice pages with actual API calls
2. Update Student pages with event browsing and registration
3. Update Vendor pages with application system
4. Implement Admin panel
5. Add loading spinners and error messages
6. Test all endpoints with real backend
7. Add protected route middleware
8. Implement logout functionality across all pages

