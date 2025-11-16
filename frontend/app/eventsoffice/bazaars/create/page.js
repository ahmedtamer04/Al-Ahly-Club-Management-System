'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { bazaarAPI } from '@/utils/api';
import '@/app/dashboard.css';

export default function CreateBazaarPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    short_description: '',
    start_date: '',
    end_date: '',
    time: '',
    registration_deadline: '',
    allowed_roles: [], // Array of allowed roles
  });
  
  const availableRoles = ['Student', 'Staff', 'TA', 'Professor'];
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await bazaarAPI.create(formData);
      setMessage({ text: 'Bazaar created successfully!', type: 'success' });
      // Reset form
      setFormData({
        name: '',
        location: '',
        short_description: '',
        start_date: '',
        end_date: '',
        time: '',
        registration_deadline: '',
        allowed_roles: []
      });
      // Redirect to bazaars list after 2 seconds
      setTimeout(() => {
        router.push('/eventsoffice/bazaars');
      }, 2000);
    } catch (err) {
      setMessage({ text: err.message || 'Failed to create bazaar', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">📋 Events Office</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/eventsoffice">🏠 Dashboard</Link></li>
            <li><Link href="/eventsoffice/create">➕ Create Event</Link></li>
            <li><Link href="/eventsoffice/workshops">� Workshops</Link></li>
            <li><Link href="/eventsoffice/trips">🚌 Trips</Link></li>
            <li><Link href="/eventsoffice/bazaars">� Bazaars</Link></li>
            <li><Link href="/eventsoffice/gym">🏋️ Gym Sessions</Link></li>
            <li><Link href="/eventsoffice/vendors">🏪 Vendor Requests</Link></li>
            <li><Link href="/eventsoffice/facilities">🏟️ Facilities</Link></li>
            <li><Link href="/eventsoffice/registrations">🎫 Registrations</Link></li>
            <li><Link href="/eventsoffice/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Create Bazaar 🏪</h1>

          {message.text && (
            <div className={`alert alert-${message.type}`}>
              {message.text}
            </div>
          )}

          <section className="section">
            <form onSubmit={handleSubmit} className="form">
              <div className="form-group">
                <label htmlFor="name">Bazaar Name *</label>
                <input
                  type="text"
                  id="name"
                  required
                  placeholder="e.g., Spring Market 2025"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="location">Location *</label>
                <input
                  type="text"
                  id="location"
                  required
                  placeholder="Venue/Building"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="short_description">Short Description *</label>
                <textarea
                  id="short_description"
                  rows="4"
                  required
                  placeholder="Describe the bazaar theme, type of vendors expected..."
                  value={formData.short_description}
                  onChange={(e) => setFormData({...formData, short_description: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="start_date">Start Date *</label>
                  <input
                    type="date"
                    id="start_date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="end_date">End Date *</label>
                  <input
                    type="date"
                    id="end_date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="time">Time *</label>
                <input
                  type="text"
                  id="time"
                  required
                  placeholder="e.g., 10:00 AM - 5:00 PM"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label htmlFor="registration_deadline">Registration Deadline *</label>
                <input
                  type="date"
                  id="registration_deadline"
                  required
                  value={formData.registration_deadline}
                  onChange={(e) => setFormData({...formData, registration_deadline: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Restrict to Specific Roles (Optional)</label>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                  Select which user roles can view and register for this event. Leave empty to allow all roles.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {availableRoles.map(role => (
                    <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.allowed_roles.includes(role)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({...formData, allowed_roles: [...formData.allowed_roles, role]});
                          } else {
                            setFormData({...formData, allowed_roles: formData.allowed_roles.filter(r => r !== role)});
                          }
                        }}
                      />
                      <span>{role}</span>
                    </label>
                  ))}
                </div>
                {formData.allowed_roles.length > 0 && (
                  <p style={{ fontSize: '12px', color: '#28a745', marginTop: '8px' }}>
                    ✓ Restricted to: {formData.allowed_roles.join(', ')}
                  </p>
                )}
                {formData.allowed_roles.length === 0 && (
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                    All roles can access this event
                  </p>
                )}
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Bazaar'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setFormData({
                    name: '',
                    location: '',
                    short_description: '',
                    start_date: '',
                    end_date: '',
                    time: '',
                    registration_deadline: '',
                    allowed_roles: []
                  })}
                  disabled={loading}
                >
                  Reset
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}
