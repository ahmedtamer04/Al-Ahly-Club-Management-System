'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import '@/app/dashboard.css';
import { eventAPI, bazaarAPI } from '@/utils/api';

function EventCard({ event, onViewDetails }) {
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

      <div style={{ marginTop: '15px' }}>
        <button
          onClick={() => onViewDetails(event)}
          style={{
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: '600',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            background: '#0066cc',
            color: 'white',
            transition: 'all 0.3s',
            width: '100%'
          }}
          onMouseOver={(e) => e.target.style.background = '#0052a3'}
          onMouseOut={(e) => e.target.style.background = '#0066cc'}
        >
          📋 View Details
        </button>
      </div>
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
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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

  // Handle view details
  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };

  // Helper function to format dates nicely in modal
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
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
                      <EventCard 
                        key={ev._id || ev.id || ev.event_id} 
                        event={ev}
                        onViewDetails={handleViewDetails}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          {/* Event Details Modal */}
          {showDetailsModal && selectedEvent && (
            <div 
              className="modal-overlay" 
              onClick={() => setShowDetailsModal(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000,
                padding: '20px'
              }}
            >
              <div 
                className="modal-content" 
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  maxWidth: '700px',
                  width: '100%',
                  maxHeight: '90vh',
                  overflow: 'auto',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                }}
              >
                {/* Modal Header */}
                <div style={{
                  padding: '24px',
                  borderBottom: '2px solid #e9ecef',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  position: 'sticky',
                  top: 0,
                  background: 'white',
                  borderRadius: '12px 12px 0 0',
                  zIndex: 1
                }}>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#333' }}>
                      {selectedEvent.name}
                    </h2>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      background: '#0066cc',
                      color: 'white',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {selectedEvent.type}
                    </span>
                  </div>
                  <button 
                    onClick={() => setShowDetailsModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '24px',
                      cursor: 'pointer',
                      color: '#666',
                      padding: '0',
                      marginLeft: '20px',
                      lineHeight: '1'
                    }}
                    title="Close"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Body */}
                <div style={{ padding: '24px' }}>
                  {/* Description */}
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: '700', 
                      color: '#495057',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      📝 Description
                    </h3>
                    <p style={{ margin: 0, lineHeight: '1.6', color: '#666' }}>
                      {selectedEvent.short_description || selectedEvent.description || 'No description available.'}
                    </p>
                  </div>

                  {/* Date & Time */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '24px'
                  }}>
                    <div style={{
                      padding: '16px',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef'
                    }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '600' }}>
                        📅 START DATE
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                        {formatDate(selectedEvent.start_date)}
                      </div>
                    </div>
                    
                    {selectedEvent.end_date && selectedEvent.end_date !== selectedEvent.start_date && (
                      <div style={{
                        padding: '16px',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef'
                      }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '600' }}>
                          📅 END DATE
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                          {formatDate(selectedEvent.end_date)}
                        </div>
                      </div>
                    )}

                    {selectedEvent.time && (
                      <div style={{
                        padding: '16px',
                        background: '#f8f9fa',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef'
                      }}>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '600' }}>
                          🕒 TIME
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                          {selectedEvent.time}
                        </div>
                      </div>
                    )}

                    <div style={{
                      padding: '16px',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef'
                    }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: '600' }}>
                        📍 LOCATION
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                        {selectedEvent.location || 'TBD'}
                      </div>
                    </div>
                  </div>

                  {/* Workshop/Conference Specific Details */}
                  {(selectedEvent.workshop || selectedEvent.conference) && (
                    <div style={{ marginBottom: '24px' }}>
                      <h3 style={{ 
                        fontSize: '16px', 
                        fontWeight: '700', 
                        color: '#495057',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        🎓 Academic Details
                      </h3>
                      
                      <div style={{ 
                        background: '#f8f9fa',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef'
                      }}>
                        {selectedEvent.faculty_responsible && (
                          <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#495057' }}>👨‍🏫 Faculty Responsible:</strong>
                            <div style={{ marginTop: '4px', color: '#666' }}>{selectedEvent.faculty_responsible}</div>
                          </div>
                        )}
                        
                        {selectedEvent.professors_participating && (
                          <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#495057' }}>👥 Professors Participating:</strong>
                            <div style={{ marginTop: '4px', color: '#666' }}>{selectedEvent.professors_participating}</div>
                          </div>
                        )}

                        {(selectedEvent.workshop?.capacity || selectedEvent.conference?.capacity) && (
                          <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#495057' }}>👥 Capacity:</strong>
                            <div style={{ marginTop: '4px', color: '#666' }}>
                              {selectedEvent.workshop?.capacity || selectedEvent.conference?.capacity} participants
                            </div>
                          </div>
                        )}

                        {(selectedEvent.workshop?.registration_deadline || selectedEvent.conference?.registration_deadline) && (
                          <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#495057' }}>⏰ Registration Deadline:</strong>
                            <div style={{ marginTop: '4px', color: '#666' }}>
                              {formatDate(selectedEvent.workshop?.registration_deadline || selectedEvent.conference?.registration_deadline)}
                            </div>
                          </div>
                        )}

                        {(selectedEvent.workshop?.full_agenda || selectedEvent.conference?.full_agenda) && (
                          <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#495057' }}>📋 Full Agenda:</strong>
                            <div style={{ marginTop: '4px', color: '#666', whiteSpace: 'pre-wrap' }}>
                              {selectedEvent.workshop?.full_agenda || selectedEvent.conference?.full_agenda}
                            </div>
                          </div>
                        )}

                        {(selectedEvent.workshop?.required_budget || selectedEvent.conference?.required_budget) && (
                          <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#495057' }}>💰 Required Budget:</strong>
                            <div style={{ marginTop: '4px', color: '#666' }}>
                              ${selectedEvent.workshop?.required_budget || selectedEvent.conference?.required_budget}
                            </div>
                          </div>
                        )}

                        {(selectedEvent.workshop?.funding_source || selectedEvent.conference?.funding_source) && (
                          <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#495057' }}>🏦 Funding Source:</strong>
                            <div style={{ marginTop: '4px', color: '#666' }}>
                              {selectedEvent.workshop?.funding_source || selectedEvent.conference?.funding_source}
                            </div>
                          </div>
                        )}

                        {(selectedEvent.workshop?.extra_resources || selectedEvent.conference?.extra_resources) && (
                          <div>
                            <strong style={{ color: '#495057' }}>📦 Extra Resources:</strong>
                            <div style={{ marginTop: '4px', color: '#666', whiteSpace: 'pre-wrap' }}>
                              {selectedEvent.workshop?.extra_resources || selectedEvent.conference?.extra_resources}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Vendors (for Bazaars/Booths) */}
                  {selectedEvent.vendors && selectedEvent.vendors.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <h3 style={{ 
                        fontSize: '16px', 
                        fontWeight: '700', 
                        color: '#495057',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        🏪 Participating Vendors
                      </h3>
                      <div style={{
                        background: '#f8f9fa',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef'
                      }}>
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                          {selectedEvent.vendors.map((v, idx) => (
                            <li key={v._id || v.id || idx} style={{ marginBottom: '8px', color: '#666' }}>
                              {v.business_name || v.name || v.company_name || v.company}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  {selectedEvent.status && (
                    <div style={{
                      padding: '16px',
                      background: selectedEvent.status === 'approved' ? '#d4edda' : '#fff3cd',
                      borderRadius: '8px',
                      border: `1px solid ${selectedEvent.status === 'approved' ? '#c3e6cb' : '#ffeeba'}`,
                      marginTop: '16px'
                    }}>
                      <strong style={{ color: '#495057' }}>📊 Status:</strong>
                      <span style={{ 
                        marginLeft: '8px',
                        textTransform: 'uppercase',
                        fontWeight: '600',
                        color: selectedEvent.status === 'approved' ? '#155724' : '#856404'
                      }}>
                        {selectedEvent.status}
                      </span>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div style={{
                  padding: '16px 24px',
                  borderTop: '1px solid #e9ecef',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  position: 'sticky',
                  bottom: 0,
                  background: 'white',
                  borderRadius: '0 0 12px 12px'
                }}>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    style={{
                      padding: '10px 24px',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: '#6c757d',
                      color: 'white',
                      transition: 'all 0.3s'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#5a6268'}
                    onMouseOut={(e) => e.target.style.background = '#6c757d'}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}