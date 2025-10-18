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
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' for newest first, 'asc' for oldest first

  // Function to sort events by date
  const sortEvents = (events, order) => {
    return [...events].sort((a, b) => {
      const dateA = new Date(a.start_date);
      const dateB = new Date(b.start_date);
      return order === 'asc' ? dateA - dateB : dateB - dateA;
    });
  };

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const data = await eventAPI.getUpcoming();
        const sortedData = sortEvents(data, sortOrder);
        
        console.log('Raw events data:', data.map(ev => ({ id: ev.id, type: ev.type, name: ev.name })));

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

  // Filter events based on search query and type
  const handleSearch = (query, type) => {
    if (!events.length) return;
    
    const searchStr = query.toLowerCase();
    const filtered = events.filter(event => {
      // Type filtering
      if (type !== 'all') {
        // Ensure we have a valid event type
        const eventType = event.type?.toLowerCase() || '';
        
        switch(type) {
          case 'Bazaar':
            // Match both "Bazaar" and any type containing "bazaar"
            return eventType === 'bazaar' || eventType.includes('bazaar');
          case 'Booth':
            // Match both "Booth" and any type containing "booth"
            return eventType === 'booth' || eventType.includes('booth');
          case 'Workshop':
            // Match both "Workshop" and any type containing "workshop"
            return eventType === 'workshop' || eventType.includes('workshop');
          case 'Conference':
            // Match both "Conference" and any type containing "conference"
            return eventType === 'conference' || eventType.includes('conference');
          default:
            return false;
        }
      }
      
      // Text search filtering
      return (
        event.name?.toLowerCase().includes(searchStr) ||
        event.professors_participating?.toLowerCase().includes(searchStr) ||
        event.faculty_responsible?.toLowerCase().includes(searchStr)
      );
    });
    
    console.log('Filtering events:', { 
      type, 
      query: searchStr,
      totalEvents: events.length, 
      filteredCount: filtered.length,
      allTypes: events.map(e => e.type),
      filteredTypes: filtered.map(e => e.type)
    });
    
    // Apply sorting to filtered results
    const sortedFiltered = sortEvents(filtered, sortOrder);
    setFilteredEvents(sortedFiltered);
  };

  // Handle sort order change
  const handleSortChange = () => {
    const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newOrder);
    // Re-sort the current filtered results
    const sorted = sortEvents(filteredEvents, newOrder);
    setFilteredEvents(sorted);
  };

  // Update search when query or type changes
  useEffect(() => {
    handleSearch(searchQuery, searchType);
  }, [searchQuery, searchType, events]);

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
              <div className="search-controls">
                <div className="search-input">
                  <input
                    type="text"
                    placeholder="Search by event name or professor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-box"
                  />
                </div>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="type-filter"
                >
                  <option value="all">All Types</option>
                  <option value="Workshop">Workshops</option>
                  <option value="Bazaar">Bazaars</option>
                  <option value="Conference">Conferences</option>
                  <option value="Booth">Booths</option>
                </select>
                <button 
                  onClick={handleSortChange} 
                  className="btn-secondary"
                  title={sortOrder === 'desc' ? 'Sort by oldest first' : 'Sort by newest first'}
                >
                  📅 {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                </button>
              </div>
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
              {(filteredEvents.length > 0 ? filteredEvents : events).map((ev) => (
                <EventCard key={ev._id || ev.id || ev.event_id} event={ev} />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}