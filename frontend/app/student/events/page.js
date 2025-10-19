'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { eventAPI, registrationAPI, getUser } from '@/utils/api';
import '@/app/dashboard.css';

export default function BrowseEventsPage() {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [registering, setRegistering] = useState(null);

  // Fetch events when component mounts or filter changes
  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let eventData;
      if (filter === 'all') {
        eventData = await eventAPI.getUpcoming();
      } else {
        eventData = await eventAPI.filter('type', filter);
      }
      
      console.log('Events fetched:', eventData);
      setEvents(Array.isArray(eventData) ? eventData : []);
      
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message || 'Failed to load events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Format date with time
  const formatDateTime = (date) => {
    if (!date) return 'TBD';
    return new Date(date).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter events based on search term
  const filteredEvents = events.filter(event =>
    event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.short_description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle registration
  const handleRegister = async (event) => {
    const confirmMessage = `Are you sure you want to register for "${event.name}"?\n\n` +
      `Date: ${formatDateTime(event.start_date)}\n` +
      `Location: ${event.location}\n` +
      '\nClick OK to confirm your registration.';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setRegistering(event._id);
      const user = getUser();
      const token = localStorage.getItem('token');
      
      console.log('Registration attempt - User data:', user);
      
      if (!user || !token) {
        throw new Error('You must be logged in to register for events');
      }

      // Build user name from available fields
      const userName = user.name || 
                     (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : '') ||
                     user.username ||
                     'Student User';
      
      // Get personal ID from available fields
      const userPersonalId = user.personalId || user.id_number || user.student_id || user._id;
      
      // Get email from available fields  
      const userEmail = user.email || `${user.username || user._id}@university.edu`;
      
      // Get role from available fields
      const userRole = user.role || 'Student';
      
      console.log('Registration data to send:', {
        event_id: event._id,
        name: userName,
        email: userEmail,
        personalId: userPersonalId,
        role: userRole
      });

      await registrationAPI.register({
        event_id: event._id,
        name: userName,
        email: userEmail,
        personalId: userPersonalId,
        role: userRole
      });

      // Refresh events after registration
      await fetchEvents();
      alert('Successfully registered for the event!');
      
    } catch (err) {
      console.error('Registration error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        error: err
      });
      
      // Show more specific error messages based on response
      if (err.response?.data?.message) {
        alert('Registration failed: ' + err.response.data.message);
      } else if (err.message?.includes('already registered')) {
        alert('You are already registered for this event.');
      } else if (err.message?.includes('capacity') || err.message?.includes('full')) {
        alert('Sorry, this event is full.');
      } else if (err.message?.includes('deadline') || err.message?.includes('closed')) {
        alert('Registration deadline has passed.');
      } else if (err.message?.includes('role')) {
        alert('Invalid user role. Please contact support.');
      } else {
        alert('Failed to register: ' + (err.message || 'Unknown error occurred'));
      }
    } finally {
      setRegistering(null);
    }
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
            <li><Link href="/student/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Browse Events 📅</h1>

          {/* Filter Bar */}
          <section className="section">
            <div className="filter-bar">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="🔍 Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Link href="/student/events/search" className="btn-secondary" style={{marginLeft: '10px', textDecoration: 'none'}}>
                  🔍 Advanced Search
                </Link>
              </div>
              <div className="filter-buttons">
                <button 
                  className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('all')}
                >
                  All Events
                </button>

                <button 
                  className={filter === 'Workshop' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('Workshop')}
                >
                  🎓 Workshops
                </button>
                <button 
                  className={filter === 'Trip' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('Trip')}
                >
                  🚌 Trips
                </button>
                <button 
                  className={filter === 'Bazaar' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('Bazaar')}
                >
                  🎪 Bazaars
                </button>
                <button 
                  className={filter === 'Booth' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('Booth')}
                >
                  🏟️ Booths
                </button>
                <button 
                  className={filter === 'Conference' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('Conference')}
                >
                  🎓 Conferences
                </button>
              </div>
            </div>

            {/* Events Grid */}
            <div className="events-grid">
              {loading ? (
                <div className="loading-state">
                  <p>Loading events...</p>
                </div>
              ) : error ? (
                <div className="error-state">
                  <p>Error: {error}</p>
                  <button onClick={fetchEvents} className="btn-primary">
                    Try Again
                  </button>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="empty-state">
                  <p>📅 No events found matching your criteria</p>
                  {searchTerm && (
                    <p style={{fontSize: '0.9rem', color: '#999'}}>
                      Try adjusting your search terms or filters
                    </p>
                  )}
                </div>
              ) : (
                filteredEvents.map((event) => (
                  <div key={event._id} className="event-card">
                    <div className="event-header">
                      <h3>{event.name}</h3>
                      <span className={`event-type event-type-${event.type?.toLowerCase() || 'default'}`}>
                        {event.type}
                      </span>
                    </div>
                    <div className="event-details">
                      <p><strong>📍 Location:</strong> {event.location}</p>
                      <p><strong>📅 Starts:</strong> {formatDateTime(event.start_date)}</p>
                      <p><strong>📅 Ends:</strong> {formatDateTime(event.end_date)}</p>
                      <p><strong>⌚ Time:</strong> {event.time}</p>
                      <p><strong>📝 Description:</strong> {event.short_description}</p>
                      
                      {event.type === 'Workshop' && event.workshop && (
                        <>
                          <p><strong>👨‍🏫 Faculty:</strong> {event.workshop.faculty_responsible}</p>
                          <p><strong>👥 Professors:</strong> {event.workshop.professors_participating?.join(', ')}</p>
                          <p><strong>🎯 Capacity:</strong> {event.workshop.capacity}</p>
                        </>
                      )}
                      
                      {event.type === 'Trip' && event.trip && (
                        <>
                          <p><strong>💰 Price:</strong> ${event.trip.price}</p>
                          <p><strong>🎯 Capacity:</strong> {event.trip.capacity}</p>
                        </>
                      )}
                      
                      {event.type === 'Conference' && event.conference && (
                        <>
                          <p><strong>🏛️ Campus:</strong> {event.conference.campus}</p>
                          <p><strong>👥 Professors:</strong> {event.conference.professors_participating?.join(', ')}</p>
                        </>
                      )}
                    </div>
                    
                    <div className="event-actions">
                      {event.registration_open && !event.is_full ? (
                        <button 
                          className="register-btn"
                          onClick={() => handleRegister(event)}
                          disabled={registering === event._id}
                        >
                          {registering === event._id ? 'Registering...' : 'Register Now'}
                        </button>
                      ) : event.is_full ? (
                        <div className="event-full-notice">
                          This event is full
                        </div>
                      ) : (
                        <div className="registration-closed-notice">
                          Registration closed
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
