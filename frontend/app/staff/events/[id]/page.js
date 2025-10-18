'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import '@/app/dashboard.css';
import { eventAPI, registrationAPI, getUser } from '@/utils/api';

export default function EventDetailsPage({ params }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        // Fetch event details by ID
        const data = await eventAPI.getById(params.id);
        if (data && data._id) {
          setEvent(data);
        } else {
          setError('Event not found');
        }
      } catch (err) {
        setError(err.message || 'Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadEvent();
    }
  }, [params.id]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!event) return <div>Event not found</div>;

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
            <li><Link href="/staff">🏠 Dashboard</Link></li>
            <li><Link href="/staff/events">📅 Browse Events</Link></li>
            <li><Link href="/staff/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <div className="section">
            <Link href="/staff/events" className="back-button">← Back to Events</Link>
            
            <h1>{event.name}</h1>
            <div className="event-details">
              <div className="event-info">
                <p className="event-type">{event.type}</p>
                <p className="event-location">📍 {event.location}</p>
                <p className="event-time">
                  🗓️ {new Date(event.start_date).toLocaleDateString()} at {event.time}
                </p>
                {event.end_date && (
                  <p className="event-end">
                    Ends: {new Date(event.end_date).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="event-description">
                <h2>Description</h2>
                <p>{event.short_description}</p>
              </div>

              {event.type === 'Workshop' && event.workshop && (
                <div className="workshop-details">
                  <h2>Workshop Details</h2>
                  <p><strong>Faculty:</strong> {event.workshop.faculty_responsible}</p>
                  <p><strong>Professors:</strong> {event.workshop.professors_participating?.join(', ')}</p>
                  <p><strong>Capacity:</strong> {event.workshop.capacity} participants</p>
                  <div className="agenda">
                    <h3>Full Agenda</h3>
                    <p>{event.workshop.full_agenda}</p>
                  </div>
                </div>
              )}

              {event.type === 'Trip' && event.trip && (
                <div className="trip-details">
                  <h2>Trip Details</h2>
                  <p><strong>Price:</strong> {event.trip.price} EGP</p>
                  <p><strong>Capacity:</strong> {event.trip.capacity} participants</p>
                  {event.trip.registration_deadline && (
                    <p><strong>Registration Deadline:</strong> {new Date(event.trip.registration_deadline).toLocaleDateString()}</p>
                  )}
                </div>
              )}

              {event.type === 'Conference' && event.conference && (
                <div className="conference-details">
                  <h2>Conference Details</h2>
                  <p><strong>Campus:</strong> {event.conference.campus}</p>
                  <p><strong>Professors:</strong> {event.conference.professors_participating?.join(', ')}</p>
                  <div className="agenda">
                    <h3>Full Agenda</h3>
                    <p>{event.conference.full_agenda}</p>
                  </div>
                  <p><a href={event.conference.conference_website} target="_blank" rel="noopener noreferrer">Conference Website ↗</a></p>
                </div>
              )}

              <div className="event-actions">
                <button
                  className="btn-primary"
                  onClick={async () => {
                    const user = getUser();
                    if (!user) {
                      alert('You must be logged in to register');
                      return;
                    }

                    const personalId = user.id_number || prompt('Enter your personal ID:');
                    if (!personalId) {
                      alert('Personal ID is required');
                      return;
                    }

                    try {
                      const payload = {
                        event_id: event._id,
                        name: `${user.first_name} ${user.last_name}`,
                        email: user.email,
                        personalId,
                        role: user.role
                      };
                      await registrationAPI.register(payload);
                      alert('Registered successfully');
                    } catch (err) {
                      alert(err.message || 'Registration failed');
                    }
                  }}
                >
                  Register for Event
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}