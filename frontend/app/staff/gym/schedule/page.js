'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { gymAPI } from '@/utils/api';
import '@/app/dashboard.css';

export default function StaffGymSchedulePage() {
  const [selectedMonth, setSelectedMonth] = useState('2025-10');
  const [selectedType, setSelectedType] = useState('');
  const [sessions, setSessions] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [registering, setRegistering] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSessions();
    fetchMyRegistrations();
  }, [selectedMonth, selectedType]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split('-');
      const params = { month, year };
      if (selectedType) params.type = selectedType;
      
      const res = await gymAPI.getSchedule(params);
      setSessions(res.sessions || []);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRegistrations = async () => {
    try {
      const res = await gymAPI.getMyRegistrations();
      setMyRegistrations(res.registrations || []);
    } catch (err) {
      console.error('Failed to fetch registrations:', err);
      setMyRegistrations([]);
    }
  };

  const handleRegister = async (sessionId) => {
    setRegistering(prev => ({ ...prev, [sessionId]: true }));
    setError('');
    setSuccess('');

    try {
      await gymAPI.register(sessionId);
      setSuccess('Successfully registered for gym session!');
      fetchMyRegistrations();
      fetchSessions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register for session');
    } finally {
      setRegistering(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  const handleCancelRegistration = async (registrationId) => {
    if (!confirm('Are you sure you want to cancel your registration?')) {
      return;
    }

    try {
      await gymAPI.cancelRegistration(registrationId);
      setSuccess('Registration cancelled successfully!');
      fetchMyRegistrations();
      fetchSessions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel registration');
    }
  };

  const isRegistered = (sessionId) => {
    return myRegistrations.some(reg => 
      reg.session._id === sessionId && reg.status === 'registered'
    );
  };

  const getRegistrationId = (sessionId) => {
    const reg = myRegistrations.find(reg => 
      reg.session._id === sessionId && reg.status === 'registered'
    );
    return reg?._id;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getSessionTypeColor = (type) => {
    const colors = {
      'Yoga': '#9C27B0',
      'Pilates': '#E91E63',
      'Aerobics': '#FF5722',
      'Zumba': '#FF9800',
      'Cross Circuit': '#4CAF50',
      'Kick-Boxing': '#F44336',
      'Cardio': '#2196F3',
      'Strength': '#607D8B',
      'Trip': '#00BCD4',
      'Trips': '#00BCD4',
      'Other': '#9E9E9E'
    };
    return colors[type] || '#9E9E9E';
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">👨‍💼 Staff Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/staff">🏠 Dashboard</Link></li>
            <li><Link href="/staff/events">📅 Browse Events</Link></li>
            <li><Link href="/staff/favorites">⭐ My Favorites</Link></li>
            <li><Link href="/staff/payment-history">💰 Payment History</Link></li>
            <li><Link href="/polls-voting">📊 Vote for Vendors</Link></li>
            <li><Link href="/staff/loyalty-program">🎁 Loyalty Program</Link></li>
            <li><Link href="/staff/gym/schedule">💪 Gym Schedule</Link></li>
            <li><Link href="/staff/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Gym Schedule 🏋️</h1>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            View gym sessions and register to attend. You'll receive email notifications if a session you're registered for is cancelled or edited.
          </p>

          {error && (
            <div style={{
              padding: '1rem',
              marginBottom: '1rem',
              background: '#fee',
              color: '#dc3545',
              borderRadius: '8px',
              border: '1px solid #dc3545'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '1rem',
              marginBottom: '1rem',
              background: '#d4edda',
              color: '#155724',
              borderRadius: '8px',
              border: '1px solid #28a745'
            }}>
              ✅ {success}
            </div>
          )}

          <section className="section">
            <div className="form-row">
              <div className="form-group">
                <label>Select Month</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                />
              </div>
              <div className="form-group">
                <label>Filter by Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
                >
                  <option value="">All Types</option>
                  <option value="Yoga">Yoga</option>
                  <option value="Pilates">Pilates</option>
                  <option value="Aerobics">Aerobics</option>
                  <option value="Zumba">Zumba</option>
                  <option value="Cross Circuit">Cross Circuit</option>
                  <option value="Kick-Boxing">Kick-Boxing</option>
                  <option value="Cardio">Cardio</option>
                  <option value="Strength">Strength</option>
                  <option value="Trip">Trip</option>
                  <option value="Trips">Trips</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Session Type Legend */}
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px'}}>
              {['Yoga', 'Pilates', 'Aerobics', 'Zumba', 'Cross Circuit', 'Kick-Boxing', 'Cardio', 'Strength', 'Trips'].map(type => (
                <div key={type} style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <div style={{width: '16px', height: '16px', borderRadius: '4px', background: getSessionTypeColor(type)}}></div>
                  <span style={{fontSize: '0.9rem'}}>{type}</span>
                </div>
              ))}
            </div>

            {loading ? (
              <div className="loading" style={{marginTop: '2rem'}}>Loading sessions...</div>
            ) : (
              <div style={{marginTop: '2rem'}}>
                {sessions.length === 0 ? (
                  <div className="empty-state">
                    <p>🏋️ No gym sessions scheduled for this month</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Type</th>
                          <th>Duration</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map((session) => {
                          const registered = isRegistered(session._id);
                          const registrationId = getRegistrationId(session._id);
                          const isPast = new Date(session.date) < new Date();
                          const isCancelled = session.status === 'cancelled';
                          
                          return (
                            <tr key={session._id} style={{
                              opacity: isPast || isCancelled ? 0.6 : 1
                            }}>
                              <td>{formatDate(session.date)}</td>
                              <td>{session.time}</td>
                              <td>
                                <span style={{
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '12px',
                                  background: getSessionTypeColor(session.type),
                                  color: 'white',
                                  fontSize: '0.85rem',
                                  fontWeight: '600'
                                }}>
                                  {session.type}
                                </span>
                              </td>
                              <td>{session.duration} min</td>
                              <td>
                                {isCancelled ? (
                                  <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    background: '#dc3545',
                                    color: 'white',
                                    fontSize: '0.85rem'
                                  }}>
                                    Cancelled
                                  </span>
                                ) : registered ? (
                                  <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    background: '#28a745',
                                    color: 'white',
                                    fontSize: '0.85rem'
                                  }}>
                                    ✓ Registered
                                  </span>
                                ) : (
                                  <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    background: '#6c757d',
                                    color: 'white',
                                    fontSize: '0.85rem'
                                  }}>
                                    Available
                                  </span>
                                )}
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button
                                    onClick={() => setSelectedSession(session)}
                                    className="btn-secondary btn-sm"
                                  >
                                    Details
                                  </button>
                                  {!isPast && !isCancelled && (
                                    registered ? (
                                      <button
                                        onClick={() => handleCancelRegistration(registrationId)}
                                        className="btn-secondary btn-sm"
                                        style={{ background: '#dc3545', color: 'white' }}
                                      >
                                        Cancel
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleRegister(session._id)}
                                        disabled={registering[session._id]}
                                        className="btn-primary btn-sm"
                                      >
                                        {registering[session._id] ? 'Registering...' : 'Register'}
                                      </button>
                                    )
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
              </div>
            )}
          </section>

          {/* Session Details Modal */}
          {selectedSession && (
            <div className="modal-overlay" onClick={() => setSelectedSession(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Session Details</h2>
                  <button onClick={() => setSelectedSession(null)} className="btn-close">✕</button>
                </div>
                <div style={{padding: '1.5rem'}}>
                  <div style={{marginBottom: '1rem'}}>
                    <span style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '16px',
                      background: getSessionTypeColor(selectedSession.type),
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}>
                      {selectedSession.type}
                    </span>
                  </div>
                  
                  <div style={{display: 'grid', gap: '1rem', marginTop: '1.5rem'}}>
                    <div>
                      <strong style={{color: '#666'}}>📅 Date:</strong>
                      <p style={{margin: '0.25rem 0 0 0', fontSize: '1.1rem'}}>{formatDate(selectedSession.date)}</p>
                    </div>
                    <div>
                      <strong style={{color: '#666'}}>🕐 Time:</strong>
                      <p style={{margin: '0.25rem 0 0 0', fontSize: '1.1rem'}}>{selectedSession.time}</p>
                    </div>
                    <div>
                      <strong style={{color: '#666'}}>⏱️ Duration:</strong>
                      <p style={{margin: '0.25rem 0 0 0', fontSize: '1.1rem'}}>{selectedSession.duration} minutes</p>
                    </div>
                    <div>
                      <strong style={{color: '#666'}}>👥 Max Participants:</strong>
                      <p style={{margin: '0.25rem 0 0 0', fontSize: '1.1rem'}}>{selectedSession.maxParticipants} people</p>
                    </div>
                    {selectedSession.status === 'cancelled' && (
                      <div style={{
                        padding: '1rem',
                        background: '#fee',
                        borderRadius: '8px',
                        marginTop: '1rem',
                        border: '1px solid #dc3545'
                      }}>
                        <p style={{ margin: 0, color: '#dc3545', fontWeight: '600' }}>
                          ⚠️ This session has been cancelled
                        </p>
                      </div>
                    )}
                  </div>

                  <div style={{marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end'}}>
                    {!isRegistered(selectedSession._id) && 
                     selectedSession.status !== 'cancelled' && 
                     new Date(selectedSession.date) >= new Date() && (
                      <button 
                        onClick={() => {
                          handleRegister(selectedSession._id);
                          setSelectedSession(null);
                        }}
                        disabled={registering[selectedSession._id]}
                        className="btn-primary"
                      >
                        {registering[selectedSession._id] ? 'Registering...' : 'Register for Session'}
                      </button>
                    )}
                    {isRegistered(selectedSession._id) && (
                      <button
                        onClick={() => {
                          handleCancelRegistration(getRegistrationId(selectedSession._id));
                          setSelectedSession(null);
                        }}
                        className="btn-secondary"
                        style={{ background: '#dc3545', color: 'white' }}
                      >
                        Cancel Registration
                      </button>
                    )}
                    <button onClick={() => setSelectedSession(null)} className="btn-secondary">
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
