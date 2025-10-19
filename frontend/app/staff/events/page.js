'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import '@/app/dashboard.css';
import { eventAPI } from '@/utils/api';

export default function StaffEventsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' for newest first, 'asc' for oldest first
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Registered events states
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [registeredEventsLoading, setRegisteredEventsLoading] = useState(true);
  
  // Advanced filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterProfessor, setFilterProfessor] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    fetchEvents();
    fetchRegisteredEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await eventAPI.getUpcoming();
      console.log('Fetched events:', data);
      const sortedData = sortEvents(data || [], sortOrder);
      setEvents(sortedData);
    } catch (err) {
      console.error('Error fetching events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch registered events
  const fetchRegisteredEvents = async () => {
    try {
      setRegisteredEventsLoading(true);
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!token || !user._id) {
        console.log('No token or user found');
        setRegisteredEvents([]);
        return;
      }

      const response = await fetch(`http://localhost:5000/api/registration/${user._id}/events`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Registered events response:', data);
        // The response contains { upcoming, past, registrations }
        setRegisteredEvents(data.upcoming || []);
      } else {
        setRegisteredEvents([]);
      }
    } catch (error) {
      console.error('Error fetching registered events:', error);
      setRegisteredEvents([]);
    } finally {
      setRegisteredEventsLoading(false);
    }
  };

  // Cancel registration
  const handleCancelRegistration = async (registrationId) => {
    if (!window.confirm('Are you sure you want to cancel this registration?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/registration/cancel/${registrationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Registration cancelled successfully!');
        // Refresh both registered and available events
        await fetchRegisteredEvents();
        await fetchEvents();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to cancel registration');
      }
    } catch (error) {
      console.error('Error cancelling registration:', error);
      alert('Failed to cancel registration');
    }
  };

  // Function to sort events by date
  const sortEvents = (events, order) => {
    return [...events].sort((a, b) => {
      const dateA = new Date(a.start_date);
      const dateB = new Date(b.start_date);
      return order === 'asc' ? dateA - dateB : dateB - dateA;
    });
  };

  // Apply search and filters to events
  const applySearchAndFilters = () => {
    if (!events.length) {
      setFilteredEvents([]);
      return;
    }
    
    let result = [...events];
    
    // 1. SEARCH: by event name OR professor name
    if (searchTerm.trim()) {
      const searchStr = searchTerm.toLowerCase();
      result = result.filter(event => {
        const matchesEventName = event.name?.toLowerCase().includes(searchStr);
        const matchesProfessor = 
          event.workshop?.professors_participating?.some(prof => prof.toLowerCase().includes(searchStr)) ||
          event.workshop?.faculty_responsible?.toLowerCase().includes(searchStr) ||
          event.conference?.professors_participating?.some(prof => prof.toLowerCase().includes(searchStr));
        
        return matchesEventName || matchesProfessor;
      });
    }
    
    // 2. FILTER by Type
    if (filterType !== 'all') {
      result = result.filter(event => {
        const eventType = event.type?.toLowerCase() || '';
        return eventType === filterType.toLowerCase();
      });
    }
    
    // 3. FILTER by Professor Name
    if (filterProfessor.trim()) {
      const professorStr = filterProfessor.toLowerCase();
      result = result.filter(event => {
        return (
          event.workshop?.professors_participating?.some(prof => prof.toLowerCase().includes(professorStr)) ||
          event.workshop?.faculty_responsible?.toLowerCase().includes(professorStr) ||
          event.conference?.professors_participating?.some(prof => prof.toLowerCase().includes(professorStr))
        );
      });
    }
    
    // 4. FILTER by Location
    if (filterLocation.trim()) {
      const locationStr = filterLocation.toLowerCase();
      result = result.filter(event => {
        return event.location?.toLowerCase().includes(locationStr);
      });
    }
    
    // 5. FILTER by Date
    if (filterDate) {
      result = result.filter(event => {
        const eventDate = new Date(event.start_date).toISOString().split('T')[0];
        return eventDate === filterDate;
      });
    }
    
    // 6. Apply sorting
    const sorted = sortEvents(result, sortOrder);
    setFilteredEvents(sorted);
  };

  // Handle sort order change
  const handleSortChange = () => {
    const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newOrder);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterProfessor('');
    setFilterLocation('');
    setFilterDate('');
  };

  // Update filtered events when any search/filter criteria changes
  useEffect(() => {
    applySearchAndFilters();
  }, [searchTerm, filterType, filterProfessor, filterLocation, filterDate, sortOrder, events]);

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
            <li>
              <Link href="/staff">🏠 Dashboard</Link>
            </li>
            <li>
              <Link href="/staff/events">📅 Browse Events</Link>
            </li>
            <li>
              <Link href="/staff/gym/schedule">💪 Gym Schedule</Link>
            </li>
            <li>
              <Link href="/staff/profile">👤 Profile</Link>
            </li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Browse Events 📅</h1>

          {/* My Registered Events Section */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '2px solid #e0e0e0',
              paddingBottom: '10px'
            }}>
              <h2 style={{ 
                fontSize: '24px', 
                color: '#0066cc',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                📝 My Registered Events
                {registeredEvents && registeredEvents.length > 0 && (
                  <span style={{
                    background: '#0066cc',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    {registeredEvents.length}
                  </span>
                )}
              </h2>
            </div>

            {registeredEventsLoading ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#666'
              }}>
                Loading your registered events...
              </div>
            ) : !registeredEvents || registeredEvents.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                background: '#f8f9fa',
                borderRadius: '8px',
                color: '#666'
              }}>
                <p style={{ fontSize: '18px', margin: '0 0 10px 0' }}>📭 No registered events</p>
                <p style={{ fontSize: '14px', margin: 0 }}>Browse events below to register!</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px'
              }}>
                {(registeredEvents || []).map((registration) => {
                  const event = registration.event;
                  if (!event) return null;
                  
                  return (
                    <div
                      key={registration._id}
                      style={{
                        background: 'white',
                        borderRadius: '8px',
                        padding: '20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '2px solid #0066cc',
                        position: 'relative'
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: registration.status === 'registered' ? '#28a745' : '#ffc107',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {registration.status?.toUpperCase()}
                      </div>
                      
                      <h3 style={{ 
                        fontSize: '18px', 
                        marginBottom: '10px',
                        color: '#333',
                        paddingRight: '80px'
                      }}>
                        {event.name || 'Event'}
                      </h3>
                      
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#666', 
                        marginBottom: '15px' 
                      }}>
                        <p style={{ margin: '5px 0' }}>
                          <strong>Type:</strong> {event.type || 'N/A'}
                        </p>
                        <p style={{ margin: '5px 0' }}>
                          <strong>Date:</strong> {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'N/A'}
                        </p>
                        <p style={{ margin: '5px 0' }}>
                          <strong>Location:</strong> {event.location || 'N/A'}
                        </p>
                        <p style={{ margin: '5px 0' }}>
                          <strong>Registered:</strong> {registration.registration_date ? new Date(registration.registration_date).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>

                      <div style={{
                        display: 'flex',
                        gap: '10px'
                      }}>
                        <Link
                          href={`/staff/events/${event._id}`}
                          style={{
                            flex: 1,
                            textAlign: 'center',
                            padding: '10px',
                            background: '#0066cc',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '5px',
                            fontSize: '14px',
                            fontWeight: '600',
                            transition: 'background 0.3s'
                          }}
                          onMouseEnter={(e) => e.target.style.background = '#0052a3'}
                          onMouseLeave={(e) => e.target.style.background = '#0066cc'}
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => handleCancelRegistration(registration._id)}
                          style={{
                            flex: 1,
                            padding: '10px',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background 0.3s'
                          }}
                          onMouseEnter={(e) => e.target.style.background = '#c82333'}
                          onMouseLeave={(e) => e.target.style.background = '#dc3545'}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Divider */}
          <div style={{
            borderTop: '3px solid #0066cc',
            marginBottom: '30px'
          }}></div>

          <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '20px' }}>🔍 Browse Available Events</h2>

          {/* Search and Action Buttons Bar */}
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'stretch',
            marginBottom: '20px',
            flexWrap: 'wrap',
            width: '100%'
          }}>
            <div style={{ 
              flex: '1 1 300px',
              minWidth: '250px'
            }}>
              <input
                type="text"
                placeholder="🔍 Search by event name or professor name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border-color 0.3s',
                  boxSizing: 'border-box',
                  height: '44px'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0066cc'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                background: showFilters ? '#0066cc' : '#f0f0f0',
                color: showFilters ? 'white' : '#333',
                whiteSpace: 'nowrap',
                height: '44px',
                flex: '0 0 auto'
              }}
            >
              {showFilters ? '🔼 Hide Filters' : '🔽 Show Filters'}
            </button>
            <button 
              onClick={handleSortChange} 
              title={sortOrder === 'desc' ? 'Sort by oldest first' : 'Sort by newest first'}
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                background: '#f0f0f0',
                color: '#333',
                whiteSpace: 'nowrap',
                height: '44px',
                flex: '0 0 auto'
              }}
            >
              📅 {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
            </button>
          </div>

          <section className="section">
            {/* Advanced Filters Panel */}
            {showFilters && (
              <div style={{
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                padding: '24px',
                borderRadius: '12px',
                marginBottom: '20px',
                border: '1px solid #dee2e6',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <h3 style={{
                  margin: '0 0 20px 0',
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#333',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🎯 Advanced Filters
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '20px'
                }}>
                  {/* Event Type Filter */}
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '600',
                      fontSize: '13px',
                      color: '#495057'
                    }}>
                      📋 Event Type
                    </label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '14px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        outline: 'none',
                        cursor: 'pointer',
                        background: 'white',
                        transition: 'border-color 0.3s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0066cc'}
                      onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    >
                      <option value="all">All Types</option>
                      <option value="Workshop">Workshops</option>
                      <option value="Trip">Trips</option>
                      <option value="Bazaar">Bazaars</option>
                      <option value="Booth">Booths</option>
                      <option value="Conference">Conferences</option>
                    </select>
                  </div>

                  {/* Professor Name Filter */}
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '600',
                      fontSize: '13px',
                      color: '#495057'
                    }}>
                      👨‍🏫 Professor Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Dr. Smith"
                      value={filterProfessor}
                      onChange={(e) => setFilterProfessor(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '14px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        outline: 'none',
                        transition: 'border-color 0.3s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0066cc'}
                      onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    />
                  </div>

                  {/* Location Filter */}
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '600',
                      fontSize: '13px',
                      color: '#495057'
                    }}>
                      📍 Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Main Hall"
                      value={filterLocation}
                      onChange={(e) => setFilterLocation(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '14px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        outline: 'none',
                        transition: 'border-color 0.3s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0066cc'}
                      onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    />
                  </div>

                  {/* Date Filter */}
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '600',
                      fontSize: '13px',
                      color: '#495057'
                    }}>
                      📅 Date
                    </label>
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '14px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        outline: 'none',
                        cursor: 'pointer',
                        transition: 'border-color 0.3s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0066cc'}
                      onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    />
                  </div>

                  {/* Clear Button */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gridColumn: 'span 1'
                  }}>
                    <button 
                      onClick={handleClearFilters}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '14px',
                        fontWeight: '600',
                        border: '2px solid #dc3545',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: 'white',
                        color: '#dc3545',
                        transition: 'all 0.3s'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = '#dc3545';
                        e.target.style.color = 'white';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = 'white';
                        e.target.style.color = '#dc3545';
                      }}
                    >
                      ✕ Clear All Filters
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Results Counter */}
            {!loading && events.length > 0 && (
              <div style={{ 
                padding: '12px 20px',
                background: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ 
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#495057'
                }}>
                  📊 Showing <span style={{ color: '#0066cc', fontSize: '16px' }}>
                    {filteredEvents.length}
                  </span> of <span style={{ fontSize: '16px' }}>{events.length}</span> events
                </div>
                {(searchTerm || filterType !== 'all' || filterProfessor || filterLocation || filterDate) && (
                  <span style={{ 
                    background: '#0066cc',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    ✓ Filters Active
                  </span>
                )}
              </div>
            )}

            <div className="events-grid">
              {loading ? (
                <div className="empty-state">
                  <p>⏳ Loading events...</p>
                </div>
              ) : events.length === 0 ? (
                <div className="empty-state">
                  <p>📅 No events available</p>
                </div>
              ) : filteredEvents.length === 0 && (searchTerm || filterType !== 'all' || filterProfessor || filterLocation || filterDate) ? (
                <div className="empty-state">
                  <p>📅 No events found matching your criteria</p>
                  <p style={{fontSize: '0.9rem', color: '#999'}}>
                    Try adjusting your search terms or filters
                  </p>
                  <button onClick={handleClearFilters} className="btn-primary" style={{marginTop: '10px'}}>
                    Clear Filters
                  </button>
                </div>
              ) : (
                (filteredEvents.length > 0 ? filteredEvents : events).map(event => (
                  <article key={event._id} className="event-card">
                    <header>
                      <h3>{event.name}</h3>
                      <small>{event.type} • {event.location}</small>
                    </header>
                    <p>{event.short_description}</p>
                    <p className="event-date">
                      {new Date(event.start_date).toLocaleDateString()} at {event.time}
                    </p>
                    <div className="event-actions">
                      <Link href={`/staff/events/${event._id}`}>
                        View Details
                      </Link>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
