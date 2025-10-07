Project Title 0.5 –

Motivation 0.5 –
Build Status 1- All issues with your project must be mentioned here.
There is no such thing as a perfect project.

Screenshots 2- Can be screenshots (pictures) or a video of how system
looks/works. If screenshots of the system are used,

include at least 5- screenshots.
Tech/Framework used 1- Explain what technologies you used (MERN stack and
what else if anything)

Features 1- List all the features on the system. Since this is due in

Sprint 2- you do not need to include the new features.

Code Examples 1- Add examples of your code here. Add at least 5 snippets of functions.


API References 1- At least 5 routes need to be mentioned.

Tests 1- Testing used in Postman (screenshots of Postman
tests) is fine. JEST is also accepted. Add at least
5 tests.

Contribute 0.25- How can others contribute to your project? Writing
that the project is perfect is not acceptable.

Credits 0.25- This includes any source that you used online for help
INCLUDING YouTube videos

License 0.25- For example: If Stripe is used, Apache 2.0 license Must
be included in this section.
hello

---

## 📊 Database Schema Documentation

This project uses MongoDB with Mongoose for data modeling. Below is the comprehensive schema structure for the Al-Ahly University Platform.

### 🏛️ Database Architecture

The system follows a document-based NoSQL approach using MongoDB, with the following main collections:

### 👤 User Schema
**Collection:** `users`

**Fields:**
- **Personal Info**: First name, last name, email (unique)
- **Authentication**: Password hash for secure login
- **Role System**: Student, Staff, TA, Professor, Vendor, Admin, EventsOffice
- **Status Management**: Active or blocked users
- **Verification**: Email verification and admin approval flags
- **Vendor Details**: Company name for vendor users (optional)
- **Timestamps**: Creation and update tracking

**Purpose:** Central user management for all platform participants including students, staff, faculty, vendors, and administrators.

### 🎉 Event Schema
**Collection:** `events`

**Fields:**
- **Event Types**: Bazaar, trip, conference, workshop, gym_session
- **Basic Info**: Title, description, location
- **Scheduling**: Start time and end time
- **Creator**: Reference to user who created the event
- **Status Management**: Active, canceled, or deleted
- **Capacity**: Maximum number of participants
- **Counters**: Registration and application counts
- **Workshop Details**: Professor ID and name for workshops
- **Meta Data**: Flexible field for additional event information
- **Search Index**: Text search on title and description
- **Timestamps**: Creation and update tracking

**Purpose:** Manages diverse university events including bazaars, trips, conferences, workshops, and gym sessions with specialized fields for each type.

### 📝 Registration Schema  
**Collection:** `registrations`

**Fields:**
- **Event Reference**: Link to the specific event (event_id)
- **User Reference**: Link to the registering user (user_id)
- **Status**: Registered or canceled
- **Unique Constraint**: Prevents duplicate registrations per user per event
- **Timestamps**: Creation and update tracking

**Purpose:** Simple registration system that prevents duplicate registrations and tracks user participation in events.

### 🏢 Vendor Application Schema
**Collection:** `vendorapplications`

**Fields:**
- **Vendor Reference**: Link to the applying vendor user (vendor_user_id)
- **Event Reference**: Link to the specific event (event_id)
- **Application Type**: Bazaar or booth_setup
- **Application Details**: Staff list, booth size, setup duration, and location
- **Staff Information**: Name and email for each staff member
- **Application Status**: Pending, accepted, or rejected
- **Timestamps**: Creation and update tracking

**Purpose:** Manages vendor applications for event participation, specifically for bazaars and booth setups with detailed application information.

### 💬 Comment Schema
**Collection:** `comments`

**Fields:**
- **Event Reference**: Which event the comment is about (event_id)
- **Author Reference**: Who made the comment (author_id)
- **Comment Content**: The actual comment text (body)
- **Visibility Status**: Visible or deleted
- **Moderation**: Reference to user who deleted the comment (if applicable)
- **Timestamps**: Creation and update tracking

**Purpose:** Enables user feedback and discussion on events with moderation capabilities and soft deletion.

### 🏗️ Facility Schema
**Collection:** `facilities`

**Fields:**
- **Type**: Facility type (default: court)
- **Basic Info**: Name and location
- **Attributes**: Sport type and indoor/outdoor specification
- **Status**: Available or unavailable

**Purpose:** Manages sports facilities, particularly courts, with sport-specific attributes and availability tracking.

### 🔐 Authentication System

#### JWT Token Structure:
**Token Contains:** User ID, user role, and expiration time (24 hours)

#### User Roles & Permissions:
- **Student**: Event registration, profile management
- **Staff**: Basic administrative functions
- **TA/Professor**: Academic event management
- **Vendor**: Service application and management
- **Admin**: Full system access
- **EventsOffice**: Event creation and management

### 🔗 Relationships

**Core Connections:**
- **Users** can create Events, make Registrations, submit VendorApplications, and post Comments
- **Events** are linked to Registrations, Comments, and Facilities
- **Facilities** can be booked by multiple Events
- **Registrations** connect Users to specific Events
- **Comments** connect Users to Events for feedback

### 📋 Key Features:

1. **Multi-Role System**: Supports different user types with role-based access control
2. **Event Management**: Complete lifecycle from creation to completion
3. **Registration Workflow**: Approval-based registration system
4. **Vendor Integration**: Business application and verification process
5. **Facility Booking**: Resource management for campus facilities
6. **User Verification**: Two-tier verification (email + admin approval)

### 🛡️ Security Measures:

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Mongoose schema validation
- **Role-Based Access**: Endpoint protection by user roles
- **Email Uniqueness**: Prevents duplicate accounts

### 📈 Scalability Considerations:

- **Indexed Fields**: Email, user roles, event dates
- **Reference Relations**: ObjectId references for data integrity
- **Status Enums**: Consistent state management
- **Timestamp Tracking**: Audit trail for all operations

This schema supports a comprehensive university platform with event management, user authentication, vendor services, and facility booking capabilities.