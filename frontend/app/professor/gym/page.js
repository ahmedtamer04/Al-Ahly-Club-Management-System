'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import '@/app/dashboard.css';
import { gymAPI } from '@/utils/api';

export default function ProfessorGym() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
            <li><Link href="/professor/workshops">🎨 My Workshops</Link></li>
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
                            cursor: 'default'
                          }}
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
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
