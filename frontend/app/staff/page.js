'use client';

import Link from 'next/link';
import '@/app/dashboard.css';
import { useEffect, useState } from 'react';
import { eventAPI } from '@/utils/api';
import StaffLayout from '@/app/components/StaffLayout';

export default function StaffDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventAPI.getUpcoming()
      .then(data => {
        setEvents(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error('Error fetching events:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <StaffLayout>
      <h1>Welcome, Staff Member! 👋</h1>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <h3>{events.length}</h3>
                <p>Upcoming Events</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎫</div>
              <div className="stat-info">
                <h3>0</h3>
                <p>Registered Events</p>
              </div>
            </div>
            <Link href="/staff/gym/schedule" style={{textDecoration: 'none', color: 'inherit'}}>
              <div className="stat-card" style={{cursor: 'pointer', transition: 'transform 0.2s'}} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div className="stat-icon">💪</div>
                <div className="stat-info">
                  <h3>View</h3>
                  <p>Gym Schedule</p>
                </div>
              </div>
            </Link>
          </div>

          <section className="section">
            <h2>Available Events</h2>
            <p style={{color: '#666', marginTop: '0.5rem'}}>View all upcoming workshops, trips, bazaars and conferences — with full details including locations, dates, capacity and participating vendors.</p>
            {loading ? (
              <div className="empty-state">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="empty-state">
                <p>🎪 No events available</p>
              </div>
            ) : (
              <div className="events-grid">
                {events.map(event => (
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
                ))}
              </div>
            )}
      </section>
    </StaffLayout>
  );
}
