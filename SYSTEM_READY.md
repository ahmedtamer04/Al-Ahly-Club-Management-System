# ✅ SYSTEM READY - Al-Ahly Events Management

## 🎉 BOTH SERVERS ARE RUNNING!

---

## 📊 Current Status

### ✅ Backend Server
- **Status:** Running
- **Port:** 5000
- **URL:** http://localhost:5000
- **API Base:** http://localhost:5000/api
- **MongoDB:** ✅ Connected to Atlas cluster
- **Environment:** ✅ .env loaded correctly

**Terminal Output:**
```
MONGO_URI: ✅ Loaded
JWT_SECRET: ✅ Loaded
Server running on port 5000
MongoDB Connected: cluster0.htwbnm8.mongodb.net
```

---

### ✅ Frontend Server
- **Status:** Running
- **Port:** 3001 (port 3000 was in use, Next.js auto-switched)
- **URL:** http://localhost:3001
- **API Target:** http://localhost:5000/api
- **Environment:** ✅ .env.local created

**Terminal Output:**
```
▲ Next.js 14.2.13
- Local: http://localhost:3001
✓ Ready in 12.7s
```

---

## 🌐 Access URLs

### Frontend Pages
- **Landing Page:** http://localhost:3001/
- **Login:** http://localhost:3001/auth/login
- **Register:** http://localhost:3001/auth/register
- **Professor Dashboard:** http://localhost:3001/professor
- **EventsOffice Dashboard:** http://localhost:3001/eventsoffice
- **Student Dashboard:** http://localhost:3001/student
- **Admin Dashboard:** http://localhost:3001/admin
- **Vendor Dashboard:** http://localhost:3001/vendor

### Backend API Endpoints
- **Health Check:** http://localhost:5000/
- **Auth - Login:** POST http://localhost:5000/api/auth/login
- **Auth - Register:** POST http://localhost:5000/api/auth/signup
- **Workshops:** http://localhost:5000/api/workshop/
- **Conferences:** http://localhost:5000/api/conference/
- **Trips:** http://localhost:5000/api/trips/
- **Bazaars:** http://localhost:5000/api/bazaar/

---

## 🧪 Ready to Test!

### Test 1: Backend Health Check
Open in browser: http://localhost:5000/

**Expected Response:**
```json
{
  "message": "Al-Ahly Club Management System API",
  "status": "running",
  "version": "1.0.0"
}
```

### Test 2: Frontend Access
Open in browser: http://localhost:3001/

**Expected:** Landing page loads successfully

### Test 3: User Registration Flow

1. **Navigate to Registration:**
   http://localhost:3001/auth/register

2. **Fill Form:**
   - Email: `testprofessor@guc.edu.eg`
   - Password: `Test@123`
   - First Name: `Test`
   - Last Name: `Professor`
   - ID: `12345`
   - Role: `Professor`

3. **Submit Form**
   - Browser makes API call to: `http://localhost:5000/api/auth/signup`
   - Backend creates user in MongoDB
   - User marked as "pending approval"

4. **Check Browser Console (F12)**
   - Look for API call in Network tab
   - Check for any errors

### Test 4: User Login Flow

1. **Navigate to Login:**
   http://localhost:3001/auth/login

2. **Use Credentials:**
   - Email: `testprofessor@guc.edu.eg`
   - Password: `Test@123`

3. **Expected Behavior:**
   - If approved: Redirects to `/professor` dashboard
   - If pending: Shows "Account pending approval" message
   - If blocked: Shows "Account is blocked" message

### Test 5: Create Workshop (Professor)

**Prerequisites:** Logged in as approved professor

1. Navigate to: http://localhost:3001/professor/workshops/create
2. Fill workshop form with all required fields
3. Submit
4. Backend receives: POST http://localhost:5000/api/workshop/
5. Redirects to: http://localhost:3001/professor/workshops

### Test 6: Create Conference (EventsOffice)

**Prerequisites:** Logged in as approved EventsOffice user

1. Navigate to: http://localhost:3001/eventsoffice/conferences/create
2. Fill conference form with all required fields
3. Submit
4. Backend receives: POST http://localhost:5000/api/conference/create
5. Redirects to: http://localhost:3001/eventsoffice/conferences

---

## 🔑 Important Notes

### User Approval Required
Most users (except Admin) need to be approved before they can login:
- Students, Staff, TA, Professor → Require admin approval
- Vendors → Require admin approval
- EventsOffice → Require admin approval (typically)

### Creating First Admin
To approve users, you need an admin account first:

**Option 1: Run seed script**
```powershell
cd "C:\Projects\Q3 2025\Al-Ahly\backend"
node seed.js
```
This creates admin: `admin@guc.edu.eg` / `Admin@123`

**Option 2: Manually update in MongoDB**
1. Register a user via frontend
2. Connect to MongoDB Atlas
3. Find the user in `users` collection
4. Update: `role: 7`, `approved: true`

---

## 🔄 Managing the Servers

### View Backend Logs
Backend terminal shows:
- API requests as they come in
- Database operations
- Errors (if any)

### View Frontend Logs
Frontend terminal shows:
- Page compilations
- Hot reload updates
- Build errors (if any)

### Restart Backend
In backend terminal, press `Ctrl+C`, then run:
```powershell
npm run dev
```

### Restart Frontend
In frontend terminal, press `Ctrl+C`, then run:
```powershell
npm run dev
```

### Stop Everything
Press `Ctrl+C` in both terminals

---

## 📁 Project Structure

```
Al-Ahly/
├── backend/
│   ├── config/         # Database connection
│   ├── controllers/    # Business logic (11 controllers)
│   ├── middleware/     # Auth & role checks
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API route definitions (11 route files)
│   ├── services/       # Email service
│   ├── .env           # Environment variables ✅
│   ├── server.js      # Main server file ✅
│   ├── seed.js        # Database seeding
│   └── package.json   # Dependencies
│
├── frontend/
│   ├── app/           # Next.js pages
│   │   ├── admin/     # Admin dashboard pages
│   │   ├── auth/      # Login & register ✅
│   │   ├── eventsoffice/  # EventsOffice pages ✅
│   │   │   ├── conferences/  # Conference management ✅
│   │   │   ├── trips/
│   │   │   ├── bazaars/
│   │   │   └── ...
│   │   ├── professor/ # Professor pages ✅
│   │   │   └── workshops/  # Workshop management ✅
│   │   ├── student/   # Student dashboard
│   │   ├── vendor/    # Vendor dashboard
│   │   ├── staff/     # Staff dashboard
│   │   └── ta/        # TA dashboard
│   ├── utils/
│   │   └── api.js     # API utility functions ✅
│   ├── .env.local     # Environment variables ✅
│   ├── jsconfig.json  # Path aliases ✅
│   └── package.json   # Dependencies
│
└── Documentation/
    ├── HOW_TO_RUN.md              # This file
    ├── FULLSTACK_SETUP_GUIDE.md   # Detailed setup
    ├── COMPLETE_API_MAPPING.md    # All endpoints
    ├── PROFESSOR_WORKSHOP_SYSTEM.md  # Workshop features
    └── ...
```

---

## ✅ Verification Checklist

Before testing features:
- [x] Backend server running on port 5000
- [x] Frontend server running on port 3001
- [x] MongoDB connected successfully
- [x] No compilation errors
- [x] API routes have `/api` prefix
- [x] Frontend configured to call correct API URL
- [x] .env files properly set up

All green! You're ready to test the full application! 🚀

---

## 🎯 Next Steps

1. **Create Admin User:**
   Run `node seed.js` in backend folder

2. **Test Registration:**
   Register users for each role

3. **Approve Users:**
   Login as admin, approve pending users

4. **Test Features:**
   - Professor: Create workshops
   - EventsOffice: Create conferences, trips, bazaars
   - Student: Browse and register for events
   - Vendor: Apply to bazaars

5. **Check Database:**
   View collections in MongoDB Atlas to see created records

---

## 🐛 Troubleshooting

### API Calls Fail (404 or Connection Error)
- ✅ Check both servers are running
- ✅ Verify backend shows: `Server running on port 5000`
- ✅ Check browser console for actual error
- ✅ Try accessing http://localhost:5000/ directly

### Login Always Says "Pending Approval"
- ✅ Create admin user via seed.js
- ✅ Login as admin
- ✅ Go to admin panel and approve the user

### Frontend Shows Old Code
- ✅ Hard refresh browser (Ctrl+F5)
- ✅ Clear browser cache
- ✅ Restart frontend server

### Backend Shows MongoDB Error
- ✅ Check internet connection
- ✅ Verify .env has correct MONGO_URI
- ✅ Check MongoDB Atlas cluster is running

---

## 📞 Need Help?

Check these files for detailed info:
- **HOW_TO_RUN.md** - Complete run instructions
- **FULLSTACK_SETUP_GUIDE.md** - Detailed setup guide
- **COMPLETE_API_MAPPING.md** - All API endpoints
- **PROFESSOR_WORKSHOP_SYSTEM.md** - Workshop system docs

---

## 🎉 Happy Testing!

Your full-stack application is now connected and running!

**Frontend:** http://localhost:3001
**Backend:** http://localhost:5000
**API:** http://localhost:5000/api

Start exploring the features! 🚀
