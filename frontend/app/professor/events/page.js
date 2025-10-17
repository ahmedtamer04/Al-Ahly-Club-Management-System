'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import '@/app/dashboard.css';
import { eventAPI, bazaarAPI } from '@/utils/api';

function EventCard({ event }) {
  // Helper function to format dates nicely
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Helper function to get event type class
  const getEventTypeClass = (type) => {
    if (!type) return '';
    const normalizedType = type.toLowerCase();
    if (normalizedType.includes('workshop')) return 'workshop';
    if (normalizedType.includes('bazaar')) return 'bazaar';
    if (normalizedType.includes('conference')) return 'conference';
    if (normalizedType.includes('booth')) return 'booth';
    return '';
  };

  return (
    <div className="event-card">
      <div className="event-header">
        <h3>
          {event.name}
          <span className={`event-type ${getEventTypeClass(event.type)}`}>
            {event.type}
          </span>
        </h3>
        <div>📅 {formatDate(event.start_date)}
          {event.end_date && event.end_date !== event.start_date && ` - ${formatDate(event.end_date)}`}
        </div>
      </div>
      
      <p>{event.short_description}</p>
      
      <div className="event-meta">
        <div>📍 {event.location || 'TBD'}</div>
        {event.time && <div>🕒 {event.time}</div>}
      </div>

      {event.vendors && event.vendors.length > 0 && (
        <div className="vendors">
          <h4>🏪 Participating Vendors</h4>
          <ul>
            {event.vendors.map((v) => (
              <li key={v._id || v.id}>{v.business_name || v.name || v.company_name || v.company}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ProfessorEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const data = await eventAPI.getUpcoming();

        // If events include vendor IDs or have type Bazaar/Booth, try to enrich with vendor details
        const enriched = await Promise.all((data || []).map(async (ev) => {
          // If event already contains vendors array, return as-is
          if (ev.vendors && ev.vendors.length) return ev;

          // For bazaars or booths, try to fetch bazaar/booth by id to get vendors
          if ((ev.type && ev.type.toLowerCase().includes('bazaar')) || (ev.type && ev.type.toLowerCase().includes('booth'))) {
            try {
              // If event has bazaar_id or id, attempt bazaarAPI.getById
              if (ev.bazaar_id || ev.id) {
                const bazaarId = ev.bazaar_id || ev.id;
                const baz = await bazaarAPI.getById(bazaarId);
                if (baz && baz.vendors) {
                  ev.vendors = baz.vendors;
                  return ev;
                }
              }
            } catch (e) {
              // ignore and fallback
            }
          }

          return ev;
        }));

        if (mounted) {
          setEvents(enriched || data || []);
          setError(null);
        }
      } catch (err) {
        console.error(err);
        if (mounted) setError(err.message || 'Failed to load events');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => { mounted = false; };
  }, []);

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">👨‍🏫 Professor Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/professor">🏠 Dashboard</Link></li>
            <li><Link href="/professor/events">📅 Events</Link></li>
            <li><Link href="/professor/workshops">🎨 My Workshops</Link></li>
            <li><Link href="/professor/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>All Events</h1>

          <section className="section">
            <div className="section-header">
              <h2>Upcoming Events</h2>
            </div>

            {loading && (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading events...</p>
              </div>
            )}
            
            {error && <p className="error">{error}</p>}

            {!loading && !error && events.length === 0 && (
              <div className="empty-state">
                <h3>No Upcoming Events</h3>
                <p>There are no events scheduled at the moment. Check back later!</p>
              </div>
            )}

            <div className="events-list">
              {events.map((ev) => (
                <EventCard key={ev._id || ev.id || ev.event_id} event={ev} />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}