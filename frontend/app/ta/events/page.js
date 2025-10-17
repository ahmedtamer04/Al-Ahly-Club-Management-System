'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function TAEventsPage() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventComments, setEventComments] = useState(null);
  const [loadingComments, setLoadingComments] = useState(false);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterProfessor, setFilterProfessor] = useState('');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

  // Fetch events on component mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Not authenticated. Please login.');
          setLoading(false);
          return;
        }

        const response = await fetch('http://localhost:5000/api/events/upcoming', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.status}`);
        }

        const data = await response.json();
        setEvents(data);
        setFilteredEvents(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Fetch comments when an event is selected
  const fetchEventComments = async (eventId) => {
    try {
      setLoadingComments(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:5000/api/events/${eventId}/comments`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();
      setEventComments(data);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setEventComments({ comments: [], totalComments: 0, averageRating: null });
    } finally {
      setLoadingComments(false);
    }
  };

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setEventComments(null);
    fetchEventComments(event._id);
  };

  // Apply search, filter, and sort whenever dependencies change
  useEffect(() => {
    let result = [...events];

    // 1. Search by event name or professor name
    if (searchTerm) {
      result = result.filter(event => {
        const eventName = event.name?.toLowerCase() || '';
        const searchLower = searchTerm.toLowerCase();
        
        // Search in event name
        if (eventName.includes(searchLower)) return true;

        // Search in professor names (for workshops and conferences)
        if (event.workshop?.professors_participating) {
          return event.workshop.professors_participating.some(prof => 
            prof.toLowerCase().includes(searchLower)
          );
        }
        if (event.conference?.professors_participating) {
          return event.conference.professors_participating.some(prof => 
            prof.toLowerCase().includes(searchLower)
          );
        }

        return false;
      });
    }

    // 2. Filter by type
    if (filterType !== 'all') {
      result = result.filter(event => event.type === filterType);
    }

    // 3. Filter by location
    if (filterLocation) {
      result = result.filter(event => 
        event.location?.toLowerCase().includes(filterLocation.toLowerCase())
      );
    }

    // 4. Filter by professor name - FIXED
    if (filterProfessor) {
      result = result.filter(event => {
        const profLower = filterProfessor.toLowerCase();
        
        // Check workshop professors
        if (event.workshop?.professors_participating && Array.isArray(event.workshop.professors_participating)) {
          const hasMatch = event.workshop.professors_participating.some(prof => {
            // Handle both string and object formats
            const profName = typeof prof === 'string' ? prof : prof.name || '';
            return profName.toLowerCase().includes(profLower);
          });
          if (hasMatch) return true;
        }
        
        // Check conference professors
        if (event.conference?.professors_participating && Array.isArray(event.conference.professors_participating)) {
          const hasMatch = event.conference.professors_participating.some(prof => {
            // Handle both string and object formats
            const profName = typeof prof === 'string' ? prof : prof.name || '';
            return profName.toLowerCase().includes(profLower);
          });
          if (hasMatch) return true;
        }
        
        return false;
      });
    }

    // 5. Sort by date
    result.sort((a, b) => {
      const dateA = new Date(a.start_date);
      const dateB = new Date(b.start_date);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    setFilteredEvents(result);
  }, [events, searchTerm, filterType, filterLocation, filterProfessor, sortOrder]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBA';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterLocation('');
    setFilterProfessor('');
    setSortOrder('asc');
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ color: i <= rating ? '#ffd700' : '#ddd', fontSize: '1.2rem' }}>
          ★
        </span>
      );
    }
    return stars;
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
            <li><Link href="/ta/my-events">✏️ My Events</Link></li>
            <li><Link href="/ta/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <h1>Browse Events 📅</h1>

          {/* Search and Filter Section */}
          <section className="section" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
              {/* Search Bar */}
              <div>
                <input
                  type="text"
                  placeholder="🔍 Search by event name or professor name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              {/* Filters Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {/* Type Filter */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="all">All Types</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Conference">Conference</option>
                  <option value="Trip">Trip</option>
                  <option value="Bazaar">Bazaar</option>
                </select>

                {/* Location Filter */}
                <input
                  type="text"
                  placeholder="Filter by location..."
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />

                {/* Professor Filter */}
                <input
                  type="text"
                  placeholder="Filter by professor..."
                  value={filterProfessor}
                  onChange={(e) => setFilterProfessor(e.target.value)}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />

                {/* Sort By Date */}
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="asc">Sort: Earliest First</option>
                  <option value="desc">Sort: Latest First</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              <button
                onClick={clearFilters}
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Clear All Filters
              </button>
            </div>

            {/* Results Count */}
            <p style={{ color: '#666', marginTop: '1rem' }}>
              Showing {filteredEvents.length} of {events.length} events
            </p>
          </section>

          {/* Events Grid */}
          <section className="section">
            <div className="events-grid">
              {loading && <p>Loading events...</p>}
              
              {error && (
                <div className="error-message" style={{color: 'red', padding: '1rem'}}>
                  ⚠️ Error: {error}
                </div>
              )}

              {!loading && !error && filteredEvents.length === 0 && (
                <div className="empty-state">
                  <p>📅 No events match your search criteria</p>
                </div>
              )}

              {!loading && !error && filteredEvents.length > 0 && (
                filteredEvents.map(event => (
                  <div key={event._id} className="event-card">
                    <h3>{event.name}</h3>
                    <p><strong>Type:</strong> {event.type}</p>
                    <p><strong>Location:</strong> {event.location}</p>
                    <p><strong>Date:</strong> {formatDate(event.start_date)}</p>
                    <p style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {event.short_description}
                    </p>
                    <button 
                      className="btn-primary" 
                      onClick={() => handleViewDetails(event)}
                    >
                      View Details
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </div>

      {/* Modal for event details */}
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
              position: 'relative',
              color: '#333'
            }}
          >
            <button 
              onClick={() => setSelectedEvent(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
            
            <h2>{selectedEvent.name}</h2>
            <p><strong>Type:</strong> {selectedEvent.type}</p>
            <p><strong>Location:</strong> {selectedEvent.location}</p>
            <p><strong>Start Date:</strong> {formatDate(selectedEvent.start_date)}</p>
            <p><strong>End Date:</strong> {formatDate(selectedEvent.end_date)}</p>
            <p><strong>Time:</strong> {selectedEvent.time}</p>
            <p><strong>Description:</strong> {selectedEvent.short_description}</p>
            
            <hr style={{margin: '1.5rem 0'}} />
            
            {/* Conference Details */}
            {selectedEvent.type === 'Conference' && selectedEvent.conference && (
              <div>
                <h3>Conference Details</h3>
                <p><strong>Campus:</strong> {selectedEvent.conference.campus}</p>
                <p><strong>Professors:</strong> {selectedEvent.conference.professors_participating?.join(', ')}</p>
                <p><strong>Website:</strong> <a href={selectedEvent.conference.conference_website} target="_blank" rel="noopener noreferrer">{selectedEvent.conference.conference_website}</a></p>
                <p><strong>Budget:</strong> ${selectedEvent.conference.required_budget}</p>
                <p><strong>Funding Source:</strong> {selectedEvent.conference.funding_source}</p>
                <p><strong>Agenda:</strong></p>
                <p style={{whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '4px'}}>
                  {selectedEvent.conference.full_agenda}
                </p>
              </div>
            )}

            {/* Workshop Details */}
            {selectedEvent.type === 'Workshop' && selectedEvent.workshop && (
              <div>
                <h3>Workshop Details</h3>
                <p><strong>Campus:</strong> {selectedEvent.workshop.campus}</p>
                <p><strong>Professors:</strong> {selectedEvent.workshop.professors_participating?.join(', ')}</p>
                <p><strong>Max Attendees:</strong> {selectedEvent.workshop.max_attendees}</p>
                <p><strong>Materials Needed:</strong> {selectedEvent.workshop.materials_needed?.join(', ')}</p>
                <p><strong>Budget:</strong> ${selectedEvent.workshop.required_budget}</p>
              </div>
            )}

            {/* Trip Details */}
            {selectedEvent.type === 'Trip' && selectedEvent.trip && (
              <div>
                <h3>Trip Details</h3>
                <p><strong>Destination:</strong> {selectedEvent.trip.destination}</p>
                <p><strong>Transportation:</strong> {selectedEvent.trip.transportation_method}</p>
                <p><strong>Max Attendees:</strong> {selectedEvent.trip.max_attendees}</p>
                <p><strong>Price per Person:</strong> ${selectedEvent.trip.price_per_person}</p>
                <p><strong>Itinerary:</strong></p>
                <p style={{whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '4px'}}>
                  {selectedEvent.trip.full_itinerary}
                </p>
              </div>
            )}

            {/* Bazaar Details with Vendors */}
            {selectedEvent.type === 'Bazaar' && (
              <div>
                <h3>Bazaar Details</h3>
                {selectedEvent.bazaar && (
                  <>
                    <p><strong>Theme:</strong> {selectedEvent.bazaar.theme}</p>
                    <p><strong>Total Booths:</strong> {selectedEvent.bazaar.total_booths}</p>
                    <p><strong>Booth Price:</strong> ${selectedEvent.bazaar.booth_price}</p>
                  </>
                )}
                
                {selectedEvent.vendors && selectedEvent.vendors.length > 0 && (
                  <>
                    <h4 style={{marginTop: '1.5rem'}}>Participating Vendors ({selectedEvent.vendors.length})</h4>
                    <div style={{display: 'grid', gap: '1rem', marginTop: '1rem'}}>
                      {selectedEvent.vendors.map((vendor, idx) => (
                        <div key={idx} style={{
                          border: '1px solid #ddd',
                          padding: '1rem',
                          borderRadius: '8px',
                          backgroundColor: '#f9f9f9'
                        }}>
                          <p><strong>🏪 {vendor.business_name}</strong></p>
                          <p><strong>Booth:</strong> {vendor.booth_number || 'TBA'}</p>
                          <p><strong>Products/Services:</strong> {vendor.products_services}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                
                {(!selectedEvent.vendors || selectedEvent.vendors.length === 0) && (
                  <p style={{marginTop: '1rem', fontStyle: 'italic'}}>No vendors registered yet</p>
                )}
              </div>
            )}

            <hr style={{margin: '1.5rem 0'}} />

            {/* Ratings and Comments Section */}
            <div>
              <h3 style={{ marginBottom: '1rem' }}>Ratings & Comments</h3>
              
              {loadingComments && <p>Loading comments...</p>}

              {!loadingComments && eventComments && (
                <>
                  {/* Average Rating Summary */}
                  {eventComments.averageRating && (
                    <div style={{
                      backgroundColor: '#f8f9fa',
                      padding: '1rem',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                          {eventComments.averageRating}
                        </div>
                        <div>{renderStars(Math.round(eventComments.averageRating))}</div>
                      </div>
                      <div style={{ color: '#666' }}>
                        <p>{eventComments.totalRatings} ratings</p>
                        <p>{eventComments.totalComments} comments</p>
                      </div>
                    </div>
                  )}

                  {/* Comments List */}
                  {eventComments.comments && eventComments.comments.length > 0 ? (
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {eventComments.comments.map((comment) => (
                        <div
                          key={comment._id}
                          style={{
                            border: '1px solid #e0e0e0',
                            padding: '1rem',
                            borderRadius: '8px',
                            marginBottom: '1rem',
                            backgroundColor: '#fafafa'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <strong>{comment.user_id?.name || 'Anonymous'}</strong>
                            {comment.rating && (
                              <div>{renderStars(comment.rating)}</div>
                            )}
                          </div>
                          {comment.comment && (
                            <p style={{ margin: '0.5rem 0', color: '#333' }}>{comment.comment}</p>
                          )}
                          <small style={{ color: '#888' }}>
                            {formatDateTime(comment.createdAt)}
                          </small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontStyle: 'italic', color: '#888' }}>No comments yet</p>
                  )}
                </>
              )}
            </div>
            
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
