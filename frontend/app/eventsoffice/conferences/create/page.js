'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { conferenceAPI } from '@/utils/api';
import '@/app/dashboard.css';

export default function CreateConferencePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    short_description: '',
    start_date: '',
    end_date: '',
    time: '',
    campus: '',
    professors_participating: '',
    full_agenda: '',
    conference_website: '',
    required_budget: 0,
    funding_source: '',
    extra_required_sources: '',
    allowed_roles: [], // Array of allowed roles
  });
  
  const availableRoles = ['Student', 'Staff', 'TA', 'Professor'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setLoading(true);

    try {
      await conferenceAPI.create(formData);
      setMessage({ text: 'Conference created successfully!', type: 'success' });
      setTimeout(() => {
        router.push('/eventsoffice/conferences');
      }, 1500);
    } catch (err) {
      setMessage({ text: err.message || 'Failed to create conference', type: 'error' });
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
            <span className="nav-user">🎯 Events Office Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/eventsoffice">🏠 Dashboard</Link></li>
            <li><Link href="/eventsoffice/conferences">🎓 Conferences</Link></li>
            <li><Link href="/eventsoffice/conferences/create" className="active">➕ Create Conference</Link></li>
            <li><Link href="/eventsoffice/trips">✈️ Trips</Link></li>
            <li><Link href="/eventsoffice/bazaars">🛍️ Bazaars</Link></li>
            <li><Link href="/eventsoffice/gym">💪 Gym Sessions</Link></li>
            <li><Link href="/eventsoffice/facilities">🏛️ Facilities</Link></li>
            <li><Link href="/eventsoffice/vendors">👥 Vendor Requests</Link></li>
            <li><Link href="/eventsoffice/registrations">📋 Registrations</Link></li>
            <li><Link href="/eventsoffice/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Create New Conference 🎓</h1>

          {message.text && (
            <div className={`alert alert-${message.type}`}>
              {message.text}
            </div>
          )}

          <section className="section">
            <form onSubmit={handleSubmit} className="settings-form">
              <div className="form-group">
                <label>Conference Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., AI in Education Conference 2025"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g., Main Auditorium"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Campus *</label>
                  <select
                    value={formData.campus}
                    onChange={(e) => setFormData({...formData, campus: e.target.value})}
                    required
                  >
                    <option value="">Select Campus</option>
                    <option value="GUC">GUC</option>
                    <option value="GUC Berlin">GUC Berlin</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Short Description *</label>
                <textarea
                  rows="3"
                  value={formData.short_description}
                  onChange={(e) => setFormData({...formData, short_description: e.target.value})}
                  placeholder="Brief description of the conference"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Time *</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Full Agenda *</label>
                <textarea
                  rows="5"
                  value={formData.full_agenda}
                  onChange={(e) => setFormData({...formData, full_agenda: e.target.value})}
                  placeholder="Detailed agenda for the conference"
                  required
                />
              </div>

              <div className="form-group">
                <label>Participating Professors *</label>
                <textarea
                  rows="3"
                  value={formData.professors_participating}
                  onChange={(e) => setFormData({...formData, professors_participating: e.target.value})}
                  placeholder="List of professors participating (one per line or comma-separated)"
                  required
                />
              </div>

              <div className="form-group">
                <label>Conference Website *</label>
                <input
                  type="url"
                  value={formData.conference_website}
                  onChange={(e) => setFormData({...formData, conference_website: e.target.value})}
                  placeholder="https://conference-website.com"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Required Budget *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.required_budget}
                    onChange={(e) => setFormData({...formData, required_budget: e.target.value})}
                    placeholder="e.g., 50000"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Funding Source *</label>
                  <select
                    value={formData.funding_source}
                    onChange={(e) => setFormData({...formData, funding_source: e.target.value})}
                    required
                  >
                    <option value="">Select Funding Source</option>
                    <option value="GUC">GUC</option>
                    <option value="EXTERNAL">External</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Extra Required Resources</label>
                <textarea
                  rows="3"
                  value={formData.extra_required_sources}
                  onChange={(e) => setFormData({...formData, extra_required_sources: e.target.value})}
                  placeholder="Any additional resources needed (optional)"
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
                <Link href="/eventsoffice/conferences" className="btn-secondary">
                  Cancel
                </Link>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Conference'}
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}
