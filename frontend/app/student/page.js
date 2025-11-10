'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { eventAPI, registrationAPI, getUser } from '@/utils/api';
import '@/app/dashboard.css';
import NotificationBell from '../components/NotificationBell';

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

      // Fetch user registrations if user is logged in
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
      setStats({ upcomingEvents: 0, myRegistrations: 0, attendedEvents: 0 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      {/* Navbar */}
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <NotificationBell />
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
            <li><Link href="/student/favorites">⭐ My Favorites</Link></li>
            <li><Link href="/student/my-registrations">🎫 My Registrations</Link></li>
            <li><Link href="/student/payment-history">💰 Payment History</Link></li>
            <li><Link href="/student/facilities">🏢 Facilities</Link></li>
            <li><Link href="/student/gym/schedule">💪 Gym Schedule</Link></li>
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
                      <span className={`event-type event-type-${event.type?.toLowerCase() || 'default'}`}>
                        {event.type}
                      </span>
                    </div>
                    <div className="event-details">
                      <p><strong>📍 Location:</strong> {event.location}</p>
                      <p><strong>📅 Date:</strong> {new Date(event.start_date).toLocaleDateString()}</p>
                      <p><strong>⏰ Time:</strong> {event.time}</p>
                      <p><strong>📝 Description:</strong> {event.short_description}</p>
                    </div>
                    <div className="event-actions">
                      <Link href="/student/events" className="btn-secondary btn-sm">
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
                <div className="view-more-card">
                  <div className="view-more-content">
                    <h3>View More Events</h3>
                    <p>Discover more events and opportunities</p>
                    <Link href="/student/events" className="btn-primary">
                      Browse All Events
                    </Link>
                  </div>
                </div>
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
                      <p><strong>Date:</strong> {registration.event?.start_date ? new Date(registration.event.start_date).toLocaleDateString() : 'TBD'}</p>
                      <p><strong>Time:</strong> {registration.event?.time || 'TBD'}</p>
                      <p><strong>Location:</strong> {registration.event?.location || 'TBD'}</p>
                    </div>
                  </div>
                ))}
                <div className="view-more-registrations">
                  <Link href="/student/my-registrations" className="btn-secondary">
                    View All Registrations
                  </Link>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
      
      <style jsx>{`
        .events-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .event-card {
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: transform 0.2s;
        }

        .event-card:hover {
          transform: translateY(-2px);
        }

        .event-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .event-header h3 {
          margin: 0;
          color: #c41e3a;
          font-size: 1.1rem;
        }

        .event-type {
          padding: 4px 8px;
          border-radius: 15px;
          font-size: 0.8rem;
          font-weight: bold;
          text-transform: uppercase;
        }

        .event-type-conference {
          background: #e3f2fd;
          color: #1976d2;
        }

        .event-type-workshop {
          background: #f3e5f5;
          color: #7b1fa2;
        }

        .event-type-seminar {
          background: #e8f5e8;
          color: #388e3c;
        }

        .event-type-default {
          background: #f5f5f5;
          color: #666;
        }

        .event-details p {
          margin: 8px 0;
          font-size: 0.9rem;
          color: #555;
        }

        .event-actions {
          margin-top: 15px;
          text-align: center;
        }

        .view-more-card {
          background: linear-gradient(135deg, #c41e3a, #d32f2f);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          padding: 20px;
          text-align: center;
        }

        .view-more-content h3 {
          margin: 0 0 10px 0;
          color: white;
        }

        .view-more-content p {
          margin: 0 0 15px 0;
          opacity: 0.9;
        }

        .registrations-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .registration-item {
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-left: 4px solid #c41e3a;
        }

        .registration-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .registration-header h4 {
          margin: 0;
          color: #c41e3a;
        }

        .badge {
          padding: 4px 12px;
          border-radius: 15px;
          font-size: 0.8rem;
          font-weight: bold;
        }

        .badge-success {
          background: #e8f5e8;
          color: #2e7d32;
        }

        .badge-secondary {
          background: #f5f5f5;
          color: #666;
        }

        .badge-warning {
          background: #fff3e0;
          color: #ef6c00;
        }

        .registration-details p {
          margin: 5px 0;
          font-size: 0.9rem;
          color: #555;
        }

        .view-more-registrations {
          text-align: center;
          margin-top: 10px;
        }

        .loading {
          color: #666;
          font-style: italic;
        }

        .alert {
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .alert-error {
          background: #ffebee;
          color: #c62828;
          border-left: 4px solid #c62828;
        }
      `}</style>
    </div>
  );
}
