'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { eventAPI, registrationAPI, getUser } from '@/utils/api';
import '@/app/dashboard.css';

export default function StudentDashboard() {
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    upcomingEvents: 0,
    myRegistrations: 0,
    attendedEvents: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch upcoming events
      const eventsResponse = await eventAPI.getUpcoming();
      console.log('Dashboard events response:', eventsResponse);
      const eventsData = Array.isArray(eventsResponse) ? eventsResponse : [];
      setEvents(eventsData.slice(0, 3)); // Show only first 3 events

      // Fetch user registrations
      const user = getUser();
      if (user && user._id) {
        try {
          const registrationsResponse = await registrationAPI.getMyRegistrations(user._id);
          console.log('Dashboard registrations response:', registrationsResponse);
          
          let registrationData = [];
          if (registrationsResponse && registrationsResponse.registrations) {
            registrationData = registrationsResponse.registrations;
          } else if (Array.isArray(registrationsResponse)) {
            registrationData = registrationsResponse;
          }
          
          setRegistrations(registrationData.slice(0, 3)); // Show only first 3 registrations
          
          // Calculate stats
          const now = new Date();
          const upcomingRegs = registrationData.filter(reg => 
            reg.status === 'registered' && 
            reg.event && 
            new Date(reg.event.start_date) > now
          );
          const attendedRegs = registrationData.filter(reg => 
            reg.status === 'registered' && 
            reg.event && 
            new Date(reg.event.start_date) <= now
          );

          setStats({
            upcomingEvents: eventsData.length,
            myRegistrations: registrationData.length,
            attendedEvents: attendedRegs.length
          });

        } catch (regError) {
          console.error('Error fetching registrations:', regError);
          // Set stats with just events data
          setStats({
            upcomingEvents: eventsData.length,
            myRegistrations: 0,
            attendedEvents: 0
          });
        }
      } else {
        setStats({
          upcomingEvents: eventsData.length,
          myRegistrations: 0,
          attendedEvents: 0
        });
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return 'TBD';
    return timeString;
  };

  return (
    <div className="dashboard">
      {/* Navbar */}
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">👨‍🎓 Student Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Sidebar */}
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

        {/* Main Area */}
        <main className="main-content">
          <h1>Welcome, Student! 👋</h1>
          
          {error && (
            <div className="alert alert-error" style={{marginBottom: '2rem'}}>
              {error}
            </div>
          )}
          
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <h3>{loading ? '...' : stats.upcomingEvents}</h3>
                <p>Upcoming Events</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎫</div>
              <div className="stat-info">
                <h3>{loading ? '...' : stats.myRegistrations}</h3>
                <p>My Registrations</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>{loading ? '...' : stats.attendedEvents}</h3>
                <p>Attended Events</p>
              </div>
            </div>
          </div>

          {/* Available Events */}
          <section className="section">
            <h2>Available Events</h2>
            {loading ? (
              <div className="loading" style={{textAlign: 'center', padding: '2rem'}}>
                Loading events...
              </div>
            ) : events.length === 0 ? (
              <div className="empty-state">
                <p>🎪 No events available at the moment</p>
                <Link href="/student/events" className="btn-primary">Browse All Events</Link>
              </div>
            ) : (
              <div className="events-grid">
                {events.map((event) => (
                  <div key={event._id} className="event-card">
                    <div className="event-header">
                      <h3>{event.name}</h3>
                      <span className={`event-type event-type-${event.type.toLowerCase()}`}>
                        {event.type}
                      </span>
                    </div>
                    <div className="event-details">
                      <p><strong>📍 Location:</strong> {event.location}</p>
                      <p><strong>📅 Date:</strong> {formatDate(event.start_date)}</p>
                      <p><strong>⏰ Time:</strong> {formatTime(event.time)}</p>
                      <p><strong>📝 Description:</strong> {event.short_description}</p>
                    </div>
                    <div className="event-actions">
                      <Link href="/student/events" className="btn-secondary btn-sm">
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
                {events.length >= 3 && (
                  <div className="view-more-card">
                    <div className="view-more-content">
                      <h3>View More Events</h3>
                      <p>Discover more events and opportunities</p>
                      <Link href="/student/events" className="btn-primary">
                        Browse All Events
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* My Registrations */}
          <section className="section">
            <h2>My Recent Registrations</h2>
            {loading ? (
              <div className="loading" style={{textAlign: 'center', padding: '2rem'}}>
                Loading registrations...
              </div>
            ) : registrations.length === 0 ? (
              <div className="empty-state">
                <p>🎫 You haven't registered for any events yet</p>
                <Link href="/student/events" className="btn-primary">Register for Events</Link>
              </div>
            ) : (
              <div className="registrations-list">
                {registrations.map((registration) => (
                  <div key={registration._id} className="registration-item">
                    <div className="registration-header">
                      <h4>{registration.event?.name || 'Unknown Event'}</h4>
                      <span className={`badge ${
                        registration.status === 'registered' ? 'badge-success' :
                        registration.status === 'canceled' ? 'badge-secondary' :
                        'badge-warning'
                      }`}>
                        {registration.status === 'registered' ? '✅ Registered' :
                         registration.status === 'canceled' ? '❌ Cancelled' :
                         registration.status}
                      </span>
                    </div>
                    <div className="registration-details">
                      <p><strong>Type:</strong> {registration.event?.type || 'Unknown'}</p>
                      <p><strong>Date:</strong> {formatDate(registration.event?.start_date)}</p>
                      <p><strong>Time:</strong> {formatTime(registration.event?.time)}</p>
                      <p><strong>Location:</strong> {registration.event?.location || 'TBD'}</p>
                    </div>
                  </div>
                ))}
                {registrations.length >= 3 && (
                  <div className="view-more-registrations">
                    <Link href="/student/my-registrations" className="btn-secondary">
                      View All Registrations
                    </Link>
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
      </div>

      <style jsx>{`
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

        .loading {
          text-align: center;
          padding: 2rem;
          color: #666;
          font-style: italic;
        }

        .events-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-top: 1rem;
        }

        .event-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          border: 2px solid #f0f0f0;
          transition: all 0.3s ease;
        }

        .event-card:hover {
          border-color: #0066cc;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .event-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .event-header h3 {
          margin: 0;
          color: #333;
          font-size: 1.1rem;
        }

        .event-type {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        .event-type-workshop { background: #e7f3ff; color: #0066cc; }
        .event-type-trip { background: #f0f9ff; color: #0284c7; }
        .event-type-conference { background: #f5f3ff; color: #7c3aed; }
        .event-type-bazaar { background: #fef7ed; color: #c2410c; }
        .event-type-booth { background: #f0fdf4; color: #15803d; }

        .event-details p {
          margin: 0.5rem 0;
          font-size: 0.9rem;
          color: #666;
        }

        .event-actions {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #f0f0f0;
        }

        .view-more-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
          color: white;
        }

        .view-more-content h3 {
          margin: 0 0 0.5rem 0;
          color: white;
        }

        .view-more-content p {
          margin: 0 0 1rem 0;
          opacity: 0.9;
        }

        .registrations-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1rem;
        }

        .registration-item {
          background: white;
          border-radius: 8px;
          padding: 1rem;
          border: 2px solid #f0f0f0;
        }

        .registration-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .registration-header h4 {
          margin: 0;
          color: #333;
          font-size: 1rem;
        }

        .registration-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.5rem;
        }

        .registration-details p {
          margin: 0;
          font-size: 0.85rem;
          color: #666;
        }

        .view-more-registrations {
          text-align: center;
          margin-top: 1rem;
        }

        .badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        .badge-success {
          background-color: #d4edda;
          color: #155724;
        }

        .badge-secondary {
          background-color: #e2e3e5;
          color: #383d41;
        }

        .badge-warning {
          background-color: #fff3cd;
          color: #856404;
        }

        .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
}
