'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { conferenceAPI, eventAPI } from '@/utils/api';
import EventsOfficeLayout from '@/app/components/EventsOfficeLayout';
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

  const canEdit = (conference) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(conference.start_date);
    startDate.setHours(0, 0, 0, 0);
    return startDate >= today;
  };

  const canDelete = (conference) => {
    return !conference.registrations || conference.registrations.length === 0;
  };

  const availableRoles = ['Student', 'Staff', 'TA', 'Professor'];

  const handleEdit = (conference) => {
    if (!canEdit(conference)) {
      setMessage({ text: 'Cannot edit a conference that has already started', type: 'error' });
      return;
    }
    
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
      extra_required_sources: conference.conference?.extra_required_sources || '',
      allowed_roles: Array.isArray(conference.allowed_roles) ? conference.allowed_roles : [],
    });
  };

  const handleDelete = async (conference) => {
    if (!canDelete(conference)) {
      setMessage({ text: 'Cannot delete: Conference has registrations', type: 'error' });
      return;
    }

    if (!confirm(`Are you sure you want to delete "${conference.name}"?`)) {
      return;
    }

    try {
      await eventAPI.delete(conference._id);
      setMessage({ text: 'Conference deleted successfully!', type: 'success' });
      fetchConferences();
    } catch (err) {
      setMessage({ text: err.message || 'Failed to delete conference', type: 'error' });
    }
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
      <EventsOfficeLayout>
        <div className="loading">Loading conferences...</div>
      </EventsOfficeLayout>
    );
  }

  return (
    <EventsOfficeLayout>
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
                      <th>Website</th>
                      <th>Budget</th>
                      <th>Restrictions</th>
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
                        <td>
                          {conference.conference?.conference_website ? (
                            <a 
                              href={conference.conference.conference_website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ color: '#007bff', textDecoration: 'none' }}
                            >
                              🔗 Visit Site
                            </a>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td>${conference.conference?.required_budget || 0}</td>
                        <td>
                          {Array.isArray(conference.allowed_roles) && conference.allowed_roles.length > 0 ? (
                            <span style={{ 
                              fontSize: '11px', 
                              padding: '4px 8px', 
                              backgroundColor: '#fff3cd', 
                              color: '#856404',
                              borderRadius: '4px',
                              display: 'inline-block'
                            }} title={`Restricted to: ${conference.allowed_roles.join(', ')}`}>
                              🔒 {conference.allowed_roles.length} role{conference.allowed_roles.length > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#6c757d' }}>All roles</span>
                          )}
                        </td>
                        <td>
                          <span className={`status-badge status-${conference.status}`}>
                            {conference.status}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleEdit(conference)}
                            className="btn-secondary"
                            title={canEdit(conference) ? "Edit" : "Cannot edit past conferences"}
                            disabled={!canEdit(conference)}
                            style={{ 
                              marginRight: '5px',
                              padding: '5px 10px',
                              fontSize: '12px',
                              minWidth: '70px'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(conference)}
                            className="btn-secondary"
                            title={canDelete(conference) ? "Delete" : "Cannot delete: has registrations"}
                            disabled={!canDelete(conference)}
                            style={{
                              backgroundColor: canDelete(conference) ? '#dc3545' : '#6c757d',
                              borderColor: canDelete(conference) ? '#dc3545' : '#6c757d',
                              color: '#fff',
                              padding: '5px 10px',
                              fontSize: '12px',
                              minWidth: '70px'
                            }}
                          >
                            Delete
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

                  <div className="form-group">
                    <label>Full Agenda *</label>
                    <textarea
                      rows="5"
                      required
                      value={editFormData.full_agenda}
                      onChange={(e) => setEditFormData({...editFormData, full_agenda: e.target.value})}
                      placeholder="Detailed agenda for the conference"
                    />
                  </div>

                  <div className="form-group">
                    <label>Participating Professors *</label>
                    <textarea
                      rows="3"
                      required
                      value={editFormData.professors_participating}
                      onChange={(e) => setEditFormData({...editFormData, professors_participating: e.target.value})}
                      placeholder="List of professors participating"
                    />
                  </div>

                  <div className="form-group">
                    <label>Conference Website *</label>
                    <input
                      type="url"
                      required
                      value={editFormData.conference_website}
                      onChange={(e) => setEditFormData({...editFormData, conference_website: e.target.value})}
                      placeholder="https://conference-website.com"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Required Budget *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={editFormData.required_budget}
                        onChange={(e) => setEditFormData({...editFormData, required_budget: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Funding Source *</label>
                      <select
                        required
                        value={editFormData.funding_source}
                        onChange={(e) => setEditFormData({...editFormData, funding_source: e.target.value})}
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
                      value={editFormData.extra_required_sources}
                      onChange={(e) => setEditFormData({...editFormData, extra_required_sources: e.target.value})}
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
                            checked={editFormData.allowed_roles?.includes(role) || false}
                            onChange={(e) => {
                              const currentRoles = editFormData.allowed_roles || [];
                              if (e.target.checked) {
                                setEditFormData({...editFormData, allowed_roles: [...currentRoles, role]});
                              } else {
                                setEditFormData({...editFormData, allowed_roles: currentRoles.filter(r => r !== role)});
                              }
                            }}
                          />
                          <span>{role}</span>
                        </label>
                      ))}
                    </div>
                    {editFormData.allowed_roles?.length > 0 && (
                      <p style={{ fontSize: '12px', color: '#28a745', marginTop: '8px' }}>
                        ✓ Restricted to: {editFormData.allowed_roles.join(', ')}
                      </p>
                    )}
                    {(!editFormData.allowed_roles || editFormData.allowed_roles.length === 0) && (
                      <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                        All roles can access this event
                      </p>
                    )}
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
    </EventsOfficeLayout>
  );
}
