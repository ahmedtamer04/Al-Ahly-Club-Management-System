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
  const [selectedRegistration, setSelectedRegistration] = useState(null);

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
      const response = await fetch(`http://localhost:5001/api/registration/${userId}/events`, {
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

  // Helper function to check if registration can be canceled (at least 2 weeks before)
  const canCancelRegistration = (event) => {
    if (!event || !event.start_date) return false;
    const eventStart = new Date(event.start_date);
    const now = new Date();
    const daysUntilEvent = (eventStart - now) / (1000 * 60 * 60 * 24);
    return daysUntilEvent >= 14; // 14 days = 2 weeks
  };

  // Helper function to get days until event
  const getDaysUntilEvent = (event) => {
    if (!event || !event.start_date) return 0;
    const eventStart = new Date(event.start_date);
    const now = new Date();
    const daysUntilEvent = Math.ceil((eventStart - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysUntilEvent);
  };

  // Handle cancel registration
  const handleCancelRegistration = async (registrationId, eventName) => {
    if (!window.confirm(`Are you sure you want to cancel your registration for "${eventName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/registration/cancel/${registrationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Show success message with refund info if applicable
        let alertMessage = data.message || 'Registration cancelled successfully!';
        if (data.refund) {
          alertMessage = `Registration cancelled successfully!\n\nRefund: $${data.refund.amount} has been added to your wallet.`;
        }
        alert(alertMessage);
        
        // Reload registrations
        await loadRegistrations();
        
        // Close modal if open
        setSelectedEvent(null);
        setSelectedRegistration(null);
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to cancel registration');
      }
    } catch (err) {
      console.error('Error canceling registration:', err);
      alert('Failed to cancel registration. Please try again.');
    }
  };

  const renderRegistrationCard = (registration) => {
    // Check both registration.event and registration.event_id for backward compatibility
    const event = registration.event || registration.event_id;
    
    if (!event) {
      console.warn('Registration missing event:', registration);
      return null;
    }

    console.log('Rendering card for event:', { 
      eventName: event.name, 
      eventType: event.type,
      registrationId: registration._id,
      fullRegistration: registration,
      fullEvent: event
    });

    return (
      <div key={registration._id} className="event-card">
        <h3>{event.name}</h3>
        <p><strong>Type:</strong> {event.type}</p>
        <p><strong>Location:</strong> {event.location}</p>
        <p><strong>Event Date:</strong> {formatDate(event.start_date)}</p>
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
          onClick={() => {
            console.log('Button clicked - Setting state:', { event, registration });
            setSelectedEvent(event);
            setSelectedRegistration(registration);
          }}
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
            <li><Link href="/ta/payment-history">💰 Payment History</Link></li>
            <li><Link href="/polls-voting">📊 Vote for Vendors</Link></li>
            <li><Link href="/loyalty-program">🎁 Loyalty Program</Link></li>
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
            
            {/* Cancel Registration Section */}
            {(() => {
              console.log('Modal Debug:', {
                hasSelectedRegistration: !!selectedRegistration,
                hasSelectedEvent: !!selectedEvent,
                eventType: selectedEvent?.type,
                isWorkshop: selectedEvent?.type === 'Workshop',
                isTrip: selectedEvent?.type === 'Trip',
                shouldShowCancel: selectedRegistration && (selectedEvent?.type === 'Workshop' || selectedEvent?.type === 'Trip')
              });
              
              return selectedRegistration && (selectedEvent.type === 'Workshop' || selectedEvent.type === 'Trip') && (
                <div style={{
                  marginTop: '24px',
                  padding: '20px',
                  background: canCancelRegistration(selectedEvent) 
                    ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)'
                    : 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
                  borderRadius: '8px',
                  border: `2px solid ${canCancelRegistration(selectedEvent) ? '#28a745' : '#f5c6cb'}`,
                  textAlign: 'center'
                }}>
                  <h3 style={{ 
                    margin: '0 0 12px 0',
                    fontSize: '18px',
                    color: canCancelRegistration(selectedEvent) ? '#155724' : '#721c24',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}>
                    ✓ You are Registered
                  </h3>
                  <p style={{ margin: '0 0 16px 0', color: canCancelRegistration(selectedEvent) ? '#155724' : '#721c24', fontWeight: '500' }}>
                    Registration ID: {selectedRegistration._id}
                  </p>
                  {canCancelRegistration(selectedEvent) ? (
                    <>
                      <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#155724' }}>
                        ⏰ You can cancel up to 2 weeks before the event starts
                      </p>
                      <button
                        onClick={() => handleCancelRegistration(selectedRegistration._id, selectedEvent.name)}
                        style={{
                          padding: '10px 24px',
                          fontSize: '14px',
                          fontWeight: '600',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: '#dc3545',
                          color: 'white',
                          transition: 'all 0.3s',
                          marginTop: '10px'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#c82333'}
                        onMouseOut={(e) => e.target.style.background = '#dc3545'}
                      >
                        ✕ Cancel Registration
                      </button>
                    </>
                  ) : (
                    <div style={{
                      padding: '12px 16px',
                      background: 'rgba(0,0,0,0.1)',
                      borderRadius: '6px',
                      marginTop: '12px',
                      fontSize: '13px',
                      color: '#721c24'
                    }}>
                      ⚠️ Cancellation deadline has passed (less than 2 weeks before event)
                    </div>
                  )}
                </div>
              );
            })()}
            
            <button 
              className="btn-primary" 
              style={{marginTop: '1.5rem', width: '100%'}}
              onClick={() => {
                setSelectedEvent(null);
                setSelectedRegistration(null);
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
