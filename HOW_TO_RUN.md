# 🚀 HOW TO RUN - Al-Ahly Events System

## ✅ All Fixes Applied!

The backend and frontend are now properly configured to work together.

---

## 🔧 What Was Fixed

### 1. Backend API Routes
✅ Added `/api` prefix to all routes in `backend/server.js`
- Before: `http://localhost:5000/auth/login`
- After: `http://localhost:5000/api/auth/login`

### 2. Frontend API Configuration
✅ Created `frontend/.env.local` with correct API URL
✅ Updated `frontend/utils/api.js` to use port 5000

### 3. Route Alignment
✅ Frontend and backend now use matching endpoints

---

## 📋 Prerequisites

Make sure you have installed:
- ✅ Node.js (v16+)
- ✅ npm or yarn
- ✅ MongoDB connection string in `backend/.env`

---

## 🚀 RUNNING THE APPLICATION

### Terminal 1: Start Backend Server

```powershell
# Navigate to backend folder
cd "C:\Projects\Q3 2025\Al-Ahly\backend"

# Install dependencies (if not already done)
npm install

# Start the backend server
npm run dev
```

**Expected Output:**
```
MONGO_URI: ✅ Loaded
JWT_SECRET: ✅ Loaded
MongoDB connected: cluster0.htwbnm8.mongodb.net
Server running on port 5000
```

**Backend will run on:** `http://localhost:5000`

---

### Terminal 2: Start Frontend Server

```powershell
# Navigate to frontend folder
cd "C:\Projects\Q3 2025\Al-Ahly\frontend"

# Install dependencies (if not already done)
npm install

# Start the frontend development server
npm run dev
```

**Expected Output:**
```
▲ Next.js 14.2.13
- Local:        http://localhost:3000
✓ Ready in 2s
```

**Frontend will run on:** `http://localhost:3000`

---

## 🧪 Testing the Connection

### 1. Test Backend API Directly

Open browser or use Postman:
```
http://localhost:5000/
```

Should return:
```json
{
  "message": "Al-Ahly Club Management System API",
  "status": "running",
  "version": "1.0.0"
}
```

### 2. Test Frontend

Open browser:
```
http://localhost:3000
```

You should see the landing page.

### 3. Test Registration

1. Navigate to: `http://localhost:3000/auth/register`
2. Fill out the form with a GUC email (e.g., `test@guc.edu.eg`)
3. Submit
4. Check browser console and network tab for API calls

### 4. Test Login

1. Navigate to: `http://localhost:3000/auth/login`
2. Use registered credentials
3. Should redirect to role-based dashboard:
   - Student → `/student`
   - Professor → `/professor`
   - EventsOffice → `/eventsoffice`
   - Admin → `/admin`
   - etc.

---

## 🎯 API Endpoints Reference

All endpoints are prefixed with `/api`:

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Workshops (Professor Only)
- `POST /api/workshop/` - Create workshop
- `PUT /api/workshop/:id` - Edit workshop
- `GET /api/workshop/my` - Get my workshops

### Conferences (EventsOffice Only)
- `POST /api/conference/create` - Create conference
- `PUT /api/conference/:id` - Edit conference

### Trips (EventsOffice Only)
- `POST /api/trips/` - Create trip
- `PUT /api/trips/:id` - Edit trip

### Bazaars (EventsOffice Only)
- `POST /api/bazaar/` - Create bazaar
- `PUT /api/bazaar/:id` - Edit bazaar

### Vendor Applications
- `POST /api/vendor/apply/:bazaarId` - Apply to bazaar
- `GET /api/vendor/applications` - Get my applications

### Admin
- `GET /api/admin/pending-users` - Get pending users
- `PATCH /api/admin/approve-user/:userId` - Approve user
- `PATCH /api/admin/block-user/:userId` - Block user

### Events (All Users)
- `GET /api/events/` - Browse all events
- `GET /api/events/:id` - Get event details

### Registrations (Students)
- `POST /api/registration/:eventId` - Register for event
- `GET /api/registration/my` - Get my registrations

---

## 🔑 User Roles & Access

| Role | Can Create | Can Edit | Dashboard |
|------|-----------|----------|-----------|
| **Professor** | Workshops | Own workshops | `/professor` |
| **EventsOffice** | Conferences, Trips, Bazaars, Gym Sessions | Own events | `/eventsoffice` |
| **Student** | - | - | `/student` |
| **Vendor** | Bazaar applications | Own applications | `/vendor` |
| **Admin** | - | User approvals/blocks | `/admin` |
| **Staff** | - | - | `/staff` |
| **TA** | - | - | `/ta` |

---

## 🐛 Troubleshooting

### Backend won't start
**Problem:** MongoDB connection fails
**Solution:** Check `.env` file has correct `MONGO_URI`

**Problem:** Port 5000 already in use
**Solution:** Change `PORT=5000` in `.env` to another port (e.g., `PORT=5001`)
**Important:** Also update `frontend/.env.local` to match

### Frontend won't start
**Problem:** Port 3000 already in use
**Solution:** Next.js will automatically try port 3001, 3002, etc.

**Problem:** API calls fail with CORS error
**Solution:** Backend already has CORS enabled. Restart backend server.

### API calls return 404
**Problem:** Backend routes don't match frontend calls
**Solution:** Already fixed! Backend now has `/api` prefix.

### Login doesn't work
**Problem:** No users in database
**Solution:** Register a new user first, then login

**Problem:** User created but "pending approval"
**Solution:** 
- For Student/Staff/TA/Professor: Admin needs to approve
- For Vendor: Admin needs to approve
- Use seed.js to create an admin user first

---

## 👤 Creating First Admin User

### Option 1: Using Seed Script

```powershell
cd "C:\Projects\Q3 2025\Al-Ahly\backend"
node seed.js
```

This will create:
- Admin user: `admin@guc.edu.eg` / `Admin@123`

### Option 2: Register via Frontend

1. Register with GUC email
2. Manually update in MongoDB:
   - Set `role: 7` (Admin)
   - Set `approved: true`

---

## 📊 Database Structure

**Database:** MongoDB Atlas
**Connection:** `mongodb+srv://mostafaguc_db_user:Hj0ZNVRqSP6CGKVc@cluster0.htwbnm8.mongodb.net/`

**Collections:**
- `users` - All user accounts
- `events` - All events (workshops, conferences, trips, bazaars)
- `facilities` - Facility bookings
- `gymsessions` - Gym class sessions
- `registrations` - Event registrations
- `vendorapplications` - Vendor bazaar applications

---

## ✅ Final Checklist

Before testing:
- [ ] Backend `.env` file exists with MongoDB URI
- [ ] Frontend `.env.local` file created
- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 3000
- [ ] Both terminals show no errors
- [ ] Browser can access `http://localhost:3000`
- [ ] API endpoint `http://localhost:5000/` returns JSON

---

## 🎉 You're Ready!

**Backend:** `http://localhost:5000`
**Frontend:** `http://localhost:3000`

Start by:
1. Register a user at `/auth/register`
2. Login at `/auth/login`
3. Explore your role-based dashboard!

---

## 📞 Support

If you encounter issues:
1. Check both terminal outputs for error messages
2. Check browser console (F12) for frontend errors
3. Check MongoDB connection
4. Verify all dependencies installed (`npm install`)

---

## 🔄 Stopping the Servers

Press `Ctrl+C` in each terminal to stop the servers.

**Always stop both servers before closing terminals!**
