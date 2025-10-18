'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { registrationAPI, getUser } from '@/utils/api';
import '@/app/dashboard.css';

export default function MyRegistrationsPage() {
  const [filter, setFilter] = useState('upcoming');
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    past: 0,
    cancelled: 0
  });

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError('');
      
      const user = getUser();
      if (!user || !user._id) {
        setError('Please log in to view registrations');
        return;
      }

      const response = await registrationAPI.getMyRegistrations(user._id);
      console.log('My registrations response:', response);
      
      // Handle different response formats
      let registrationData = [];
      if (response && response.registrations) {
        registrationData = response.registrations;
      } else if (Array.isArray(response)) {
        registrationData = response;
      }
      
      setRegistrations(registrationData);
      calculateStats(registrationData);
      
    } catch (err) {
      console.error('Error fetching registrations:', err);
      setError(err.message || 'Failed to load registrations');
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (registrationData) => {
    const now = new Date();
    const stats = {
      total: registrationData.length,
      upcoming: 0,
      past: 0,
      cancelled: 0
    };

    registrationData.forEach(reg => {
      if (reg.status === 'canceled') {
        stats.cancelled++;
      } else if (reg.event && reg.event.start_date) {
        const eventDate = new Date(reg.event.start_date);
        if (eventDate > now) {
          stats.upcoming++;
        } else {
          stats.past++;
        }
      }
    });

    setStats(stats);
  };

  // Filter registrations based on selected filter
  const filteredRegistrations = registrations.filter(reg => {
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        return reg.status === 'registered' && 
               reg.event && 
               new Date(reg.event.start_date) > now;
      case 'past':
        return reg.status === 'registered' && 
               reg.event && 
               new Date(reg.event.start_date) <= now;
      case 'cancelled':
        return reg.status === 'canceled';
      default:
        return true;
    }
  });

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

  // Handle cancellation
  const handleCancelRegistration = async (registrationId) => {
    if (!window.confirm('Are you sure you want to cancel this registration?')) {
      return;
    }

    try {
      await registrationAPI.cancel(registrationId);
      await fetchRegistrations(); // Refresh the list
      alert('Registration cancelled successfully');
    } catch (err) {
      console.error('Error cancelling registration:', err);
      alert('Failed to cancel registration: ' + err.message);
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
          <h1>My Registrations 🎫</h1>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🎫</div>
              <div className="stat-info">
                <h3>{stats.total}</h3>
                <p>Total Registrations</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <h3>{stats.upcoming}</h3>
                <p>Upcoming Events</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>{stats.past}</h3>
                <p>Attended</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">❌</div>
              <div className="stat-info">
                <h3>{stats.cancelled}</h3>
                <p>Cancelled</p>
              </div>
            </div>
          </div>

          <section className="section">
            <div className="filter-buttons">
              <button 
                className={filter === 'upcoming' ? 'filter-btn active' : 'filter-btn'}
                onClick={() => setFilter('upcoming')}
              >
                Upcoming
              </button>
              <button 
                className={filter === 'past' ? 'filter-btn active' : 'filter-btn'}
                onClick={() => setFilter('past')}
              >
                Past Events
              </button>
              <button 
                className={filter === 'cancelled' ? 'filter-btn active' : 'filter-btn'}
                onClick={() => setFilter('cancelled')}
              >
                Cancelled
              </button>
            </div>

            {error && (
              <div className="alert alert-error" style={{marginBottom: '1rem'}}>
                {error}
              </div>
            )}

            <div className="table-container" style={{marginTop: '1.5rem'}}>
              {loading ? (
                <div className="loading" style={{textAlign: 'center', padding: '2rem'}}>
                  Loading registrations...
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Event Name</th>
                      <th>Type</th>
                      <th>Date & Time</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrations.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="empty-row">
                          <div className="empty-state">
                            <p>🎫 No registrations found</p>
                            {filter !== 'upcoming' && (
                              <p style={{fontSize: '0.9rem', color: '#999'}}>
                                Try switching to "Upcoming" to see future events
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredRegistrations.map((registration) => (
                        <tr key={registration._id}>
                          <td>
                            <strong>{registration.event?.name || 'Unknown Event'}</strong>
                          </td>
                          <td>
                            <span className={`badge badge-${registration.event?.type.toLowerCase() || 'default'}`}>
                              {registration.event?.type || 'Unknown'}
                            </span>
                          </td>
                          <td>
                            <div>
                              {formatDate(registration.event?.start_date)}
                              <br />
                              <small style={{color: '#666'}}>
                                {formatTime(registration.event?.time)}
                              </small>
                            </div>
                          </td>
                          <td>{registration.event?.location || 'TBD'}</td>
                          <td>
                            <span className={`badge ${
                              registration.status === 'registered' ? 'badge-success' :
                              registration.status === 'canceled' ? 'badge-secondary' :
                              'badge-warning'
                            }`}>
                              {registration.status === 'registered' ? '✅ Registered' :
                               registration.status === 'canceled' ? '❌ Cancelled' :
                               registration.status}
                            </span>
                          </td>
                          <td>
                            {registration.status === 'registered' && (
                              <button
                                onClick={() => handleCancelRegistration(registration._id)}
                                className="btn-secondary btn-sm"
                                style={{fontSize: '0.8rem'}}
                              >
                                Cancel
                              </button>
                            )}
                            {registration.status === 'canceled' && (
                              <span style={{color: '#999', fontSize: '0.8rem'}}>
                                Cancelled
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
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

        .badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          display: inline-block;
        }

        .badge-success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .badge-secondary {
          background-color: #e2e3e5;
          color: #383d41;
          border: 1px solid #d6d8db;
        }

        .badge-warning {
          background-color: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }

        .badge-workshop {
          background-color: #e7f3ff;
          color: #0066cc;
        }

        .badge-trip {
          background-color: #f0f9ff;
          color: #0284c7;
        }

        .badge-conference {
          background-color: #f5f3ff;
          color: #7c3aed;
        }

        .badge-bazaar {
          background-color: #fef7ed;
          color: #c2410c;
        }

        .badge-booth {
          background-color: #f0fdf4;
          color: #15803d;
        }

        .btn-sm {
          padding: 0.25rem 0.5rem;
          font-size: 0.8rem;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-sm:hover {
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}
