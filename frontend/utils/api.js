// ================================
// API UTILITY FUNCTIONS
// ================================
// Base configuration and helper functions for all API calls

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Get token from localStorage
export const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Set token in localStorage
export const setToken = (token) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

// Remove token from localStorage
export const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Get user from localStorage
export const getUser = () => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
  return null;
};

// Set user in localStorage
export const setUser = (user) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

// Base fetch wrapper with auth
const fetchWithAuth = async (endpoint, options = {}) => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// HTTP Methods
export const api = {
  get: (endpoint) => fetchWithAuth(endpoint, { method: 'GET' }),
  
  post: (endpoint, body) => fetchWithAuth(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  
  put: (endpoint, body) => fetchWithAuth(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  }),
  
  patch: (endpoint, body) => fetchWithAuth(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }),
  
  delete: (endpoint) => fetchWithAuth(endpoint, { method: 'DELETE' }),
};

// ================================
// AUTHENTICATION APIs
// ================================

export const authAPI = {
  // POST /api/auth/signup
  // Required: { first_name, last_name, email, id_number, password, role } OR { company_name, email, password, role: "Vendor" }
  signup: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Signup failed');
    return data;
  },

  // POST /api/auth/login
  // Required: { email, password }
  // Returns: { token, user }
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Login failed');
    
    // Store token and user
    if (data.token) {
      setToken(data.token);
      setUser(data.user);
    }
    
    return data;
  },

  // POST /api/auth/logout
  logout: async () => {
    try {
      await api.post('/auth/logout', {});
    } finally {
      removeToken();
    }
  },
};

// ================================
// WORKSHOP APIs (EventsOffice only)
// ================================

export const workshopAPI = {
  // POST /api/workshop/
  // Auth: requireEventsOffice
  // Required: { name, location, short_description, start_date, end_date, time, full_agenda, 
  //             faculty_responsible, professors_participating, required_budget, funding_source, 
  //             extra_resources, capacity, registration_deadline }
  create: (workshopData) => api.post('/workshop/', workshopData),

  // PUT /api/workshop/:id
  // Auth: requireEventsOffice
  // Updates workshop fields
  edit: (id, updates) => api.put(`/workshop/${id}`, updates),

  // GET /api/workshop/my
  // Auth: requireEventsOffice
  // Returns workshops created by logged-in user
  getMyWorkshops: () => api.get('/workshop/my'),
};

// ================================
// TRIP APIs (EventsOffice only for create/edit)
// ================================

export const tripAPI = {
  // POST /api/trip/createTrip
  // Auth: requireEventsOffice
  // Required: { name, location, price, start_date, end_date, time, short_description, 
  //             capacity, registration_deadline }
  create: (tripData) => api.post('/trip/createTrip', tripData),

  // PUT /api/trip/updateTrip/:id
  // Auth: requireEventsOffice
  // Updates trip fields
  edit: (id, updates) => api.put(`/trip/updateTrip/${id}`, updates),

  // GET /api/trip/getTrip/:id
  // Auth: requireStudentOrAbove
  // Returns single trip by ID
  getById: (id) => api.get(`/trip/getTrip/${id}`),

  // GET /api/trip/listTrips
  // Auth: requireStudentOrAbove
  // Query params: page, limit, status, location
  list: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/trip/listTrips${queryString ? `?${queryString}` : ''}`);
  },

  // GET /api/events/filter/type/Trip - Get all trips for EventsOffice
  // Auth: requireStudentOrAbove
  // Returns array of trips
  getMyTrips: () => api.get('/events/filter/type/Trip'),
  
  // Alias
  getAll: () => api.get('/events/filter/type/Trip'),
};

// ================================
// BAZAAR APIs (EventsOffice only for create/edit)
// ================================

export const bazaarAPI = {
  // POST /api/bazaar/createBazaar
  // Auth: requireEventsOffice
  // Required: { name, location, short_description, start_date, end_date, time, registration_deadline }
  create: (bazaarData) => api.post('/bazaar/createBazaar', bazaarData),

  // PUT /api/bazaar/editBazaar/:id
  // Auth: requireEventsOffice
  edit: (id, updates) => api.put(`/bazaar/editBazaar/${id}`, updates),

  // GET /api/bazaar/all
  // Auth: any authenticated user
  getAll: () => api.get('/bazaar/all'),

  // GET /api/bazaar/:id
  // Auth: any authenticated user
  getById: (id) => api.get(`/bazaar/${id}`),
};

// ================================
// CONFERENCE APIs (EventsOffice only)
// ================================

export const conferenceAPI = {
  // POST /api/conference/create
  // Auth: requireEventsOffice
  // Required: { name, location, short_description, start_date, end_date, time, campus,
  //             professors_participating, full_agenda, conference_website, required_budget,
  //             funding_source, extra_required_sources }
  create: (conferenceData) => api.post('/conference/create', conferenceData),

  // PUT /api/conference/:id
  // Auth: requireEventsOffice
  edit: (id, updates) => api.put(`/conference/${id}`, updates),

  // GET /api/events/filter/type/Conference (get all conferences)
  // Auth: requireStudentOrAbove
  getMyConferences: () => api.get('/events/filter/type/Conference'),

  // GET all conferences (alias)
  getAll: () => api.get('/events/filter/type/Conference'),
};

// ================================
// GYM SESSION APIs (EventsOffice for create/edit, Students can view)
// ================================

export const gymAPI = {
  // GET /api/gymSession/schedule
  // Auth: requireStudentOrAbove
  // Query params: month, year, type
  getSchedule: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/gymSession/schedule${queryString ? `?${queryString}` : ''}`);
  },

  // POST /api/gymSession/create
  // Auth: requireAdminOrEventsOffice
  // Required: { date, time, duration, type, maxParticipants }
  create: (sessionData) => api.post('/gymSession/create', sessionData),

  // PUT /api/gymSession/edit/:id
  // Auth: requireAdminOrEventsOffice
  edit: (id, updates) => api.put(`/gymSession/edit/${id}`, updates),

  // PATCH /api/gymSession/cancel/:id
  // Auth: requireAdminOrEventsOffice
  cancel: (id) => api.patch(`/gymSession/cancel/${id}`, {}),
};

// ================================
// FACILITY APIs (EventsOffice can add, Students can view)
// ================================

export const facilityAPI = {
  // GET /api/facility/getAll
  // Auth: requireStudent (any authenticated user)
  getAll: () => api.get('/facility/getAll'),

  // POST /api/facility/add
  // Auth: requireAdminOrEventsOffice
  // Required: { type, capacity, hourly_rate, status }
  // type: "Football" | "Basketball" | "Tennis" | "Volleyball" | "Squash" | "Gym" | "Pool"
  add: (facilityData) => api.post('/facility/add', facilityData),
};

// ================================
// EVENT APIs (General - All roles can access)
// ================================

export const eventAPI = {
  // GET /api/events/upcoming
  // Auth: requireStudentOrAbove
  // Returns all upcoming events
  getUpcoming: () => api.get('/events/upcoming'),

  // GET /api/events/filter/:field/:value
  // Auth: requireStudentOrAbove
  // field: "name" | "type" | "professor" | "location"
  filter: (field, value) => api.get(`/events/filter/${field}/${value}`),

  // GET /api/events/sort/date/:order
  // Auth: requireStudentOrAbove
  // order: "asc" | "desc"
  sortByDate: (order) => api.get(`/events/sort/date/${order}`),
};

// ================================
// REGISTRATION APIs (Students, Staff, TA, Professor)
// ================================

export const registrationAPI = {
  // POST /api/registration/register
  // Auth: requireRegistering (Student, TA, Staff, Professor)
  // Required: { event_id, name, email, personalId, role }
  register: (registrationData) => api.post('/registration/register', registrationData),

  // GET /api/registration/:user_id/events
  // Auth: requireRegistering
  // Returns { upcoming: [], past: [] }
  getMyRegistrations: (userId) => api.get(`/registration/${userId}/events`),
};

// ================================
// VENDOR APIs (Vendor role only)
// ================================

export const vendorAPI = {
  // GET /api/vendor/upcoming/bazaars
  // Auth: requireVendor
  // Returns upcoming bazaars with registration status
  getUpcomingBazaars: () => api.get('/vendor/upcoming/bazaars'),

  // POST /api/vendor/apply/bazaar
  // Auth: requireVendor
  // Required: { bazaar_id, booth_size, bazaar_staff: [{ name, email }] }
  applyToBazaar: (applicationData) => api.post('/vendor/apply/bazaar', applicationData),

  // POST /api/vendor/apply/booth-event
  // Auth: requireVendor
  // Required: { booth_size, setup_duration_weeks, booth_location: { zone, x_coordinate?, y_coordinate?, description? }, booth_staff: [{ name, email }], preferred_start_date?, notes? }
  applyToBoothEvent: (applicationData) => api.post('/vendor/apply/booth-event', applicationData),

  // GET /api/vendor/applications/accepted
  // Auth: requireVendor
  // Returns accepted applications for upcoming events
  getAcceptedApplications: () => api.get('/vendor/applications/accepted'),

  // GET /api/vendor/applications/pending-rejected
  // Auth: requireVendor
  // Query params: status (optional: 'pending' or 'rejected')
  getPendingAndRejected: (status = null) => {
    const queryString = status ? `?status=${status}` : '';
    return api.get(`/vendor/applications/pending-rejected${queryString}`);
  },

  // GET /api/vendor/applications/my-applications
  // Auth: requireVendor
  // Returns all applications grouped by status
  getMyApplications: () => api.get('/vendor/applications/my-applications'),

  // GET /api/vendor/applications/:applicationId
  // Auth: requireVendor
  // Returns detailed application information
  getApplicationById: (id) => api.get(`/vendor/applications/${id}`),

  // PATCH /api/vendor/applications/:applicationId/cancel
  // Auth: requireVendor
  // Cancels pending unpaid application
  cancelApplication: (id) => api.patch(`/vendor/applications/${id}/cancel`, {}),
};

// ================================
// ADMIN APIs (Vendor Request Management - Admin & EventsOffice)
// ================================

export const adminAPI = {
  // GET /api/admin/vendor-requests
  // Auth: requireAdminOrEventsOffice
  // Query params: status, page, limit
  getVendorRequests: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/admin/vendor-requests${queryString ? `?${queryString}` : ''}`);
  },

  // GET /api/admin/vendor-requests/stats
  // Auth: requireAdminOrEventsOffice
  getVendorRequestsStats: () => api.get('/admin/vendor-requests/stats'),

  // GET /api/admin/vendor-requests/:applicationId
  // Auth: requireAdminOrEventsOffice
  getVendorRequestById: (id) => api.get(`/admin/vendor-requests/${id}`),

  // POST /api/admin/vendor-requests/:applicationId/accept
  // Auth: requireAdminOrEventsOffice
  acceptVendorRequest: (id) => api.post(`/admin/vendor-requests/${id}/accept`, {}),

  // POST /api/admin/vendor-requests/:applicationId/reject
  // Auth: requireAdminOrEventsOffice
  // Optional: { reason: "rejection reason" }
  rejectVendorRequest: (id, reason) => api.post(`/admin/vendor-requests/${id}/reject`, { reason }),

  // GET /api/admin/pending-users
  // Auth: requireAdmin
  getPendingUsers: () => api.get('/admin/pending-users'),

  // POST /api/admin/approve/:userId
  // Auth: requireAdmin
  approveUser: (userId) => api.post(`/admin/approve/${userId}`, {}),

  // POST /api/admin/user/:userId/block
  // Auth: requireAdmin
  toggleUserBlock: (userId) => api.post(`/admin/user/${userId}/block`, {}),

  // GET /api/admin/users
  // Auth: requireAdmin
  getAllUsers: () => api.get('/admin/users'),
};

export default api;
