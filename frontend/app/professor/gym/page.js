'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import '@/app/dashboard.css';
import { gymAPI } from '@/utils/api';

export default function ProfessorGym() {
  const [sessions, setSessions] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [registering, setRegistering] = useState({});
  
  // Filter states
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedType, setSelectedType] = useState('all');
  
  // Session types from backend model
  const sessionTypes = [
    'Yoga',
    'Pilates',
    'Zumba',
    'Cardio',
    'Strength',
    'Cross Circuit',
    'Kick-Boxing',
    'Aerobics'
  ];

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch gym sessions
  useEffect(() => {
    loadGymSessions();
    fetchMyRegistrations();
  }, [selectedMonth, selectedYear, selectedType]);

  const loadGymSessions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        month: selectedMonth,
        year: selectedYear
      };
      
      if (selectedType !== 'all') {
        params.type = selectedType;
      }
      
      const response = await gymAPI.getSchedule(params);
      setSessions(response.sessions || []);
    } catch (err) {
      console.error('Error loading gym sessions:', err);
      // Check for 404 or no sessions message
      if (err.message && (err.message.includes('No gym sessions found') || err.message.includes('404'))) {
        setSessions([]);
        setError('No gym sessions scheduled for this month.');
      } else {
        setSessions([]);
        setError('No gym sessions scheduled for this month.');
      }
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
      loadGymSessions(); // Refresh to update capacity
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
      loadGymSessions();
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

  // Format date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  // Format time
  const formatTime = (timeStr) => {
    return timeStr;
  };

  // Get session type icon
  const getSessionIcon = (type) => {
    const icons = {
      'Yoga': '🧘',
      'Pilates': '🤸',
      'Zumba': '💃',
      'Cardio': '🏃',
      'Strength': '💪',
      'Cross Circuit': '🏋️',
      'Kick-Boxing': '🥊',
      'Aerobics': '🤾'
    };
    return icons[type] || '🏃';
  };

  // Get session type color
  const getSessionColor = (type) => {
    const colors = {
      'Yoga': '#8e44ad',
      'Pilates': '#3498db',
      'Zumba': '#e74c3c',
      'Cardio': '#e67e22',
      'Strength': '#2c3e50',
      'Cross Circuit': '#16a085',
      'Kick-Boxing': '#c0392b',
      'Aerobics': '#f39c12'
    };
    return colors[type] || '#95a5a6';
  };

  // Group sessions by date
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

  const groupedSessions = groupSessionsByDate();
  const sortedDates = Object.keys(groupedSessions).sort((a, b) => 
    new Date(a) - new Date(b)
  );

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
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
            <li><Link href="/professor/favorites">⭐ My Favorites</Link></li>
            <li><Link href="/professor/workshops">🎨 My Workshops</Link></li>
            <li><Link href="/professor/payment-history">💰 Payment History</Link></li>
            <li><Link href="/polls-voting">📊 Vote for Vendors</Link></li>
            <li><Link href="/loyalty-program">🎁 Loyalty Program</Link></li>
            <li><Link href="/professor/gym">💪 Gym Schedule</Link></li>
            <li><Link href="/professor/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <div style={{ marginBottom: '30px' }}>
            <h1 style={{ marginBottom: '10px' }}>💪 Gym Schedule</h1>
            <p style={{ color: '#666', fontSize: '14px' }}>
              View monthly gym sessions including Yoga, Pilates, Zumba, and more
            </p>
          </div>

          {/* Filters Section */}
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '30px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px'
            }}>
              {/* Month Selector */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#333'
                }}>
                  📅 Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    outline: 'none',
                    cursor: 'pointer',
                    background: 'white'
                  }}
                >
                  {monthNames.map((month, index) => (
                    <option key={index} value={index + 1}>{month}</option>
                  ))}
                </select>
              </div>

              {/* Year Selector */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#333'
                }}>
                  📆 Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    outline: 'none',
                    cursor: 'pointer',
                    background: 'white'
                  }}
                >
                  {[2024, 2025, 2026].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#333'
                }}>
                  🏃 Session Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '14px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    outline: 'none',
                    cursor: 'pointer',
                    background: 'white'
                  }}
                >
                  <option value="all">All Types</option>
                  {sessionTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sessions Display */}
          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading gym schedule...</p>
            </div>
          )}

          {error && !loading && sessions.length === 0 && (
            <div className="empty-state">
              <h3>No Sessions Found</h3>
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div style={{ color: '#155724', padding: '1rem', backgroundColor: '#d4edda', borderRadius: '4px', marginBottom: '1rem', border: '1px solid #c3e6cb' }}>
              ✅ {success}
            </div>
          )}

          {error && success === '' && sessions.length > 0 && (
            <div style={{ color: 'red', padding: '1rem', backgroundColor: '#ffe6e6', borderRadius: '4px', marginBottom: '1rem' }}>
              ⚠️ {error}
            </div>
          )}

          {!loading && !error && sessions.length > 0 && (
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '2px solid #e0e0e0'
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#333' }}>
                  {monthNames[selectedMonth - 1]} {selectedYear}
                </h2>
                <span style={{
                  background: '#0066cc',
                  color: 'white',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {sessions.length} Session{sessions.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Sessions grouped by date */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {sortedDates.map(dateKey => (
                  <div key={dateKey}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#495057',
                      marginBottom: '12px',
                      paddingBottom: '8px',
                      borderBottom: '1px solid #e9ecef'
                    }}>
                      📅 {formatDate(dateKey)}
                    </div>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: '16px'
                    }}>
                      {groupedSessions[dateKey].map(session => (
                        <div
                          key={session._id}
                          style={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                            border: `2px solid ${getSessionColor(session.type)}`,
                            borderRadius: '12px',
                            padding: '16px',
                            transition: 'all 0.3s',
                            cursor: 'pointer'
                          }}
                          onClick={() => setSelectedSession(session)}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = `0 4px 12px ${getSessionColor(session.type)}40`;
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '12px'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <span style={{ fontSize: '24px' }}>
                                {getSessionIcon(session.type)}
                              </span>
                              <span style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                color: getSessionColor(session.type)
                              }}>
                                {session.type}
                              </span>
                            </div>
                            <span style={{
                              background: getSessionColor(session.type),
                              color: 'white',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              {session.duration} min
                            </span>
                          </div>

                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            fontSize: '14px',
                            color: '#666'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>🕒</span>
                              <span style={{ fontWeight: '500' }}>{formatTime(session.time)}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>👥</span>
                              <span>Max {session.maxParticipants} participants</span>
                            </div>
                            {isRegistered(session._id) && (
                              <div style={{ 
                                marginTop: '8px', 
                                padding: '4px 8px', 
                                background: '#28a745', 
                                color: 'white', 
                                borderRadius: '4px', 
                                fontSize: '12px',
                                fontWeight: '600'
                              }}>
                                ✓ Registered
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
          )}
        </main>
      </div>
    </div>
  );
}
