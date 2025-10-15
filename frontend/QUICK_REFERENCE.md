# 🚀 Quick Reference: Controllers → Frontend

## How to Use This Guide
1. Find your backend controller method
2. See which frontend page needs it
3. Copy the code snippet
4. Replace `formData` fields with your actual form fields
5. Test!

---

## 📝 authController.js

### signupUser
- **Route**: POST /api/auth/signup
- **Auth**: None (public)
- **Frontend**: `app/auth/register/page.js` ✅ DONE
```javascript
await authAPI.signup(userData);
```

### loginUser
- **Route**: POST /api/auth/login
- **Auth**: None (public)
- **Frontend**: `app/auth/login/page.js` ✅ DONE
```javascript
const response = await authAPI.login({ email, password });
// Auto-stored: token + user
// Redirect based on response.user.role
```

---

## 🎓 workshopController.js

### createWorkshop
- **Route**: POST /api/workshop/
- **Auth**: requireEventsOffice
- **Frontend**: `app/eventsoffice/workshops/create/page.js`
```javascript
await workshopAPI.create({
  name: formData.title,
  location: formData.location,
  short_description: formData.description,
  start_date: formData.date,
  end_date: formData.date,
  time: formData.startTime,
  full_agenda: formData.materials,
  faculty_responsible: formData.instructor,
  professors_participating: formData.instructor,
  required_budget: 0,
  funding_source: '',
  extra_resources: formData.prerequisites,
  capacity: parseInt(formData.maxCapacity),
  registration_deadline: formData.date
});
```

### editWorkshop
- **Route**: PUT /api/workshop/:id
- **Auth**: requireEventsOffice
- **Frontend**: `app/eventsoffice/workshops/page.js`
```javascript
await workshopAPI.edit(workshopId, updates);
```

### getMyWorkshops
- **Route**: GET /api/workshop/my
- **Auth**: requireEventsOffice
- **Frontend**: `app/eventsoffice/workshops/page.js`
```javascript
const response = await workshopAPI.getMyWorkshops();
setWorkshops(response.workshops);
```

---

## 🚌 tripController.js

### createTrip
- **Route**: POST /api/trip/createTrip
- **Auth**: requireEventsOffice
- **Frontend**: `app/eventsoffice/trips/create/page.js`
```javascript
await tripAPI.create({
  name: formData.title,
  location: formData.location,
  price: parseFloat(formData.price),
  start_date: formData.startDate,
  end_date: formData.endDate,
  time: formData.time,
  short_description: formData.description,
  capacity: parseInt(formData.capacity),
  registration_deadline: formData.deadline
});
```

### updateTrip
- **Route**: PUT /api/trip/updateTrip/:id
- **Auth**: requireEventsOffice
- **Frontend**: `app/eventsoffice/trips/page.js`
```javascript
await tripAPI.edit(tripId, updates);
```

### listTrips
- **Route**: GET /api/trip/listTrips
- **Auth**: requireStudentOrAbove
- **Frontend**: `app/eventsoffice/trips/page.js`, `app/student/trips/page.js`
```javascript
const response = await tripAPI.list({ status: 'upcoming', page: 1, limit: 10 });
setTrips(response.trips);
```

### getTrip
- **Route**: GET /api/trip/getTrip/:id
- **Auth**: requireStudentOrAbove
- **Frontend**: Trip detail pages
```javascript
const response = await tripAPI.getById(tripId);
setTrip(response.trip);
```

---

## 🎪 bazaarController.js

### createBazaar
- **Route**: POST /api/bazaar/createBazaar
- **Auth**: requireEventsOffice
- **Frontend**: `app/eventsoffice/bazaars/create/page.js`
```javascript
await bazaarAPI.create({
  name: formData.title,
  location: formData.location,
  short_description: formData.description,
  start_date: formData.startDate,
  end_date: formData.endDate,
  time: formData.time,
  registration_deadline: formData.deadline
});
```

### editBazaar
- **Route**: PUT /api/bazaar/editBazaar/:id
- **Auth**: requireEventsOffice
- **Frontend**: `app/eventsoffice/bazaars/page.js`
```javascript
await bazaarAPI.edit(bazaarId, updates);
```

### getAllBazaars
- **Route**: GET /api/bazaar/all
- **Auth**: Any authenticated user
- **Frontend**: `app/eventsoffice/bazaars/page.js`, `app/vendor/bazaars/page.js`
```javascript
const response = await bazaarAPI.getAll();
setBazaars(response.bazaars);
```

### getBazaarById
- **Route**: GET /api/bazaar/:id
- **Auth**: Any authenticated user
- **Frontend**: Detail pages
```javascript
const response = await bazaarAPI.getById(bazaarId);
setBazaar(response.bazaar);
```

---

## 🎤 conferenceController.js

### createConference
- **Route**: POST /api/conference/create
- **Auth**: requireEventsOffice
- **Frontend**: `app/eventsoffice/create/page.js`
```javascript
await conferenceAPI.create({
  name: formData.title,
  location: formData.location,
  short_description: formData.description,
  start_date: formData.startDate,
  end_date: formData.endDate,
  time: formData.time,
  campus: formData.campus,
  professors_participating: formData.professors,
  full_agenda: formData.agenda,
  conference_website: formData.website,
  required_budget: parseFloat(formData.budget),
  funding_source: formData.funding,
  extra_required_sources: formData.extraSources
});
```

### editConference
- **Route**: PUT /api/conference/:id
- **Auth**: requireEventsOffice
- **Frontend**: TBD
```javascript
await conferenceAPI.edit(conferenceId, updates);
```

---

## 🏋️ gymSessionController.js

### viewGymSchedule
- **Route**: GET /api/gymSession/schedule
- **Auth**: requireStudentOrAbove
- **Frontend**: `app/eventsoffice/gym/page.js`, `app/student/gym/schedule/page.js`
```javascript
const response = await gymAPI.getSchedule({
  month: selectedMonth,
  year: selectedYear,
  type: filterType  // optional
});
setSessions(response.sessions);
```

### createGymSession
- **Route**: POST /api/gymSession/create
- **Auth**: requireAdminOrEventsOffice
- **Frontend**: `app/eventsoffice/gym/page.js`
```javascript
await gymAPI.create({
  date: formData.date,  // Must be in future
  time: formData.time,
  duration: parseInt(formData.duration),
  type: formData.type,  // cardio, strength, yoga, pilates, crossfit
  maxParticipants: parseInt(formData.maxParticipants)
});
```

### editGymSession
- **Route**: PUT /api/gymSession/edit/:id
- **Auth**: requireAdminOrEventsOffice
- **Frontend**: `app/eventsoffice/gym/page.js`
```javascript
await gymAPI.edit(sessionId, {
  date: newDate,
  time: newTime,
  duration: newDuration
});
```

### cancelGymSession
- **Route**: PATCH /api/gymSession/cancel/:id
- **Auth**: requireAdminOrEventsOffice
- **Frontend**: `app/eventsoffice/gym/page.js`
```javascript
await gymAPI.cancel(sessionId);
```

---

## 🏟️ facilityController.js

### getAllFacilities
- **Route**: GET /api/facility/getAll
- **Auth**: requireStudent (any authenticated user)
- **Frontend**: `app/eventsoffice/facilities/page.js`, `app/student/facilities/page.js`
```javascript
const facilities = await facilityAPI.getAll();
setFacilities(facilities);
```

### addFacility
- **Route**: POST /api/facility/add
- **Auth**: requireAdminOrEventsOffice
- **Frontend**: `app/eventsoffice/facilities/page.js`
```javascript
await facilityAPI.add({
  type: formData.type,  // Football, Basketball, Tennis, Volleyball, Squash, Gym, Pool
  capacity: parseInt(formData.capacity),
  hourly_rate: parseFloat(formData.rate),
  status: formData.status  // available, maintenance, unavailable
});
```

---

## 🎉 eventController.js

### getUpcomingEvents
- **Route**: GET /api/events/upcoming
- **Auth**: requireStudentOrAbove
- **Frontend**: `app/student/page.js`, `app/student/events/page.js`, `app/ta/events/page.js`
```javascript
const events = await eventAPI.getUpcoming();
setEvents(events);
```

### filterEvents
- **Route**: GET /api/events/filter/:field/:value
- **Auth**: requireStudentOrAbove
- **Frontend**: `app/student/events/page.js`
```javascript
// field: "name" | "type" | "professor" | "location"
const events = await eventAPI.filter('type', 'Workshop');
setEvents(events);
```

### sortEventsByDate
- **Route**: GET /api/events/sort/date/:order
- **Auth**: requireStudentOrAbove
- **Frontend**: `app/student/events/page.js`
```javascript
const events = await eventAPI.sortByDate('asc');  // or 'desc'
setEvents(events);
```

---

## 📝 registrationController.js

### registerForEvent
- **Route**: POST /api/registration/register
- **Auth**: requireRegistering (Student, TA, Staff, Professor)
- **Frontend**: `app/student/workshops/page.js`, `app/student/trips/page.js`
```javascript
const user = getUser();
await registrationAPI.register({
  event_id: eventId,
  name: `${user.first_name} ${user.last_name}`,
  email: user.email,
  personalId: user.id_number,
  role: user.role.toLowerCase()  // "student", "staff", "TA", "professor"
});
```

### viewRegisteredEvents
- **Route**: GET /api/registration/:user_id/events
- **Auth**: requireRegistering
- **Frontend**: `app/student/page.js`, `app/ta/my-events/page.js`
```javascript
const user = getUser();
const response = await registrationAPI.getMyRegistrations(user._id);
setUpcoming(response.upcoming);
setPast(response.past);
```

---

## 🏪 vendorController.js

### getUpcomingBazaars
- **Route**: GET /api/vendor/upcoming/bazaars
- **Auth**: requireVendor
- **Frontend**: `app/vendor/bazaars/page.js`
```javascript
const response = await vendorAPI.getUpcomingBazaars();
setBazaars(response.bazaars);
```

### getUpcomingBooths
- **Route**: GET /api/vendor/upcoming/booths
- **Auth**: requireVendor
- **Frontend**: `app/vendor/booths/page.js`
```javascript
const response = await vendorAPI.getUpcomingBooths();
setBooths(response.booths);
```

### applyToBazaar
- **Route**: POST /api/vendor/apply/bazaar
- **Auth**: requireVendor
- **Frontend**: `app/vendor/bazaars/page.js`
```javascript
await vendorAPI.applyToBazaar({
  event_id: bazaarId,
  application: {
    business_description: formData.description,
    products: formData.products,
    previous_experience: formData.experience,
    booth_size: formData.size
  }
});
```

### applyForBooth
- **Route**: POST /api/vendor/apply/booth
- **Auth**: requireVendor
- **Frontend**: `app/vendor/booths/page.js`
```javascript
await vendorAPI.applyToBooth({
  event_id: boothId,
  application: { /* same structure as bazaar */ }
});
```

### getAcceptedApplications
- **Route**: GET /api/vendor/applications/accepted
- **Auth**: requireVendor
- **Frontend**: `app/vendor/page.js`
```javascript
const response = await vendorAPI.getAcceptedApplications();
setAccepted(response.applications);
```

### getPendingAndRejectedApplications
- **Route**: GET /api/vendor/applications/pending-rejected
- **Auth**: requireVendor
- **Frontend**: `app/vendor/page.js`
```javascript
const response = await vendorAPI.getPendingAndRejected();
setPending(response.pending);
setRejected(response.rejected);
```

### getMyApplications
- **Route**: GET /api/vendor/applications/my-applications
- **Auth**: requireVendor
- **Frontend**: `app/vendor/page.js`
```javascript
const response = await vendorAPI.getMyApplications();
setApplications(response.applications);
```

### getApplicationById
- **Route**: GET /api/vendor/applications/:applicationId
- **Auth**: requireVendor
- **Frontend**: Application detail pages
```javascript
const response = await vendorAPI.getApplicationById(applicationId);
setApplication(response.application);
```

### cancelApplication
- **Route**: PATCH /api/vendor/applications/:applicationId/cancel
- **Auth**: requireVendor
- **Frontend**: `app/vendor/page.js`
```javascript
await vendorAPI.cancelApplication(applicationId);
// Refresh applications list
```

---

## 👔 adminController.js

### getAllVendorRequests
- **Route**: GET /api/admin/vendor-requests
- **Auth**: requireAdminOrEventsOffice
- **Frontend**: `app/eventsoffice/vendors/page.js`
```javascript
const response = await adminAPI.getVendorRequests({ 
  status: 'pending',  // or 'accepted', 'rejected'
  page: 1,
  limit: 20
});
setRequests(response.applications);
```

### getVendorRequestsStats
- **Route**: GET /api/admin/vendor-requests/stats
- **Auth**: requireAdminOrEventsOffice
- **Frontend**: `app/eventsoffice/vendors/page.js`
```javascript
const stats = await adminAPI.getVendorRequestsStats();
setStats(stats);  // { total, pending, accepted, rejected }
```

### getVendorRequestById
- **Route**: GET /api/admin/vendor-requests/:applicationId
- **Auth**: requireAdminOrEventsOffice
- **Frontend**: Vendor request detail page
```javascript
const response = await adminAPI.getVendorRequestById(applicationId);
setRequest(response.application);
```

### acceptVendorRequest
- **Route**: POST /api/admin/vendor-requests/:applicationId/accept
- **Auth**: requireAdminOrEventsOffice
- **Frontend**: `app/eventsoffice/vendors/page.js`
```javascript
await adminAPI.acceptVendorRequest(applicationId);
// Refresh list
```

### rejectVendorRequest
- **Route**: POST /api/admin/vendor-requests/:applicationId/reject
- **Auth**: requireAdminOrEventsOffice
- **Frontend**: `app/eventsoffice/vendors/page.js`
```javascript
await adminAPI.rejectVendorRequest(applicationId, reason);  // reason is optional
// Refresh list
```

### getPendingUsers
- **Route**: GET /api/admin/pending-users
- **Auth**: requireAdmin
- **Frontend**: `app/admin/page.js`
```javascript
const response = await adminAPI.getPendingUsers();
setPendingUsers(response.pendingUsers);
```

### approveUser
- **Route**: POST /api/admin/approve/:userId
- **Auth**: requireAdmin
- **Frontend**: `app/admin/page.js`
```javascript
await adminAPI.approveUser(userId);
// Refresh pending users list
```

### toggleUserBlock
- **Route**: POST /api/admin/user/:userId/block
- **Auth**: requireAdmin
- **Frontend**: `app/admin/page.js`
```javascript
await adminAPI.toggleUserBlock(userId);  // Toggles between blocked/unblocked
// Refresh users list
```

### getAllUsers
- **Route**: GET /api/admin/users
- **Auth**: requireAdmin
- **Frontend**: `app/admin/page.js`
```javascript
const response = await adminAPI.getAllUsers();
setUsers(response.users);
```

---

## 🔑 Helper Functions

### Get Current User
```javascript
import { getUser } from '../../../utils/api';

const user = getUser();
console.log(user.role);        // "Student", "EventsOffice", etc.
console.log(user.first_name);  // User's first name
console.log(user._id);         // User ID for API calls
```

### Get Token
```javascript
import { getToken } from '../../../utils/api';

const token = getToken();  // JWT token string
```

### Logout
```javascript
import { authAPI } from '../../../utils/api';

await authAPI.logout();  // Clears token and user
router.push('/auth/login');
```

---

## 📋 Common Patterns

### Fetch Data on Page Load
```javascript
useEffect(() => {
  fetchData();
}, []);

const fetchData = async () => {
  setLoading(true);
  try {
    const response = await [API_FUNCTION]();
    setData(response);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
```

### Submit Form
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    await [API_FUNCTION](formData);
    setMessage({ text: 'Success!', type: 'success' });
    // Optional: redirect or clear form
  } catch (error) {
    setMessage({ text: error.message, type: 'error' });
  } finally {
    setLoading(false);
  }
};
```

### Button Click Action
```javascript
const handleAction = async (id) => {
  try {
    await [API_FUNCTION](id);
    setMessage({ text: 'Action completed!', type: 'success' });
    fetchData();  // Refresh the list
  } catch (error) {
    setMessage({ text: error.message, type: 'error' });
  }
};
```

---

## 🎯 Quick Checklist

Before implementing any page:
- [ ] Import the correct API functions from `utils/api.js`
- [ ] Add `useState` for loading, error, and message
- [ ] Add `useEffect` for data fetching (if needed)
- [ ] Map your form fields to backend requirements
- [ ] Handle success and error cases
- [ ] Add loading state to buttons
- [ ] Show user feedback messages
- [ ] Test with real backend

---

## 🚀 Start Now!

Pick any page, find its controller method above, copy the code snippet, adjust the form fields, and you're done! All the hard work is already done in `utils/api.js`. 🎉

