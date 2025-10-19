'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { eventAPI, registrationAPI } from '@/utils/api';
import '@/app/dashboard.css';
import './page.css';

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export default function BrowseEventsPage() {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [registering, setRegistering] = useState(null);

  // Format date with time
  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate time remaining until deadline
  const getTimeRemaining = (deadline) => {
    const now = new Date();
    const timeRemaining = new Date(deadline) - now;
    
    if (timeRemaining <= 0) {
      return 'Registration closed';
    }

    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} day${days === 1 ? '' : 's'} remaining`;
    }
    return `${hours} hour${hours === 1 ? '' : 's'} remaining`;
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        let eventData;
        if (filter === 'all') {
          eventData = await eventAPI.getUpcoming();
        } else {
          eventData = await eventAPI.filter('type', filter);
        }
        setEvents(eventData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [filter]);

  useEffect(() => {
    if (sortOrder) {
      const sortEvents = async () => {
        try {
          const sortedEvents = await eventAPI.sortByDate(sortOrder);
          setEvents(sortedEvents);
        } catch (err) {
          setError(err.message);
        }
      };
      sortEvents();
    }
  }, [sortOrder]);

  const filterEvents = useCallback((searchTerm) => {
    const searchLower = searchTerm.toLowerCase();
    return events.filter(event => (
      event.name.toLowerCase().includes(searchLower) ||
      event.location.toLowerCase().includes(searchLower) ||
      (event.type === 'Workshop' && event.workshop?.faculty_responsible?.toLowerCase().includes(searchLower)) ||
      (event.type === 'Conference' && event.conference?.professors_participating?.some(prof => 
        prof.toLowerCase().includes(searchLower)
      ))
    ));
  }, [events]);

  const [filteredEvents, setFilteredEvents] = useState([]);

  // Debounced search effect
  useEffect(() => {
    const debouncedFilter = debounce(() => {
      setFilteredEvents(filterEvents(searchTerm));
    }, 300);

    debouncedFilter();

    return () => debouncedFilter.cancel;
  }, [searchTerm, filterEvents]);

  const handleRegister = async (event) => {
    const confirmMessage = `Are you sure you want to register for "${event.name}"?\n\n` +
      `Date: ${formatDateTime(event.start_date)}\n` +
      `Location: ${event.location}\n` +
      (event.type === 'Trip' ? `Price: $${event.trip.price}\n` : '') +
      '\nClick OK to confirm your registration.';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setRegistering(event._id);
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token');
      
      if (!user || !token) {
        throw new Error('You must be logged in to register for events');
      }

      // Check if user has required fields
      if (!user.first_name || !user.last_name || !user.email || !user.id_number || !user.role) {
        throw new Error('Missing required user information. Please complete your profile.');
      }

      await registrationAPI.register({
        event_id: event._id,
        name: user.first_name + ' ' + user.last_name,
        email: user.email,
        personalId: user.id_number,
        role: user.role
      }, token);

      // Refresh events after registration
      const updatedEvents = await eventAPI.getUpcoming();
      setEvents(updatedEvents);
      alert('Successfully registered for the event!');
    } catch (err) {
      if (err.message.includes('already registered')) {
        alert('You are already registered for this event.');
      } else if (err.message.includes('capacity')) {
        alert('Sorry, this event is full.');
      } else if (err.message.includes('deadline')) {
        alert('Registration deadline has passed.');
      } else {
        alert('Failed to register: ' + err.message);
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
            <li><Link href="/student/gym/schedule">🏋️ Gym Schedule</Link></li>
            <li><Link href="/student/facilities">🏟️ Facilities</Link></li>
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
                  placeholder="🔍 Search events, locations, professors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="sort-box">
                <button 
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="sort-btn"
                >
                  📅 Sort by Date {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
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
                  🎨 Workshops
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
                <button 
                  className={filter === 'GymSession' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('GymSession')}
                >
                  🏋️ Gym Sessions
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
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="empty-state">
                  <p>📅 No events found matching your criteria</p>
                </div>
              ) : (
                filteredEvents.map((event) => (
                  <div key={event._id} className="event-card">
                    <div className="event-header">
                      <h3>{event.name}</h3>
                      <span className={`event-type event-type-${event.type.toLowerCase()}`}>
                        {event.type}
                      </span>
                    </div>
                    <div className="event-details">
                      <p><strong>📍 Location:</strong> {event.location}</p>
                      <p><strong>📅 Starts:</strong> {formatDateTime(event.start_date)}</p>
                      <p><strong>📅 Ends:</strong> {formatDateTime(event.end_date)}</p>
                      <p><strong>⌚ Time:</strong> {event.time}</p>
                      <p><strong>📝 Description:</strong> {event.short_description}</p>
                      
                      {event.type === 'Workshop' && (
                        <>
                          <p><strong>👨‍🏫 Faculty:</strong> {event.workshop.faculty_responsible}</p>
                          <p><strong>👥 Professors:</strong> {event.workshop.professors_participating.join(', ')}</p>
                          <p><strong>🎯 Capacity:</strong> {event.workshop.capacity}</p>
                          <p><strong>⏰ Registration Deadline:</strong> {formatDateTime(event.workshop.registration_deadline)} ({getTimeRemaining(event.workshop.registration_deadline)})</p>
                        </>
                      )}
                      
                      {event.type === 'Trip' && (
                        <>
                          <p><strong>💰 Price:</strong> ${event.trip.price}</p>
                          <p><strong>👥 Capacity:</strong> {event.trip.capacity}</p>
                          <p><strong>⏰ Registration Deadline:</strong> {formatDateTime(event.trip.registration_deadline)} ({getTimeRemaining(event.trip.registration_deadline)})</p>
                        </>
                      )}
                      
                      {event.type === 'Conference' && (
                        <>
                          <p><strong>🏛️ Campus:</strong> {event.conference.campus}</p>
                          <p><strong>👥 Professors:</strong> {event.conference.professors_participating.join(', ')}</p>
                          <p><strong>🌐 Website:</strong> <a href={event.conference.conference_website} target="_blank" rel="noopener noreferrer">Visit Website</a></p>
                        </>
                      )}

                      {(event.type === 'Bazaar' || event.type === 'Booth') && (
                        <div className="vendor-section">
                          <h4>Participating Vendors:</h4>
                          <ul>
                            {event.type === 'Bazaar' && event.bazaar.vendors_participating.map((vendor, index) => (
                              <li key={index}>
                                {vendor.vendor_name} - Booth #{vendor.booth_number}
                                {vendor.products && vendor.products.length > 0 && 
                                  <span> (Products: {vendor.products.join(', ')})</span>
                                }
                              </li>
                            ))}
                            {event.type === 'Booth' && event.booth.vendors.map((vendor, index) => (
                              <li key={index}>
                                {vendor.vendor_name} - {vendor.company_name}
                                {vendor.booth_assignment && 
                                  <span> (Booth: {vendor.booth_assignment})</span>
                                }
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    {event.registration_open && !event.is_full && (
                      <button 
                        className="register-btn"
                        onClick={() => handleRegister(event)}
                        disabled={registering === event._id}
                      >
                        {registering === event._id ? 'Registering...' : 'Register Now'}
                      </button>
                    )}
                    {event.is_full && (
                      <div className="event-full-notice">
                        This event is full
                      </div>
                    )}
                    {!event.registration_open && !event.is_full && (
                      <div className="registration-closed-notice">
                        Registration closed
                      </div>
                    )}
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
