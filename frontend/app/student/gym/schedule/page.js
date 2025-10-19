'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { gymAPI } from '@/utils/api';
import '@/app/dashboard.css';

export default function GymSchedulePage() {
  const [selectedMonth, setSelectedMonth] = useState('2025-10');
  const [selectedType, setSelectedType] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    fetchSessions();
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
      'Other': '#9E9E9E'
    };
    return colors[type] || '#9E9E9E';
  };

  const groupSessionsByDate = () => {
    const grouped = {};
    sessions.forEach(session => {
      const dateKey = new Date(session.date).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(session);
    });
    return grouped;
  };

  const getDaysInMonth = () => {
    const [year, month] = selectedMonth.split('-');
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = () => {
    const [year, month] = selectedMonth.split('-');
    return new Date(year, month - 1, 1).getDay();
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
            <li><Link href="/student/facilities">🏢 Facilities</Link></li>
            <li><Link href="/student/gym/schedule">💪 Gym Schedule</Link></li>
            <li><Link href="/student/trips">🚌 Trips</Link></li>
            <li><Link href="/student/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Gym Schedule 🏋️</h1>

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
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Session Type Legend */}
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px'}}>
              {['Yoga', 'Pilates', 'Aerobics', 'Zumba', 'Cross Circuit', 'Kick-Boxing', 'Cardio', 'Strength'].map(type => (
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
                          <th>Max Participants</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map((session) => (
                          <tr key={session._id}>
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
                            <td>{session.maxParticipants}</td>
                            <td>
                              <button
                                onClick={() => setSelectedSession(session)}
                                className="btn-secondary btn-sm"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
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
                  </div>

                  <div style={{marginTop: '2rem', textAlign: 'right'}}>
                    <button onClick={() => setSelectedSession(null)} className="btn-primary">
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
