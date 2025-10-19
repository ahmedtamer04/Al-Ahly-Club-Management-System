'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { gymAPI } from '@/utils/api';
import '@/app/dashboard.css';

export default function GymSchedulePage() {
  const [selectedMonth, setSelectedMonth] = useState('2025-10');
  const [selectedDay, setSelectedDay] = useState(null);
  const [gymSessions, setGymSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGymSchedule();
  }, [selectedMonth]);

  const fetchGymSchedule = async () => {
    try {
      setLoading(true);
      setError('');
      const [year, month] = selectedMonth.split('-');
      const response = await gymAPI.getSchedule({ month, year });
      console.log('Gym sessions response:', response);
      
      // Handle the backend response format: { message, count, sessions }
      if (response && response.sessions) {
        setGymSessions(Array.isArray(response.sessions) ? response.sessions : []);
      } else if (Array.isArray(response)) {
        setGymSessions(response);
      } else {
        setGymSessions([]);
      }
    } catch (err) {
      console.error('Error fetching gym sessions:', err);
      // Handle 404 as empty result, not error
      if (err.message?.includes('No gym sessions found')) {
        setGymSessions([]);
        setError('');
      } else {
        setError(err.message || 'Failed to load gym sessions');
        setGymSessions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">👨‍🎓 Student Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/student">🏠 Dashboard</Link></li>
            <li><Link href="/student/events">📅 Browse Events</Link></li>
            <li><Link href="/student/my-registrations">🎫 My Registrations</Link></li>
            <li><Link href="/student/gym/schedule">🏋️ Gym Schedule</Link></li>
            <li><Link href="/student/facilities">🏟️ Facilities</Link></li>
            <li><Link href="/student/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Gym Schedule 🏋️</h1>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <section className="section">
            <div className="form-group" style={{maxWidth: '300px'}}>
              <label>Select Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%'}}
              />
            </div>

            <div style={{marginTop: '2rem'}}>
              <h3>Available Sessions</h3>
              {loading ? (
                <div className="loading" style={{marginTop: '1rem'}}>
                  Loading gym sessions...
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Duration</th>
                        <th>Type</th>
                        <th>Capacity</th>
                        <th>Participants</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gymSessions.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="empty-row">
                            <div className="empty-state">
                              <p>🏋️ No gym sessions scheduled for this month</p>
                              <p style={{fontSize: '0.9rem', color: '#999'}}>
                                Check back later or try a different month
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        gymSessions.map((session) => (
                          <tr key={session._id}>
                            <td>{formatDate(session.date)}</td>
                            <td>{formatTime(session.time)}</td>
                            <td>{session.duration || 'N/A'}</td>
                            <td>
                              <span className="badge badge-primary">
                                {session.type || 'General'}
                              </span>
                            </td>
                            <td>{session.maxParticipants || 'Unlimited'}</td>
                            <td>
                              {session.participants?.length || 0}
                              {session.maxParticipants && `/${session.maxParticipants}`}
                            </td>
                            <td>
                              <span className={`badge ${
                                session.status === 'scheduled' ? 'badge-success' : 
                                session.status === 'cancelled' ? 'badge-secondary' : 
                                session.status === 'completed' ? 'badge-info' : 'badge-warning'
                              }`}>
                                {session.status === 'scheduled' ? '✅ Available' :
                                 session.status === 'cancelled' ? '❌ Cancelled' :
                                 session.status === 'completed' ? '✔️ Completed' : 
                                 '⏳ ' + (session.status || 'Unknown')}
                              </span>
                            </td>
                            <td>
                              {session.status === 'scheduled' && (
                                session.maxParticipants && 
                                (session.participants?.length || 0) >= session.maxParticipants ? (
                                  <span style={{color: '#dc3545', fontSize: '0.8rem'}}>
                                    Full
                                  </span>
                                ) : (
                                  <button 
                                    className="btn-primary btn-sm"
                                    onClick={() => setSelectedDay(session)}
                                  >
                                    Join
                                  </button>
                                )
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* Session Statistics */}
          {gymSessions.length > 0 && (
            <section className="section">
              <h2>Monthly Overview</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📅</div>
                  <div className="stat-info">
                    <h3>{gymSessions.length}</h3>
                    <p>Total Sessions</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-info">
                    <h3>{gymSessions.filter(s => s.status === 'scheduled').length}</h3>
                    <p>Available</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-info">
                    <h3>{gymSessions.reduce((total, s) => total + (s.participants?.length || 0), 0)}</h3>
                    <p>Total Participants</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🏋️</div>
                  <div className="stat-info">
                    <h3>{new Set(gymSessions.map(s => s.type)).size}</h3>
                    <p>Session Types</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Selected Session Details */}
          {selectedDay && (
            <section className="section">
              <h2>Session Details</h2>
              <div className="admin-card" style={{maxWidth: '600px'}}>
                <div className="admin-card-header">
                  <h3>{selectedDay.type || 'Gym Session'}</h3>
                  <span className={`badge ${selectedDay.status === 'scheduled' ? 'badge-success' : 'badge-secondary'}`}>
                    {selectedDay.status}
                  </span>
                </div>
                <div className="admin-card-content">
                  <div className="detail-item">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">{formatDate(selectedDay.date)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Time:</span>
                    <span className="detail-value">{formatTime(selectedDay.time)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">{selectedDay.duration || 'Not specified'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Capacity:</span>
                    <span className="detail-value">
                      {selectedDay.participants?.length || 0}
                      {selectedDay.maxParticipants && ` / ${selectedDay.maxParticipants}`} participants
                    </span>
                  </div>
                  {selectedDay.description && (
                    <div className="detail-item">
                      <span className="detail-label">Description:</span>
                      <span className="detail-value">{selectedDay.description}</span>
                    </div>
                  )}
                  {selectedDay.instructor && (
                    <div className="detail-item">
                      <span className="detail-label">Instructor:</span>
                      <span className="detail-value">{selectedDay.instructor}</span>
                    </div>
                  )}
                </div>
                <div className="form-actions" style={{marginTop: '1rem'}}>
                  <button 
                    onClick={() => setSelectedDay(null)}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                  {selectedDay.status === 'scheduled' && (
                    <button className="btn-primary">
                      Register for Session
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      <style jsx>{`
        .loading {
          text-align: center;
          padding: 2rem;
          color: #666;
          font-style: italic;
        }

        .alert {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .alert-error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        .badge-primary {
          background-color: #007bff;
          color: white;
        }

        .badge-success {
          background-color: #28a745;
          color: white;
        }

        .badge-secondary {
          background-color: #6c757d;
          color: white;
        }

        .badge-info {
          background-color: #17a2b8;
          color: white;
        }

        .badge-warning {
          background-color: #ffc107;
          color: #212529;
        }

        .btn-sm {
          padding: 0.25rem 0.5rem;
          font-size: 0.8rem;
          border-radius: 4px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          border: 2px solid #f0f0f0;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-icon {
          font-size: 2.5rem;
          opacity: 0.8;
        }

        .stat-info h3 {
          margin: 0;
          font-size: 1.8rem;
          font-weight: 700;
          color: #333;
        }

        .stat-info p {
          margin: 0.25rem 0 0 0;
          color: #666;
          font-size: 0.9rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #f0f0f0;
        }

        .detail-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .detail-label {
          font-weight: 600;
          color: #333;
          min-width: 120px;
        }

        .detail-value {
          color: #666;
          text-align: right;
        }
      `}</style>
    </div>
  );
}
