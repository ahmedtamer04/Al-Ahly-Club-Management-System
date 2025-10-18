'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import '@/app/dashboard.css';

export default function TAGymPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    loadGymSchedule();
  }, []);

  const loadGymSchedule = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/gym-sessions/schedule', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          setSessions([]);
          setError(null);
          setLoading(false);
          return;
        }
        throw new Error('Failed to fetch gym schedule');
      }

      const data = await response.json();
      const sessionsData = data.sessions || data || [];
      setSessions(sessionsData);
      setError(null);
    } catch (err) {
      console.error('Error loading gym schedule:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const formatTime = (time) => {
    return time;
  };

  const getSessionIcon = (type) => {
    const icons = {
      'Yoga': '🧘',
      'Pilates': '🤸',
      'Aerobics': '💃',
      'Zumba': '🕺',
      'Cross Circuit': '🏋️',
      'Kick-Boxing': '🥊',
      'Cardio': '❤️',
      'Strength': '💪',
      'Other': '🏃'
    };
    return icons[type] || '💪';
  };

  const getSessionColor = (type) => {
    const colors = {
      'Yoga': '#9b59b6',
      'Pilates': '#3498db',
      'Aerobics': '#e74c3c',
      'Zumba': '#f39c12',
      'Cross Circuit': '#2ecc71',
      'Kick-Boxing': '#e67e22',
      'Cardio': '#e74c3c',
      'Strength': '#34495e',
      'Other': '#95a5a6'
    };
    return colors[type] || '#95a5a6';
  };

  const groupSessionsByMonth = () => {
    const grouped = {};
    sessions.forEach(session => {
      const date = new Date(session.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          monthName: monthName,
          sessions: []
        };
      }
      grouped[monthKey].sessions.push(session);
    });
    
    // Sort sessions within each month by date and time
    Object.keys(grouped).forEach(key => {
      grouped[key].sessions.sort((a, b) => {
        const dateCompare = new Date(a.date) - new Date(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });
    });
    
    return grouped;
  };

  const groupedSessions = groupSessionsByMonth();

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">👨‍🏫 TA Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/ta">🏠 Dashboard</Link></li>
            <li><Link href="/ta/events">📅 Browse Events</Link></li>
            <li><Link href="/ta/favorites">⭐ My Favorites</Link></li>
            <li><Link href="/ta/my-events">✏️ My Events</Link></li>
            <li><Link href="/ta/gym">💪 Gym Schedule</Link></li>
            <li><Link href="/ta/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1 style={{ margin: 0 }}>Gym Schedule 💪</h1>
            <span style={{ color: '#666', fontSize: '0.95rem' }}>
              {sessions.length} session(s) scheduled
            </span>
          </div>

          {loading && <p>Loading gym schedule...</p>}

          {error && (
            <div style={{ color: 'red', padding: '1rem', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>
              ⚠️ Error: {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {sessions.length === 0 ? (
                <div className="empty-state">
                  <p>No gym sessions scheduled at the moment.</p>
                </div>
              ) : (
                <div>
                  {Object.keys(groupedSessions).sort().map(monthKey => (
                    <div key={monthKey} style={{ marginBottom: '2.5rem' }}>
                      {/* Month Header - Compact & Professional */}
                      <div style={{
                        borderLeft: '4px solid #ffc107',
                        paddingLeft: '1rem',
                        marginBottom: '1rem'
                      }}>
                        <h2 style={{ 
                          margin: 0,
                          fontSize: '1.2rem',
                          fontWeight: '600',
                          color: '#333'
                        }}>
                          {groupedSessions[monthKey].monthName}
                        </h2>
                        <p style={{ 
                          margin: '0.25rem 0 0 0', 
                          fontSize: '0.85rem',
                          color: '#666'
                        }}>
                          {groupedSessions[monthKey].sessions.length} sessions
                        </p>
                      </div>
                      
                      {/* Sessions Grid - Compact Cards */}
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                        gap: '0.75rem' 
                      }}>
                        {groupedSessions[monthKey].sessions.map(session => (
                          <div
                            key={session._id}
                            style={{
                              backgroundColor: '#fff',
                              borderLeft: `3px solid ${getSessionColor(session.type)}`,
                              borderRadius: '6px',
                              padding: '0.875rem',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              opacity: session.status === 'cancelled' ? 0.5 : 1
                            }}
                            onClick={() => setSelectedSession(session)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.12)';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            {/* Session Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.25rem' }}>
                                  {getSessionIcon(session.type)}
                                </span>
                                <h3 style={{ 
                                  margin: 0, 
                                  color: getSessionColor(session.type),
                                  fontSize: '0.95rem',
                                  fontWeight: '600'
                                }}>
                                  {session.type}
                                </h3>
                              </div>
                              
                              {session.status === 'cancelled' && (
                                <span style={{ 
                                  backgroundColor: '#e74c3c', 
                                  color: 'white', 
                                  padding: '0.125rem 0.375rem',
                                  borderRadius: '3px',
                                  fontSize: '0.65rem',
                                  fontWeight: '600',
                                  textTransform: 'uppercase'
                                }}>
                                  Cancelled
                                </span>
                              )}
                              
                              {session.status === 'scheduled' && (
                                <span style={{ 
                                  backgroundColor: '#27ae60', 
                                  color: 'white', 
                                  padding: '0.125rem 0.375rem',
                                  borderRadius: '3px',
                                  fontSize: '0.65rem',
                                  fontWeight: '600'
                                }}>
                                  Open
                                </span>
                              )}
                            </div>
                            
                            {/* Session Details - Compact */}
                            <div style={{ fontSize: '0.85rem', color: '#555', lineHeight: '1.6' }}>
                              <div style={{ marginBottom: '0.25rem' }}>
                                <strong>📅</strong> {formatDate(session.date)}
                              </div>
                              <div style={{ marginBottom: '0.25rem' }}>
                                <strong>⏰</strong> {formatTime(session.time)} • {session.duration}min
                              </div>
                              <div>
                                <strong>👥</strong> Max {session.maxParticipants}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Session Details Modal */}
      {selectedSession && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedSession(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%',
              color: '#333',
              borderTop: `4px solid ${getSessionColor(selectedSession.type)}`
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '3rem' }}>
                {getSessionIcon(selectedSession.type)}
              </span>
            </div>
            
            <h2 style={{ color: getSessionColor(selectedSession.type), textAlign: 'center', margin: '0 0 1rem 0' }}>
              {selectedSession.type}
            </h2>

            {selectedSession.status === 'cancelled' && (
              <div style={{ 
                backgroundColor: '#ffe6e6', 
                color: '#e74c3c', 
                padding: '0.75rem', 
                borderRadius: '4px',
                textAlign: 'center',
                fontWeight: 'bold',
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}>
                ⚠️ This session has been cancelled
              </div>
            )}
            
            <div style={{ marginTop: '1.5rem' }}>
              <p style={{ margin: '0.625rem 0', fontSize: '0.95rem' }}>
                <strong>📅 Date:</strong> {formatDate(selectedSession.date)}
              </p>
              <p style={{ margin: '0.625rem 0', fontSize: '0.95rem' }}>
                <strong>⏰ Time:</strong> {formatTime(selectedSession.time)}
              </p>
              <p style={{ margin: '0.625rem 0', fontSize: '0.95rem' }}>
                <strong>⌛ Duration:</strong> {selectedSession.duration} minutes
              </p>
              <p style={{ margin: '0.625rem 0', fontSize: '0.95rem' }}>
                <strong>👥 Max Participants:</strong> {selectedSession.maxParticipants}
              </p>
              <p style={{ margin: '0.625rem 0', fontSize: '0.95rem' }}>
                <strong>📊 Status:</strong> <span style={{ 
                  color: selectedSession.status === 'scheduled' ? '#27ae60' : '#e74c3c',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}>
                  {selectedSession.status}
                </span>
              </p>
            </div>

            <button
              className="btn-primary"
              style={{ marginTop: '1.5rem', width: '100%' }}
              onClick={() => setSelectedSession(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}