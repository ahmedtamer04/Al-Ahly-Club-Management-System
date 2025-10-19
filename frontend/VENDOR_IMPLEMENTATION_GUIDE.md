# Vendor Frontend Implementation Guide

## ✅ Completed
1. **utils/api.js** - Updated with all 8 vendor endpoints
2. **app/vendor/bazaars/page.js** - Updated to fetch and display upcoming bazaars

## 📝 Files That Need Updates

### 1. app/vendor/apply-bazaar/page.js
**Purpose:** Form to apply to a specific bazaar with booth details

**Key Changes Needed:**
```javascript
// Add these imports
import { useRouter, useSearchParams } from 'next/navigation';
import { vendorAPI } from '@/utils/api';
import { Suspense } from 'react';

// Update form state
const [formData, setFormData] = useState({
  bazaar_id: '',  // from URL query param
  booth_size: '2x2',
  bazaar_staff: [{ name: '', email: '' }]
});

// Submit handler
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await vendorAPI.applyToBazaar(formData);
    router.push('/vendor/applications');
  } catch (err) {
    setError(err.message);
  }
};
```

**API Endpoint Used:**
- POST /api/vendor/apply/bazaar
- Body: `{ bazaar_id, booth_size, bazaar_staff: [{name, email}] }`

---

### 2. app/vendor/apply-booth/page.js
**Purpose:** Form to apply for a standalone booth event (independent of bazaars)

**Complete Implementation:**
```javascript
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { vendorAPI } from '@/utils/api';
import '@/app/dashboard.css';

export default function ApplyBoothPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    booth_size: '2x2',
    setup_duration_weeks: 1,
    booth_location: {
      zone: 'A',
      x_coordinate: '',
      y_coordinate: '',
      description: ''
    },
    booth_staff: [{ name: '', email: '' }],
    preferred_start_date: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddStaff = () => {
    if (formData.booth_staff.length < 5) {
      setFormData({
        ...formData,
        booth_staff: [...formData.booth_staff, { name: '', email: '' }]
      });
    }
  };

  const handleRemoveStaff = (index) => {
    if (formData.booth_staff.length > 1) {
      const newStaff = formData.booth_staff.filter((_, i) => i !== index);
      setFormData({ ...formData, booth_staff: newStaff });
    }
  };

  const handleStaffChange = (index, field, value) => {
    const newStaff = [...formData.booth_staff];
    newStaff[index][field] = value;
    setFormData({ ...formData, booth_staff: newStaff });
  };

  const handleLocationChange = (field, value) => {
    setFormData({
      ...formData,
      booth_location: { ...formData.booth_location, [field]: value }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    for (const staff of formData.booth_staff) {
      if (!staff.name || !staff.email) {
        setError('Please fill in all staff member details');
        return;
      }
    }

    try {
      setLoading(true);
      // Clean up coordinates if empty
      const submitData = {
        ...formData,
        booth_location: {
          ...formData.booth_location,
          x_coordinate: formData.booth_location.x_coordinate || undefined,
          y_coordinate: formData.booth_location.y_coordinate || undefined
        }
      };
      await vendorAPI.applyToBoothEvent(submitData);
      router.push('/vendor/applications');
    } catch (err) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      {/* Navigation - same as other pages */}
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">🏪 Vendor Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/vendor">🏠 Dashboard</Link></li>
            <li><Link href="/vendor/applications">📋 My Applications</Link></li>
            <li><Link href="/vendor/bazaars">🎪 Browse Bazaars</Link></li>
            <li><Link href="/vendor/apply-booth" className="active">🏪 Apply for Booth</Link></li>
            <li><Link href="/vendor/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Apply for Booth Event 🏪</h1>
          <p>Submit a request for a standalone booth (independent of bazaars)</p>

          {error && <div className="alert alert-error">{error}</div>}

          <section className="section">
            <form onSubmit={handleSubmit} className="application-form">
              
              {/* Booth Size */}
              <div className="form-group">
                <label>Booth Size *</label>
                <select
                  value={formData.booth_size}
                  onChange={(e) => setFormData({ ...formData, booth_size: e.target.value })}
                  required
                >
                  <option value="2x2">2x2 (Small)</option>
                  <option value="4x4">4x4 (Large)</option>
                </select>
              </div>

              {/* Setup Duration */}
              <div className="form-group">
                <label>Setup Duration (weeks) *</label>
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={formData.setup_duration_weeks}
                  onChange={(e) => setFormData({ ...formData, setup_duration_weeks: parseInt(e.target.value) })}
                  required
                />
                <small>How many weeks do you need to set up? (1-4)</small>
              </div>

              {/* Booth Location */}
              <div className="form-group">
                <label>Preferred Location *</label>
                <div className="form-row">
                  <div>
                    <label>Zone *</label>
                    <select
                      value={formData.booth_location.zone}
                      onChange={(e) => handleLocationChange('zone', e.target.value)}
                      required
                    >
                      <option value="A">Zone A</option>
                      <option value="B">Zone B</option>
                      <option value="C">Zone C</option>
                      <option value="D">Zone D</option>
                    </select>
                  </div>
                  <div>
                    <label>X Coordinate (optional)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.booth_location.x_coordinate}
                      onChange={(e) => handleLocationChange('x_coordinate', e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Y Coordinate (optional)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.booth_location.y_coordinate}
                      onChange={(e) => handleLocationChange('y_coordinate', e.target.value)}
                    />
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Location description (e.g., 'Near main entrance')"
                  value={formData.booth_location.description}
                  onChange={(e) => handleLocationChange('description', e.target.value)}
                  style={{ marginTop: '0.5rem' }}
                />
              </div>

              {/* Staff Members */}
              <div className="form-group">
                <label>Booth Staff (1-5 members) *</label>
                {formData.booth_staff.map((staff, index) => (
                  <div key={index} className="staff-row">
                    <input
                      type="text"
                      placeholder="Name"
                      value={staff.name}
                      onChange={(e) => handleStaffChange(index, 'name', e.target.value)}
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={staff.email}
                      onChange={(e) => handleStaffChange(index, 'email', e.target.value)}
                      required
                    />
                    {formData.booth_staff.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStaff(index)}
                        className="btn-remove"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {formData.booth_staff.length < 5 && (
                  <button type="button" onClick={handleAddStaff} className="btn btn-secondary">
                    + Add Staff Member
                  </button>
                )}
              </div>

              {/* Preferred Start Date */}
              <div className="form-group">
                <label>Preferred Start Date (optional)</label>
                <input
                  type="date"
                  value={formData.preferred_start_date}
                  onChange={(e) => setFormData({ ...formData, preferred_start_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Notes */}
              <div className="form-group">
                <label>Additional Notes (optional)</label>
                <textarea
                  rows="4"
                  maxLength="500"
                  placeholder="Any special requirements or notes (max 500 characters)"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
                <small>{formData.notes.length}/500 characters</small>
              </div>

              {/* Submit */}
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>

      {/* Add CSS styles here - similar to apply-bazaar page */}
    </div>
  );
}
```

**API Endpoint Used:**
- POST /api/vendor/apply/booth-event
- Body: `{ booth_size, setup_duration_weeks, booth_location, booth_staff, preferred_start_date?, notes? }`

---

### 3. app/vendor/applications/page.js
**Purpose:** Display all applications with filtering and cancel functionality

**Key Features to Implement:**
1. Fetch all applications on load
2. Display stats cards (total, pending, accepted, rejected)
3. Filter tabs to switch between statuses
4. Application cards showing details
5. Cancel button for pending unpaid applications

**API Endpoints Used:**
- GET /api/vendor/applications/my-applications (main)
- PATCH /api/vendor/applications/:id/cancel (for cancellation)

**Key State:**
```javascript
const [applications, setApplications] = useState([]);
const [filter, setFilter] = useState('all'); // all, pending, accepted, rejected

useEffect(() => {
  fetchApplications();
}, []);

const fetchApplications = async () => {
  const data = await vendorAPI.getMyApplications();
  setApplications(data.applications);
};

const handleCancel = async (id) => {
  await vendorAPI.cancelApplication(id);
  fetchApplications(); // Refresh
};
```

---

### 4. app/vendor/page.js (Dashboard)
**Purpose:** Main vendor dashboard with summary and quick actions

**Sections Needed:**
1. Welcome message
2. Quick stats (total applications, pending, accepted)
3. Quick action buttons
4. Recent applications preview

**Implementation:**
```javascript
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { vendorAPI } from '@/utils/api';
import { getUser } from '@/utils/api';
import '@/app/dashboard.css';

export default function VendorDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getUser());
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await vendorAPI.getMyApplications();
      const apps = data.applications || [];
      
      setStats({
        total: apps.length,
        pending: apps.filter(a => a.status === 'pending').length,
        accepted: apps.filter(a => a.status === 'accepted').length,
        rejected: apps.filter(a => a.status === 'rejected').length
      });
      
      // Get most recent 5
      setRecentApplications(apps.slice(0, 5));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  return (
    <div className="dashboard">
      {/* Nav and sidebar */}
      <nav className="dashboard-nav">...</nav>
      
      <div className="dashboard-content">
        <aside className="sidebar">...</aside>
        
        <main className="main-content">
          <h1>Welcome, {user?.vendor_info?.company_name || 'Vendor'} 🏪</h1>
          
          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Applications</div>
            </div>
            <div className="stat-card pending">
              <div className="stat-value">{stats.pending}</div>
              <div className="stat-label">Pending</div>
            </div>
            <div className="stat-card accepted">
              <div className="stat-value">{stats.accepted}</div>
              <div className="stat-label">Accepted</div>
            </div>
            <div className="stat-card rejected">
              <div className="stat-value">{stats.rejected}</div>
              <div className="stat-label">Rejected</div>
            </div>
          </div>

          {/* Quick Actions */}
          <section className="section">
            <h2>Quick Actions</h2>
            <div className="actions-grid">
              <Link href="/vendor/bazaars" className="action-card">
                <div className="action-icon">🎪</div>
                <h3>Browse Bazaars</h3>
                <p>View upcoming bazaars and apply</p>
              </Link>
              <Link href="/vendor/apply-booth" className="action-card">
                <div className="action-icon">🏪</div>
                <h3>Apply for Booth</h3>
                <p>Request a standalone booth</p>
              </Link>
              <Link href="/vendor/applications" className="action-card">
                <div className="action-icon">📋</div>
                <h3>My Applications</h3>
                <p>View and manage applications</p>
              </Link>
            </div>
          </section>

          {/* Recent Applications */}
          <section className="section">
            <h2>Recent Applications</h2>
            {recentApplications.length === 0 ? (
              <p>No applications yet. Start by browsing bazaars!</p>
            ) : (
              <div className="applications-preview">
                {recentApplications.map(app => (
                  <div key={app._id} className="app-preview-card">
                    <h4>{app.bazaar?.name || 'Booth Event'}</h4>
                    <span className={`status-${app.status}`}>{app.status}</span>
                  </div>
                ))}
              </div>
            )}
            <Link href="/vendor/applications" className="btn btn-secondary">
              View All Applications →
            </Link>
          </section>
        </main>
      </div>
    </div>
  );
}
```

---

## 🔑 Key API Endpoints Summary

| Endpoint | Method | Purpose | Page |
|----------|--------|---------|------|
| `/api/vendor/upcoming/bazaars` | GET | Get upcoming bazaars | bazaars/page.js |
| `/api/vendor/apply/bazaar` | POST | Apply to bazaar | apply-bazaar/page.js |
| `/api/vendor/apply/booth-event` | POST | Apply for booth | apply-booth/page.js |
| `/api/vendor/applications/my-applications` | GET | Get all apps | applications/page.js, page.js |
| `/api/vendor/applications/:id/cancel` | PATCH | Cancel application | applications/page.js |

---

## 🎨 Shared Styles to Add to dashboard.css

```css
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-card.pending { border-left: 4px solid #ffc107; }
.stat-card.accepted { border-left: 4px solid #28a745; }
.stat-card.rejected { border-left: 4px solid #dc3545; }

.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: #c41e3a;
}

.stat-label {
  color: #666;
  margin-top: 0.5rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.action-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-decoration: none;
  transition: transform 0.2s;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.action-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.staff-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.staff-row input {
  flex: 1;
}

.btn-remove {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  cursor: pointer;
}
```

---

## ✅ Testing Checklist

1. [ ] Browse bazaars page loads and displays bazaars
2. [ ] Can click "Apply Now" and navigate to apply form
3. [ ] Apply to bazaar form submits successfully
4. [ ] Apply to booth form submits successfully
5. [ ] Applications page shows all applications
6. [ ] Can filter applications by status
7. [ ] Can cancel pending unpaid applications
8. [ ] Dashboard shows correct stats
9. [ ] All navigation links work

---

## 🚀 Next Steps

1. Update each file with the code provided above
2. Test each feature in order
3. Handle edge cases and error states
4. Add loading states where needed
5. Ensure mobile responsiveness
