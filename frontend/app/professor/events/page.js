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
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter states
  const [filterType, setFilterType] = useState('all');
  const [filterProfessor, setFilterProfessor] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterDate, setFilterDate] = useState('');
  
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' for newest first, 'asc' for oldest first
  const [showFilters, setShowFilters] = useState(false);

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

  // Apply search and filters to events
  const applySearchAndFilters = () => {
    if (!events.length) {
      setFilteredEvents([]);
      return;
    }
    
    let result = [...events];
    
    // 1. SEARCH: by event name OR professor name
    if (searchQuery.trim()) {
      const searchStr = searchQuery.toLowerCase();
      result = result.filter(event => {
        const matchesEventName = event.name?.toLowerCase().includes(searchStr);
        const matchesProfessor = 
          event.professors_participating?.toLowerCase().includes(searchStr) ||
          event.faculty_responsible?.toLowerCase().includes(searchStr);
        
        return matchesEventName || matchesProfessor;
      });
    }
    
    // 2. FILTER by Type
    if (filterType !== 'all') {
      result = result.filter(event => {
        const eventType = event.type?.toLowerCase() || '';
        switch(filterType) {
          case 'Bazaar':
            return eventType === 'bazaar' || eventType.includes('bazaar');
          case 'Booth':
            return eventType === 'booth' || eventType.includes('booth');
          case 'Workshop':
            return eventType === 'workshop' || eventType.includes('workshop');
          case 'Conference':
            return eventType === 'conference' || eventType.includes('conference');
          default:
            return true;
        }
      });
    }
    
    // 3. FILTER by Professor Name (for workshops/conferences)
    if (filterProfessor.trim()) {
      const professorStr = filterProfessor.toLowerCase();
      result = result.filter(event => {
        return (
          event.professors_participating?.toLowerCase().includes(professorStr) ||
          event.faculty_responsible?.toLowerCase().includes(professorStr)
        );
      });
    }
    
    // 4. FILTER by Location
    if (filterLocation.trim()) {
      const locationStr = filterLocation.toLowerCase();
      result = result.filter(event => {
        return event.location?.toLowerCase().includes(locationStr);
      });
    }
    
    // 5. FILTER by Date
    if (filterDate) {
      result = result.filter(event => {
        const eventDate = new Date(event.start_date).toISOString().split('T')[0];
        return eventDate === filterDate;
      });
    }
    
    // 6. Apply sorting
    const sorted = sortEvents(result, sortOrder);
    setFilteredEvents(sorted);
    
    console.log('Applied filters:', {
      total: events.length,
      filtered: sorted.length,
      search: searchQuery,
      filters: { filterType, filterProfessor, filterLocation, filterDate }
    });
  };

  // Handle sort order change
  const handleSortChange = () => {
    const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newOrder);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setFilterProfessor('');
    setFilterLocation('');
    setFilterDate('');
  };

  // Update filtered events when any search/filter criteria changes
  useEffect(() => {
    applySearchAndFilters();
  }, [searchQuery, filterType, filterProfessor, filterLocation, filterDate, sortOrder, events]);

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
          <div style={{ marginBottom: '30px' }}>
            <h1 style={{ marginBottom: '10px' }}>All Events</h1>
            <h2 style={{ fontSize: '18px', color: '#666', fontWeight: 'normal' }}>Upcoming Events</h2>
          </div>

          {/* Search and Action Buttons Bar */}
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'stretch',
            marginBottom: '20px',
            flexWrap: 'wrap',
            width: '100%'
          }}>
            <div style={{ 
              flex: '1 1 300px',
              minWidth: '250px'
            }}>
              <input
                type="text"
                placeholder="🔍 Search by event name or professor name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border-color 0.3s',
                  boxSizing: 'border-box',
                  height: '44px'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0066cc'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                background: showFilters ? '#0066cc' : '#f0f0f0',
                color: showFilters ? 'white' : '#333',
                whiteSpace: 'nowrap',
                height: '44px',
                flex: '0 0 auto'
              }}
            >
              {showFilters ? '🔼 Hide Filters' : '🔽 Show Filters'}
            </button>
            <button 
              onClick={handleSortChange} 
              title={sortOrder === 'desc' ? 'Sort by oldest first' : 'Sort by newest first'}
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                background: '#f0f0f0',
                color: '#333',
                whiteSpace: 'nowrap',
                height: '44px',
                flex: '0 0 auto'
              }}
            >
              📅 {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
            </button>
          </div>

          <section className="section">

              {/* Advanced Filters Panel */}
              {showFilters && (
                <div style={{
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  padding: '24px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  border: '1px solid #dee2e6',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}>
                  <h3 style={{
                    margin: '0 0 20px 0',
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#333',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    🎯 Advanced Filters
                  </h3>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '20px'
                  }}>
                    {/* Event Type Filter */}
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '600',
                        fontSize: '13px',
                        color: '#495057'
                      }}>
                        📋 Event Type
                      </label>
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          fontSize: '14px',
                          border: '2px solid #e0e0e0',
                          borderRadius: '8px',
                          outline: 'none',
                          cursor: 'pointer',
                          background: 'white',
                          transition: 'border-color 0.3s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#0066cc'}
                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                      >
                        <option value="all">All Types</option>
                        <option value="Workshop">Workshops</option>
                        <option value="Bazaar">Bazaars</option>
                        <option value="Conference">Conferences</option>
                        <option value="Booth">Booths</option>
                      </select>
                    </div>

                    {/* Professor Name Filter */}
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '600',
                        fontSize: '13px',
                        color: '#495057'
                      }}>
                        👨‍🏫 Professor Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Dr. Smith"
                        value={filterProfessor}
                        onChange={(e) => setFilterProfessor(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          fontSize: '14px',
                          border: '2px solid #e0e0e0',
                          borderRadius: '8px',
                          outline: 'none',
                          transition: 'border-color 0.3s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#0066cc'}
                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                      />
                    </div>

                    {/* Location Filter */}
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '600',
                        fontSize: '13px',
                        color: '#495057'
                      }}>
                        📍 Location
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Main Hall"
                        value={filterLocation}
                        onChange={(e) => setFilterLocation(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          fontSize: '14px',
                          border: '2px solid #e0e0e0',
                          borderRadius: '8px',
                          outline: 'none',
                          transition: 'border-color 0.3s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#0066cc'}
                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                      />
                    </div>

                    {/* Date Filter */}
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '600',
                        fontSize: '13px',
                        color: '#495057'
                      }}>
                        📅 Date
                      </label>
                      <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          fontSize: '14px',
                          border: '2px solid #e0e0e0',
                          borderRadius: '8px',
                          outline: 'none',
                          cursor: 'pointer',
                          transition: 'border-color 0.3s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#0066cc'}
                        onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                      />
                    </div>

                    {/* Clear Button - Spans full width on small screens */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      gridColumn: 'span 1'
                    }}>
                      <button 
                        onClick={handleClearFilters}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          fontSize: '14px',
                          fontWeight: '600',
                          border: '2px solid #dc3545',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          background: 'white',
                          color: '#dc3545',
                          transition: 'all 0.3s'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.background = '#dc3545';
                          e.target.style.color = 'white';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = 'white';
                          e.target.style.color = '#dc3545';
                        }}
                      >
                        ✕ Clear All Filters
                      </button>
                    </div>
                  </div>
                </div>
              )}

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

            {!loading && !error && events.length > 0 && (
              <>
                {/* Results Counter */}
                <div style={{ 
                  padding: '12px 20px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ 
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#495057'
                  }}>
                    📊 Showing <span style={{ color: '#0066cc', fontSize: '16px' }}>
                      {filteredEvents.length > 0 ? filteredEvents.length : events.length}
                    </span> of <span style={{ fontSize: '16px' }}>{events.length}</span> events
                  </div>
                  {(searchQuery || filterType !== 'all' || filterProfessor || filterLocation || filterDate) && (
                    <span style={{ 
                      background: '#0066cc',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      ✓ Filters Active
                    </span>
                  )}
                </div>

                {/* Events Display */}
                {filteredEvents.length === 0 && (searchQuery || filterType !== 'all' || filterProfessor || filterLocation || filterDate) ? (
                  <div className="empty-state">
                    <h3>No Events Found</h3>
                    <p>No events match your search or filter criteria.</p>
                    <button onClick={handleClearFilters} className="btn-primary">
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <div className="events-list">
                    {(filteredEvents.length > 0 ? filteredEvents : events).map((ev) => (
                      <EventCard key={ev._id || ev.id || ev.event_id} event={ev} />
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}