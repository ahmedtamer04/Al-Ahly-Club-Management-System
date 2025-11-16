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
// WORKSHOP APIs (Professor & EventsOffice)
// ================================

export const workshopAPI = {
  // POST /api/workshop/
  // Auth: requireProfessor
  // Create a new workshop (submitted for approval)
  // Required: { name, location, short_description, start_date, end_date, time, full_agenda, 
  //             faculty_responsible, professors_participating, required_budget, funding_source, 
  //             extra_resources, capacity, registration_deadline }
  create: (workshopData) => api.post('/workshop/', workshopData),

  // PUT /api/workshop/:id
  // Auth: requireProfessor
  // Updates workshop fields (only before start date)
  edit: (id, updates) => api.put(`/workshop/${id}`, updates),

  // GET /api/workshop/my
  // Auth: requireProfessor
  // Returns workshops created by logged-in professor
  getMyWorkshops: () => api.get('/workshop/my'),

  // GET /api/workshop/:id/participants
  // Auth: requireProfessor
  // Get participants list for a workshop (professor's own workshops only)
  getParticipants: (id) => api.get(`/workshop/${id}/participants`),

  // GET /api/workshop/pending
  // Auth: requireAdminOrEventsOffice
  // Get all pending workshops for review
  getPending: () => api.get('/workshop/pending'),

  // PATCH /api/workshop/:id/review
  // Auth: requireAdminOrEventsOffice
  // Review workshop (accept/reject/request edits)
  // Body: { action: 'accept' | 'reject' | 'request_edits', rejection_reason?: string, requested_edits?: string }
  review: (id, action, reason = null) => {
    const body = { action };
    if (action === 'reject' && reason) {
      body.rejection_reason = reason;
    } else if (action === 'request_edits' && reason) {
      body.requested_edits = reason;
    }
    return api.patch(`/workshop/${id}/review`, body);
  },

  // PATCH /api/workshop/:id/complete
  // Auth: requireAdminOrEventsOffice
  // Mark workshop as completed and send certificates
  complete: (id, force = false) => 
    api.patch(`/workshop/${id}/complete${force ? '?force=true' : ''}`, {}),
};

// ================================
// TRIP APIs (EventsOffice only for create/edit)
// ================================

export const tripAPI = {
  // POST /api/trips/createTrip
  // Auth: requireEventsOffice
  // Required: { name, location, price, start_date, end_date, time, short_description, 
  //             capacity, registration_deadline }
  create: (tripData) => api.post('/trips/createTrip', tripData),

  // PUT /api/trips/updateTrip/:id
  // Auth: requireEventsOffice
  // Updates trip fields
  edit: (id, updates) => api.put(`/trips/updateTrip/${id}`, updates),

  // GET /api/trips/getTrip/:id
  // Auth: requireStudentOrAbove
  // Returns single trip by ID
  getById: (id) => api.get(`/trips/getTrip/${id}`),

  // GET /api/trips/listTrips
  // Auth: requireStudentOrAbove
  // Query params: page, limit, status, location
  list: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/trips/listTrips${queryString ? `?${queryString}` : ''}`);
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
  // GET /api/gym-sessions/schedule
  // Auth: requireStudentOrAbove
  // Query params: month, year, type
  getSchedule: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/gym-sessions/schedule${queryString ? `?${queryString}` : ''}`);
  },

  // POST /api/gym-sessions/create
  // Auth: requireAdminOrEventsOffice
  // Required: { date, time, duration, type, maxParticipants }
  create: (sessionData) => api.post('/gym-sessions/create', sessionData),

  // PUT /api/gym-sessions/edit/:id
  // Auth: requireAdminOrEventsOffice
  edit: (id, updates) => api.put(`/gym-sessions/edit/${id}`, updates),

  // PATCH /api/gym-sessions/cancel/:id
  // Auth: requireAdminOrEventsOffice
  cancel: (id) => api.patch(`/gym-sessions/cancel/${id}`, {}),
};

// ================================
// FACILITY APIs (EventsOffice can add, Students can view)
// ================================

export const facilityAPI = {
  // GET /api/facilities/getAll
  // Auth: requireStudent (any authenticated user)
  getAll: () => api.get('/facilities/getAll'),

  // POST /api/facilities/add
  // Auth: requireAdminOrEventsOffice
  // Required: { type, capacity, hourly_rate, status }
  // type: "Football" | "Basketball" | "Tennis" | "Volleyball" | "Squash" | "Gym" | "Pool"
  add: (facilityData) => api.post('/facilities/add', facilityData),
};

// ================================
// EVENT APIs (General - All roles can access)
// ================================

export const eventAPI = {
  // GET /api/events/all
  // Auth: requireAdminOrEventsOffice
  // Returns all events (including past events)
  getAll: () => api.get('/events/all'),

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

  // DELETE /api/events/delete/:eventId
  // Auth: requireAdminOrEventsOffice
  // Can only delete if no registrations exist
  delete: (eventId) => api.delete(`/events/delete/${eventId}`),
  
  // GET /api/events/:id
  getById: (id) => api.get(`/events/${id}`),
  
  // GET /api/events/:event_id/comments
  // Auth: requireStudentOrAbove
  // Returns all comments for a specific event
  getComments: (eventId) => api.get(`/events/${eventId}/comments`),
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

  // PATCH /api/registration/cancel/:registrationId
  // Auth: requireRegistering
  // Cancels a registration
  cancel: (registrationId) => api.patch(`/registration/cancel/${registrationId}`, {}),
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

  // GET /api/vendor/booth-availability
  // Auth: requireVendor
  // Query params: start_date (YYYY-MM-DD), duration_weeks (1-4)
  // Returns occupied booth positions
  getBoothAvailability: (startDate, durationWeeks) => {
    return api.get(`/vendor/booth-availability?start_date=${startDate}&duration_weeks=${durationWeeks}`);
  },
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
  // Required: { rejection_reason: "rejection reason" }
  rejectVendorRequest: (id, rejection_reason) => api.post(`/admin/vendor-requests/${id}/reject`, { rejection_reason }),

  // GET /api/admin/pending-users
  // Auth: requireAdmin
  getPendingUsers: () => api.get('/admin/pending-users'),

  // POST /api/admin/approve/:userId
  // Auth: requireAdmin
  approveUser: (userId) => api.post(`/admin/approve/${userId}`, {}),

  // POST /api/admin/user/:userId/block
  // Auth: requireAdmin
  // Required: { action: "block" | "unblock" }
  toggleUserBlock: (userId, action) => api.post(`/admin/user/${userId}/block`, { action }),

  // DELETE /api/admin/comment/:commentId
  // Auth: requireAdmin
  // Soft deletes a comment (marks as deleted, doesn't permanently remove)
  deleteComment: (commentId) => api.delete(`/admin/comment/${commentId}`),

  // GET /api/admin/users
  // Auth: requireAdmin
  getAllUsers: () => api.get('/admin/users'),
};

// ================================
// PAYMENT API
// ================================
export const paymentAPI = {
  // GET /api/payment/wallet/balance
  // Auth: required
  // Get user's wallet balance and currency
  getWalletBalance: () => api.get('/payment/wallet/balance'),

  // POST /api/payment/wallet/top-up
  // Auth: required
  // Add funds to wallet
  // Body: { amount: number }
  topUpWallet: (amount) => api.post('/payment/wallet/top-up', { amount }),

  // GET /api/payment/wallet/transactions
  // Auth: required
  // Get wallet transaction history
  getWalletTransactions: () => api.get('/payment/wallet/transactions'),

  // POST /api/payment/wallet/pay
  // Auth: required
  // Pay from wallet balance
  // Body: { event_id: string, registration_id: string }
  payWithWallet: (eventId, registrationId) => api.post('/payment/wallet/pay', { 
    event_id: eventId, 
    registration_id: registrationId 
  }),

  // POST /api/payment/stripe/create-intent
  // Auth: required
  // Create Stripe payment intent for card payment
  // Body: { event_id: string, registration_id: string }
  createStripeIntent: (eventId, registrationId) => api.post('/payment/stripe/create-intent', {
    event_id: eventId,
    registration_id: registrationId
  }),

  // POST /api/payment/stripe/confirm
  // Auth: required
  // Confirm Stripe payment after successful card charge
  // Body: { payment_id: string, payment_intent_id: string }
  confirmStripePayment: (paymentId, paymentIntentId) => api.post('/payment/stripe/confirm', {
    payment_id: paymentId,
    payment_intent_id: paymentIntentId
  }),

  // GET /api/payment/history
  // Auth: required
  // Get user's payment history with event details
  getPaymentHistory: () => api.get('/payment/history'),
};

// ================================
// NOTIFICATION API
// ================================
export const notificationAPI = {
  // GET /api/notifications
  // Auth: required
  // Get all notifications for logged-in user
  // Query: ?unread_only=true (optional)
  getNotifications: (unreadOnly = false) => 
    api.get(`/notifications${unreadOnly ? '?unread_only=true' : ''}`),

  // GET /api/notifications/unread-count
  // Auth: required
  // Get count of unread notifications
  getUnreadCount: () => api.get('/notifications/unread-count'),

  // PATCH /api/notifications/:id/read
  // Auth: required
  // Mark a specific notification as read
  markAsRead: (notificationId) => api.patch(`/notifications/${notificationId}/read`, {}),

  // PATCH /api/notifications/mark-all-read
  // Auth: required
  // Mark all notifications as read
  markAllAsRead: () => api.patch('/notifications/mark-all-read', {}),

  // DELETE /api/notifications/:id
  // Auth: required
  // Delete a notification
  deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}`),
};

// ================================
// SALES REPORT API
// ================================
export const salesReportAPI = {
  // GET /api/sales-report
  // Auth: requireAdminOrEventsOffice
  // Query params: event_type, start_date, end_date, sort_by, sort_order
  getSalesReport: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/sales-report${queryString ? `?${queryString}` : ''}`);
  },
};

// ================================
// DOCUMENT API
// ================================
export const documentAPI = {
  // POST /api/documents/upload
  // Auth: requireAdminOrEventsOffice
  // FormData: { file, description?, event_id?, category? }
  upload: async (formData) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type, let browser set it with boundary for FormData
      },
      body: formData
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }
    return data;
  },

  // GET /api/documents
  // Auth: requireAdminOrEventsOffice
  // Query: event_id?, category?, uploaded_by?
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/documents${queryString ? `?${queryString}` : ''}`);
  },

  // GET /api/documents/:id/download
  // Auth: requireAdminOrEventsOffice
  download: (documentId) => {
    const token = getToken();
    return fetch(`${API_BASE_URL}/documents/${documentId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then(res => {
      if (!res.ok) throw new Error('Download failed');
      return res.blob();
    });
  },

  // GET /api/documents/:id/view
  // Auth: requireAdminOrEventsOffice
  view: (documentId) => {
    const token = getToken();
    return `${API_BASE_URL}/documents/${documentId}/view?token=${token}`;
  },

  // DELETE /api/documents/:id
  // Auth: requireAdminOrEventsOffice
  delete: (documentId) => api.delete(`/documents/${documentId}`),
};

export default api;
