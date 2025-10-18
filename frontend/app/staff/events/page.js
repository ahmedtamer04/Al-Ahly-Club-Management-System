'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import '@/app/dashboard.css';
import { eventAPI } from '@/utils/api';

export default function StaffEventsPage() {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Fetch events and sort them
    eventAPI.getUpcoming()
      .then(data => {
        console.log('Fetched events:', data); // Debug log
        let sortedEvents = Array.isArray(data) ? [...data] : [];
        sortedEvents.sort((a, b) => {
          const dateA = new Date(a.start_date);
          const dateB = new Date(b.start_date);
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });
        setEvents(sortedEvents);
      })
      .catch(err => {
        console.error('Error fetching events:', err);
      });
  }, [sortOrder]);

  // Filter events based on search and type
  const filteredEvents = events.filter(event => {
    const matchesFilter = filter === 'all' || event.type === filter;
    const searchLower = searchTerm.toLowerCase();
    
    // Check professor names in workshop and conference events
    const professorMatches = 
      (event.workshop?.professors_participating?.some(prof => 
        prof.toLowerCase().includes(searchLower))) ||
      (event.conference?.professors_participating?.some(prof => 
        prof.toLowerCase().includes(searchLower)));

    const matchesSearch = !searchTerm || 
      event.name?.toLowerCase().includes(searchLower) ||
      event.type?.toLowerCase().includes(searchLower) ||
      event.location?.toLowerCase().includes(searchLower) ||
      professorMatches;
    
    return matchesFilter && matchesSearch;
  });

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
            <li>
              <Link href="/staff">🏠 Dashboard</Link>
            </li>
            <li>
              <Link href="/staff/events">📅 Browse Events</Link>
            </li>
            <li>
              <Link href="/staff/profile">👤 Profile</Link>
            </li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Browse Events 📅</h1>

          <section className="section">
            <div className="filter-bar">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="🔍 Search by event name, professor, type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  style={{
                    padding: '8px',
                    marginLeft: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                >
                  <option value="asc">📅 Date (Earliest First)</option>
                  <option value="desc">📅 Date (Latest First)</option>
                </select>
              </div>
              <div className="filter-buttons">
                <button
                  className={filter === "all" ? "filter-btn active" : "filter-btn"}
                  onClick={() => setFilter("all")}
                >
                  All Events
                </button>
                <button
                  className={filter === "Workshop" ? "filter-btn active" : "filter-btn"}
                  onClick={() => setFilter("Workshop")}
                >
                  Workshops
                </button>
                <button
                  className={filter === "Conference" ? "filter-btn active" : "filter-btn"}
                  onClick={() => setFilter("Conference")}
                >
                  Conferences
                </button>
              </div>
            </div>

              <p style={{color: '#666', marginTop: '0.25rem'}}>Events are workshops, trips, bazaars and conferences; click a card to view full details and registration options.</p>

              <div className="events-grid">
              {filteredEvents.length === 0 ? (
                <div className="empty-state">
                  <p>📅 No events available</p>
                </div>
              ) : (
                filteredEvents.map(event => (
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
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
