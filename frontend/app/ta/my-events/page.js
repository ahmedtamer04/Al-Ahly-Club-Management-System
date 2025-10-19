'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import '@/app/dashboard.css';

export default function TAMyEventsPage() {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (!token || !userStr) {
        setError('Not authenticated. Please login.');
        setLoading(false);
        return;
      }

      const user = JSON.parse(userStr);
      const userId = user._id;

      // Use the /:user_id/events endpoint since /my-events might not exist
      const response = await fetch(`http://localhost:5000/api/registration/${userId}/events`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status); // Debug log

      if (!response.ok) {
        throw new Error('Failed to fetch registrations');
      }

      const data = await response.json();
      console.log('Registrations data:', data); // Debug log
      
      setUpcomingEvents(data.upcoming || []);
      setPastEvents(data.past || []);
      setError(null);
    } catch (err) {
      console.error('Error loading registrations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBA';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
  };

  const renderRegistrationCard = (registration) => {
    // Change from registration.event_id to registration.event
    if (!registration.event) {
      console.warn('Registration missing event:', registration);
      return null;
    }

    return (
      <div key={registration._id} className="event-card">
        <h3>{registration.event.name}</h3>
        <p><strong>Type:</strong> {registration.event.type}</p>
        <p><strong>Location:</strong> {registration.event.location}</p>
        <p><strong>Event Date:</strong> {formatDate(registration.event.start_date)}</p>
        <p><strong>Registered On:</strong> {formatDate(registration.registration_date)}</p>
        
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '0.75rem', 
          borderRadius: '4px', 
          marginTop: '0.5rem'
        }}>
          <p style={{ margin: '0.25rem 0' }}><strong>Name:</strong> {registration.name}</p>
          <p style={{ margin: '0.25rem 0' }}><strong>Email:</strong> {registration.email}</p>
          <p style={{ margin: '0.25rem 0' }}><strong>ID:</strong> {registration.personalId}</p>
        </div>

        <button 
          className="btn-primary" 
          onClick={() => setSelectedEvent(registration.event)}
          style={{ marginTop: '1rem', width: '100%' }}
        >
          View Details
        </button>
      </div>
    );
  };

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
          <h1>My Registered Events ✏️</h1>

          {loading && <p>Loading...</p>}

          {error && (
            <div style={{color: 'red', padding: '1rem', backgroundColor: '#ffe6e6', borderRadius: '4px'}}>
              ⚠️ Error: {error}
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                <div className="stat-card">
                  <div className="stat-icon">📅</div>
                  <div className="stat-info">
                    <h3>{upcomingEvents.length}</h3>
                    <p>Upcoming Events</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🕐</div>
                  <div className="stat-info">
                    <h3>{pastEvents.length}</h3>
                    <p>Past Events</p>
                  </div>
                </div>
              </div>

              <section className="section">
                <h2>📅 Upcoming Events</h2>
                {upcomingEvents.length === 0 ? (
                  <div className="empty-state">
                    <p>No upcoming events registered.</p>
                    <Link href="/ta/events">
                      <button className="btn-primary" style={{ marginTop: '1rem' }}>
                        Browse Events
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="events-grid">
                    {upcomingEvents.map(renderRegistrationCard)}
                  </div>
                )}
              </section>

              <section className="section" style={{ marginTop: '2rem' }}>
                <h2>🕐 Past Events</h2>
                {pastEvents.length === 0 ? (
                  <div className="empty-state">
                    <p>No past events.</p>
                  </div>
                ) : (
                  <div className="events-grid">
                    {pastEvents.map(renderRegistrationCard)}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>

      {selectedEvent && (
        <div 
          className="modal-overlay" 
          onClick={() => setSelectedEvent(null)}
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
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto',
              color: '#333'
            }}
          >
            <h2>{selectedEvent.name}</h2>
            <p><strong>Type:</strong> {selectedEvent.type}</p>
            <p><strong>Location:</strong> {selectedEvent.location}</p>
            <p><strong>Start:</strong> {formatDate(selectedEvent.start_date)}</p>
            <p><strong>End:</strong> {formatDate(selectedEvent.end_date)}</p>
            <p><strong>Description:</strong> {selectedEvent.short_description}</p>
            
            <button 
              className="btn-primary" 
              style={{marginTop: '1.5rem', width: '100%'}}
              onClick={() => setSelectedEvent(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
