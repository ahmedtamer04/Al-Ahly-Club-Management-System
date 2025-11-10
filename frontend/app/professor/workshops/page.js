'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { workshopAPI } from '@/utils/api';
import NotificationBell from '@/app/components/NotificationBell';
import '@/app/dashboard.css';

export default function MyWorkshopsPage() {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingWorkshop, setEditingWorkshop] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const fetchWorkshops = async () => {
    setLoading(true);
    try {
      const response = await workshopAPI.getMyWorkshops();
      setWorkshops(response.workshops || []);
    } catch (err) {
      setError(err.message || 'Failed to load workshops');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (workshop) => {
    setEditingWorkshop(workshop._id);
    setEditFormData({
      name: workshop.name || '',
      location: workshop.location || '',
      short_description: workshop.short_description || '',
      start_date: workshop.start_date?.split('T')[0] || '',
      end_date: workshop.end_date?.split('T')[0] || '',
      time: workshop.time || '',
      full_agenda: workshop.workshop?.full_agenda || '',
      faculty_responsible: workshop.workshop?.faculty_responsible || '',
      professors_participating: workshop.workshop?.professors_participating || '',
      required_budget: workshop.workshop?.required_budget || 0,
      funding_source: workshop.workshop?.funding_source || '',
      extra_resources: workshop.workshop?.extra_resources || '',
      capacity: workshop.workshop?.capacity || 30,
      registration_deadline: workshop.workshop?.registration_deadline?.split('T')[0] || ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    
    try {
      await workshopAPI.edit(editingWorkshop, editFormData);
      setMessage({ text: 'Workshop updated successfully!', type: 'success' });
      setEditingWorkshop(null);
      fetchWorkshops();
    } catch (err) {
      setMessage({ text: err.message || 'Failed to update workshop', type: 'error' });
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

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <NotificationBell />
            <span className="nav-user">👨‍🏫 Professor Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/professor">🏠 Dashboard</Link></li>
            <li><Link href="/professor/events">📅 Events</Link></li>
            <li><Link href="/professor/workshops" className="active">🎨 My Workshops</Link></li>
            <li><Link href="/professor/gym">💪 Gym Schedule</Link></li>
            <li><Link href="/professor/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <div className="page-header">
            <h1>My Workshops 🎨</h1>
            <Link href="/professor/workshops/create" className="btn-primary">
              ➕ Create Workshop
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
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading workshops...</p>
              </div>
            ) : workshops.length === 0 ? (
              <div className="empty-state">
                <p>🎨 You haven't created any workshops yet</p>
                <Link href="/professor/workshops/create" className="btn-primary">
                  Create Your First Workshop
                </Link>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Workshop Name</th>
                      <th>Location</th>
                      <th>Date</th>
                      <th>Capacity</th>
                      <th>Approval Status</th>
                      <th>Event Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workshops.map((workshop) => {
                      const approvalStatus = workshop.workshop?.approval_status || 'pending';
                      const approvalBadgeColors = {
                        pending: '#ffc107',
                        accepted: '#28a745',
                        rejected: '#dc3545',
                        revision_requested: '#ff9800'
                      };
                      
                      return (
                        <tr key={workshop._id}>
                          <td>
                            <strong>{workshop.name}</strong>
                            <br />
                            <small style={{ color: '#666' }}>
                              {workshop.short_description?.substring(0, 50)}...
                            </small>
                            {workshop.workshop?.requested_edits && (
                              <>
                                <br />
                                <small style={{ color: '#ff9800', fontWeight: 'bold' }}>
                                  ✏️ Edits Requested: {workshop.workshop.requested_edits}
                                </small>
                              </>
                            )}
                            {workshop.workshop?.rejection_reason && (
                              <>
                                <br />
                                <small style={{ color: '#dc3545', fontWeight: 'bold' }}>
                                  ❌ Rejected: {workshop.workshop.rejection_reason}
                                </small>
                              </>
                            )}
                          </td>
                          <td>{workshop.location}</td>
                          <td>
                            {formatDate(workshop.start_date)}
                            {workshop.start_date !== workshop.end_date && (
                              <> - {formatDate(workshop.end_date)}</>
                            )}
                            <br />
                            <small>{workshop.time}</small>
                          </td>
                          <td>{workshop.workshop?.capacity || 'N/A'}</td>
                          <td>
                            <span 
                              className="status-badge" 
                              style={{ backgroundColor: approvalBadgeColors[approvalStatus], color: 'white' }}
                            >
                              {approvalStatus.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge status-${workshop.status}`}>
                              {workshop.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {approvalStatus === 'accepted' && (
                                <Link
                                  href={`/professor/workshops/${workshop._id}/participants`}
                                  className="btn-icon"
                                  title="View Participants"
                                >
                                  👥
                                </Link>
                              )}
                              {(approvalStatus === 'pending' || approvalStatus === 'revision_requested') && (
                                <button
                                  onClick={() => handleEdit(workshop)}
                                  className="btn-icon"
                                  title="Edit"
                                >
                                  ✏️
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Edit Modal */}
          {editingWorkshop && (
            <div className="modal-overlay" onClick={() => setEditingWorkshop(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Edit Workshop</h2>
                  <button onClick={() => setEditingWorkshop(null)} className="btn-close">
                    ✕
                  </button>
                </div>
                <form onSubmit={handleUpdate} className="form">
                  <div className="form-group">
                    <label>Workshop Name *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Short Description *</label>
                    <textarea
                      required
                      rows="3"
                      value={editFormData.short_description}
                      onChange={(e) => setEditFormData({...editFormData, short_description: e.target.value})}
                      placeholder="Brief overview of the workshop"
                    />
                  </div>

                  <div className="form-group">
                    <label>Full Agenda *</label>
                    <textarea
                      required
                      rows="4"
                      value={editFormData.full_agenda}
                      onChange={(e) => setEditFormData({...editFormData, full_agenda: e.target.value})}
                      placeholder="Detailed workshop schedule and content"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Location *</label>
                      <select
                        required
                        value={editFormData.location}
                        onChange={(e) => setEditFormData({...editFormData, location: e.target.value})}
                      >
                        <option value="">Select Location</option>
                        <option value="GUC Berlin">GUC Berlin</option>
                        <option value="GUC Cairo">GUC Cairo</option>
                      </select>
                    </div>
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

                  <div className="form-row">
                    <div className="form-group">
                      <label>Faculty Responsible *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.faculty_responsible}
                        onChange={(e) => setEditFormData({...editFormData, faculty_responsible: e.target.value})}
                        placeholder="e.g., Faculty of Engineering"
                      />
                    </div>
                    <div className="form-group">
                      <label>Professors Participating *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.professors_participating}
                        onChange={(e) => setEditFormData({...editFormData, professors_participating: e.target.value})}
                        placeholder="e.g., Dr. Ahmed, Dr. Sara"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Required Budget *</label>
                      <input
                        type="number"
                        required
                        min="0"
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
                    <div className="form-group">
                      <label>Capacity *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={editFormData.capacity}
                        onChange={(e) => setEditFormData({...editFormData, capacity: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Extra Resources</label>
                      <textarea
                        rows="2"
                        value={editFormData.extra_resources}
                        onChange={(e) => setEditFormData({...editFormData, extra_resources: e.target.value})}
                        placeholder="Any additional resources needed"
                      />
                    </div>
                    <div className="form-group">
                      <label>Registration Deadline *</label>
                      <input
                        type="date"
                        required
                        value={editFormData.registration_deadline}
                        onChange={(e) => setEditFormData({...editFormData, registration_deadline: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" onClick={() => setEditingWorkshop(null)} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Update Workshop
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
