'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { eventAPI, registrationAPI, getUser } from '@/utils/api';
import '@/app/dashboard.css';

export default function RegisterEventPage() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [registering, setRegistering] = useState(false);
  const [formData, setFormData] = useState({
    notes: '',
    specialRequirements: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError('');
      
      const eventsData = await eventAPI.getUpcoming();
      console.log('Available events:', eventsData);
      
      const eventList = Array.isArray(eventsData) ? eventsData : [];
      setEvents(eventList);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    const user = getUser();
    if (!user) {
      alert('Please log in to register for events.');
      return;
    }

    if (!selectedEvent) {
      alert('Please select an event to register for.');
      return;
    }

    try {
      setRegistering(true);
      
      await registrationAPI.register({
        event_id: selectedEvent._id,
        name: user.name,
        email: user.email,
        personalId: user.personalId || user._id,
        role: user.role,
        notes: formData.notes,
        specialRequirements: formData.specialRequirements
      });
      
      alert('Registration submitted successfully!');
      
      // Reset form
      setSelectedEvent(null);
      setFormData({ notes: '', specialRequirements: '' });
      
      // Optionally refresh events to show updated registration status
      fetchEvents();
      
    } catch (err) {
      console.error('Registration failed:', err);
      alert('Registration failed: ' + (err.message || 'Please try again.'));
    } finally {
      setRegistering(false);
    }
  };

  const filteredEvents = events.filter(event =>
    event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <li><Link href="/student/workshops">🔧 Workshops</Link></li>
            <li><Link href="/student/trips">🚌 Trips</Link></li>
            <li><Link href="/student/register">📝 Event Registration</Link></li>
            <li><Link href="/student/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Register for Event ✍️</h1>

          {error && (
            <div className="alert alert-error" style={{marginBottom: '2rem'}}>
              {error}
            </div>
          )}

          <section className="section">
            <h2>Step 1: Select Event</h2>
            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Search for events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="events-grid" style={{marginTop: '1.5rem'}}>
              {loading ? (
                <div style={{textAlign: 'center', padding: '2rem'}}>
                  <p>Loading available events...</p>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="empty-state">
                  <p>📅 {searchTerm ? 'No events match your search' : 'No events available for registration'}</p>
                  <p style={{fontSize: '0.9rem', color: '#999'}}>
                    {searchTerm ? 'Try different search terms' : 'Browse upcoming events or check back later'}
                  </p>
                  <Link href="/student/events" className="btn-primary">Browse Events</Link>
                </div>
              ) : (
                filteredEvents.map((event) => (
                  <div 
                    key={event._id} 
                    className={`event-card ${selectedEvent?._id === event._id ? 'selected' : ''}`}
                    onClick={() => setSelectedEvent(event)}
                    style={{cursor: 'pointer', border: selectedEvent?._id === event._id ? '2px solid #c41e3a' : '1px solid #ddd'}}
                  >
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
                      {event.capacity && (
                        <p><strong>👥 Capacity:</strong> {event.capacity} people</p>
                      )}
                    </div>
                    {selectedEvent?._id === event._id && (
                      <div style={{marginTop: '10px', padding: '10px', backgroundColor: '#f0f8ff', borderRadius: '5px'}}>
                        <p style={{margin: 0, color: '#c41e3a', fontWeight: 'bold'}}>✅ Selected for registration</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {selectedEvent && (
            <section className="section">
              <h2>Step 2: Complete Registration</h2>
              
              {/* Event Summary */}
              <div className="event-summary" style={{
                backgroundColor: '#f9f9f9', 
                padding: '1.5rem', 
                borderRadius: '10px', 
                marginBottom: '2rem',
                border: '1px solid #ddd'
              }}>
                <h3 style={{margin: '0 0 1rem 0', color: '#c41e3a'}}>📅 {selectedEvent.name}</h3>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
                  <div><strong>Type:</strong> {selectedEvent.type}</div>
                  <div><strong>Date:</strong> {new Date(selectedEvent.start_date).toLocaleDateString()}</div>
                  <div><strong>Time:</strong> {selectedEvent.time}</div>
                  <div><strong>Location:</strong> {selectedEvent.location}</div>
                </div>
                {selectedEvent.description && (
                  <p style={{marginTop: '1rem', marginBottom: 0}}><strong>Description:</strong> {selectedEvent.description}</p>
                )}
              </div>

              <form onSubmit={handleRegister} className="settings-form">
                <div className="form-group">
                  <label>Additional Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Any special requests or information..."
                    rows="3"
                    style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%', fontFamily: 'inherit'}}
                  />
                </div>

                <div className="form-group">
                  <label>Special Requirements (Optional)</label>
                  <textarea
                    value={formData.specialRequirements}
                    onChange={(e) => setFormData({...formData, specialRequirements: e.target.value})}
                    placeholder="Dietary restrictions, accessibility needs, etc..."
                    rows="3"
                    style={{padding: '0.75rem', borderRadius: '8px', border: '2px solid #E5E5E5', width: '100%', fontFamily: 'inherit'}}
                  />
                </div>

                <div style={{display: 'flex', gap: '1rem'}}>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={registering}
                    style={{opacity: registering ? 0.7 : 1}}
                  >
                    {registering ? '⏳ Registering...' : '✅ Complete Registration'}
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => {
                      setSelectedEvent(null);
                      setFormData({ notes: '', specialRequirements: '' });
                    }}
                    disabled={registering}
                  >
                    ❌ Cancel
                  </button>
                </div>
              </form>
            </section>
          )}
        </main>
      </div>
      
      <style jsx>{`
        .event-card {
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: all 0.2s ease;
          margin-bottom: 15px;
        }

        .event-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .event-card.selected {
          border-color: #c41e3a !important;
          box-shadow: 0 4px 12px rgba(196, 30, 58, 0.2);
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

        .search-box input {
          width: 100%;
          padding: 12px;
          border: 2px solid #e5e5e5;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .search-box input:focus {
          outline: none;
          border-color: #c41e3a;
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

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #333;
        }
      `}</style>
    </div>
  );
}
