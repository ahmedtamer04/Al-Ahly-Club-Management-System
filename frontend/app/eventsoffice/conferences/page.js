'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { conferenceAPI } from '@/utils/api';
import '@/app/dashboard.css';

export default function ConferencesPage() {
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingConference, setEditingConference] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchConferences();
  }, []);

  const fetchConferences = async () => {
    setLoading(true);
    try {
      const response = await conferenceAPI.getMyConferences();
      // Backend returns array directly, not wrapped in an object
      setConferences(Array.isArray(response) ? response : []);
    } catch (err) {
      setError(err.message || 'Failed to load conferences');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (conference) => {
    setEditingConference(conference._id);
    setEditFormData({
      name: conference.name,
      location: conference.location,
      short_description: conference.short_description,
      start_date: conference.start_date?.split('T')[0] || '',
      end_date: conference.end_date?.split('T')[0] || '',
      time: conference.time,
      campus: conference.conference?.campus || '',
      professors_participating: conference.conference?.professors_participating || '',
      full_agenda: conference.conference?.full_agenda || '',
      conference_website: conference.conference?.conference_website || '',
      required_budget: conference.conference?.required_budget || 0,
      funding_source: conference.conference?.funding_source || '',
      extra_required_sources: conference.conference?.extra_required_sources || ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    
    try {
      await conferenceAPI.edit(editingConference, editFormData);
      setMessage({ text: 'Conference updated successfully!', type: 'success' });
      setEditingConference(null);
      fetchConferences();
    } catch (err) {
      setMessage({ text: err.message || 'Failed to update conference', type: 'error' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading conferences...</div>
      </div>
    );
  }

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
            <li><Link href="/eventsoffice/conferences" className="active">🎓 Conferences</Link></li>
            <li><Link href="/eventsoffice/conferences/create">➕ Create Conference</Link></li>
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
          <div className="page-header">
            <h1>Conferences 🎓</h1>
            <Link href="/eventsoffice/conferences/create" className="btn-primary">
              ➕ Create Conference
            </Link>
          </div>

          {message.text && (
            <div className={`alert alert-${message.type}`}>
              {message.text}
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <section className="section">
            {conferences.length === 0 ? (
              <div className="empty-state">
                <p>🎓 No conferences created yet</p>
                <Link href="/eventsoffice/conferences/create" className="btn-primary">
                  Create First Conference
                </Link>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Conference Name</th>
                      <th>Campus</th>
                      <th>Date</th>
                      <th>Budget</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conferences.map((conference) => (
                      <tr key={conference._id}>
                        <td>
                          <strong>{conference.name}</strong>
                          <br />
                          <small style={{ color: '#666' }}>
                            {conference.short_description?.substring(0, 50)}...
                          </small>
                        </td>
                        <td>{conference.conference?.campus || 'N/A'}</td>
                        <td>
                          {formatDate(conference.start_date)}
                          {conference.start_date !== conference.end_date && (
                            <> - {formatDate(conference.end_date)}</>
                          )}
                          <br />
                          <small>{conference.time}</small>
                        </td>
                        <td>${conference.conference?.required_budget || 0}</td>
                        <td>
                          <span className={`status-badge status-${conference.status}`}>
                            {conference.status}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleEdit(conference)}
                            className="btn-icon"
                            title="Edit"
                          >
                            ✏️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Edit Modal */}
          {editingConference && (
            <div className="modal-overlay" onClick={() => setEditingConference(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Edit Conference</h2>
                  <button onClick={() => setEditingConference(null)} className="btn-close">
                    ✕
                  </button>
                </div>
                <form onSubmit={handleUpdate} className="form">
                  <div className="form-group">
                    <label>Conference Name *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Location *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.location}
                        onChange={(e) => setEditFormData({...editFormData, location: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Campus *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.campus}
                        onChange={(e) => setEditFormData({...editFormData, campus: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Short Description *</label>
                    <textarea
                      rows="3"
                      required
                      value={editFormData.short_description}
                      onChange={(e) => setEditFormData({...editFormData, short_description: e.target.value})}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Date *</label>
                      <input
                        type="date"
                        required
                        value={editFormData.start_date}
                        onChange={(e) => setEditFormData({...editFormData, start_date: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>End Date *</label>
                      <input
                        type="date"
                        required
                        value={editFormData.end_date}
                        onChange={(e) => setEditFormData({...editFormData, end_date: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Time *</label>
                      <input
                        type="time"
                        required
                        value={editFormData.time}
                        onChange={(e) => setEditFormData({...editFormData, time: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" onClick={() => setEditingConference(null)} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Update Conference
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
