# 🚀 QUICK START - Al-Ahly Events System

## ✅ SERVERS ARE RUNNING!

### 🖥️ URLs
- **Frontend:** http://localhost:3001
- **Backend:** http://localhost:5000/api

---

## 🧪 TEST NOW

### 1️⃣ Check Backend
Open: http://localhost:5000/

### 2️⃣ Check Frontend  
Open: http://localhost:3001/

### 3️⃣ Create Admin (First Time Only)
```powershell
cd "C:\Projects\Q3 2025\Al-Ahly\backend"
node seed.js
```
**Admin Login:** `admin@guc.edu.eg` / `Admin@123`

### 4️⃣ Register a User
1. Go to: http://localhost:3001/auth/register
2. Use GUC email: `yourname@guc.edu.eg`
3. Choose role: Professor, Student, EventsOffice, etc.

### 5️⃣ Approve User (Admin)
1. Login as admin
2. Go to pending users
3. Approve the registered user

### 6️⃣ Login & Test
1. Go to: http://localhost:3001/auth/login
2. Use approved credentials
3. Explore your dashboard!

---

## 📋 What You Can Test

### Professor
- Create workshops
- Edit workshops
- View workshop list

### EventsOffice
- Create conferences
- Create trips
- Create bazaars
- Manage registrations

### Student
- Browse events
- Register for events
- View registrations

### Vendor
- Apply to bazaars
- View applications

### Admin
- Approve/reject users
- Block users
- View all users

---

## 🛑 To Stop Servers

Press `Ctrl+C` in both terminal windows

---

## 🔄 To Restart

### Backend
```powershell
cd "C:\Projects\Q3 2025\Al-Ahly\backend"
npm run dev
```

### Frontend
```powershell
cd "C:\Projects\Q3 2025\Al-Ahly\frontend"
npm run dev
```

---

## 📖 Full Documentation

- **SYSTEM_READY.md** - Complete status & testing guide
- **HOW_TO_RUN.md** - Detailed run instructions
- **COMPLETE_API_MAPPING.md** - All API endpoints

---

## ✨ Everything is Ready!

Your database is connected, routes are configured, and both servers are running!

**Start testing now:** http://localhost:3001 🎉
