'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { gymAPI } from '@/utils/api';
import EventsOfficeLayout from '@/app/components/EventsOfficeLayout';

export default function CreateGymSessionPage() {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    duration: '60',
    type: 'Yoga',
    maxParticipants: '20'
  });
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [editingSession, setEditingSession] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setFetchLoading(true);
    try {
      const res = await gymAPI.getSchedule();
      setSessions(res.sessions || []);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setSessions([]);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await gymAPI.create(formData);
      setMessage({ text: 'Gym session created successfully!', type: 'success' });
      setFormData({
        date: '',
        time: '',
        duration: '60',
        type: 'Yoga',
        maxParticipants: '20'
      });
      fetchSessions();
    } catch (err) {
      setMessage({ text: err.message || 'Failed to create gym session', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (session) => {
    if (!canEditOrCancel(session)) return;
    setEditingSession(session._id);
    setEditFormData({
      date: session.date ? session.date.split('T')[0] : '',
      time: session.time || '',
      duration: session.duration || ''
    });
    setMessage({ text: '', type: '' });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingSession) return;
    setMessage({ text: '', type: '' });

    try {
      await gymAPI.edit(editingSession, editFormData);
      setMessage({ text: 'Gym session updated successfully!', type: 'success' });
      setEditingSession(null);
      setEditFormData({});
      fetchSessions();
    } catch (err) {
      setMessage({ text: err.message || 'Failed to update gym session', type: 'error' });
    }
  };

  const handleCancel = async (sessionId) => {
    if (!confirm('Are you sure you want to cancel this gym session?')) return;
    setMessage({ text: '', type: '' });

    try {
      await gymAPI.cancel(sessionId);
      setMessage({ text: 'Gym session cancelled successfully!', type: 'success' });
      fetchSessions();
    } catch (err) {
      setMessage({ text: err.message || 'Failed to cancel gym session', type: 'error' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const canEditOrCancel = (session) => {
    // Check if session is in the future and not cancelled
    const sessionDate = new Date(session.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sessionDate >= today && session.status !== 'cancelled';
  };

  return (
    <EventsOfficeLayout>
      <div className="page-header">
        <h1>Manage Gym Sessions 💪</h1>
            <Link href="/eventsoffice/gym/schedule" className="btn-primary">
              📅 View Schedule
            </Link>
          </div>

          {message.text && (
            <div className={`alert alert-${message.type}`}>
              {message.text}
            </div>
          )}

          <section className="section">
            <h2>Create New Session</h2>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Date *</label>
                  <input
                    type="date"
                    id="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="time">Time *</label>
                  <input
                    type="text"
                    id="time"
                    required
                    placeholder="e.g., 10:00 AM"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="duration">Duration (minutes) *</label>
                  <input
                    type="number"
                    id="duration"
                    min="30"
                    max="180"
                    required
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="type">Type *</label>
                  <select
                    id="type"
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="Yoga">Yoga</option>
                    <option value="Pilates">Pilates</option>
                    <option value="Aerobics">Aerobics</option>
                    <option value="Zumba">Zumba</option>
                    <option value="Cross Circuit">Cross Circuit</option>
                    <option value="Kick-Boxing">Kick-Boxing</option>
                    <option value="Cardio">Cardio</option>
                    <option value="Strength">Strength</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="maxParticipants">Max Participants *</label>
                <input
                  type="number"
                  id="maxParticipants"
                  min="1"
                  max="100"
                  required
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({...formData, maxParticipants: e.target.value})}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Session'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setFormData({
                    date: '', 
                    time: '', 
                    duration: '60', 
                    type: 'Yoga', 
                    maxParticipants: '20'
                  })}
                  disabled={loading}
                >
                  Reset
                </button>
              </div>
            </form>
          </section>

          <section className="section">
            <h2>Existing Sessions</h2>
            {fetchLoading ? (
              <div className="loading">Loading gym sessions...</div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Type</th>
                      <th>Duration</th>
                      <th>Max Participants</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="empty-row">
                          <div className="empty-state">
                            <p>🏋️ No gym sessions created yet</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      sessions.map((session) => (
                        <tr key={session._id}>
                          <td>{formatDate(session.date)}</td>
                          <td>{session.time}</td>
                          <td>{session.type}</td>
                          <td>{session.duration} min</td>
                          <td>{session.maxParticipants}</td>
                          <td>
                            <button
                              onClick={() => handleEdit(session)}
                              className="btn-secondary btn-sm"
                              disabled={!canEditOrCancel(session)}
                              title={!canEditOrCancel(session) ? 'Cannot edit past or cancelled sessions' : 'Edit session'}
                              style={{ marginRight: '0.5rem' }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleCancel(session._id)}
                              className="btn-secondary btn-sm"
                              disabled={!canEditOrCancel(session)}
                              title={!canEditOrCancel(session) ? 'Cannot cancel past or cancelled sessions' : 'Cancel session'}
                            >
                              Cancel
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {editingSession && (
            <div className="modal-overlay" onClick={() => setEditingSession(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Edit Gym Session</h2>
                  <button onClick={() => setEditingSession(null)} className="btn-close">✕</button>
                </div>
                <form onSubmit={handleUpdate} className="form">
                  <div className="form-group">
                    <label>Date *</label>
                    <input
                      type="date"
                      required
                      value={editFormData.date}
                      onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%' }}
                    />
                  </div>

                  <div className="form-group">
                    <label>Time *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., 10:00 AM"
                      value={editFormData.time}
                      onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%' }}
                    />
                  </div>

                  <div className="form-group">
                    <label>Duration (minutes) *</label>
                    <input
                      type="number"
                      required
                      min="30"
                      max="180"
                      value={editFormData.duration}
                      onChange={(e) => setEditFormData({ ...editFormData, duration: e.target.value })}
                      style={{ padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%' }}
                    />
                  </div>

                  <div className="form-actions">
                    <button type="button" onClick={() => setEditingSession(null)} className="btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
    </EventsOfficeLayout>
  );
}
