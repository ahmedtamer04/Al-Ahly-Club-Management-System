'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import '@/app/dashboard.css';
import api from '@/utils/api';

// Add some custom styles for the buttons
const styles = `
  .btn-sm {
    padding: 4px 8px;
    font-size: 0.85em;
    margin: 0 2px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
  }

  .btn-secondary {
    background-color: #6c757d;
    color: white;
  }

  .btn-secondary:hover {
    background-color: #5a6268;
  }

  .btn-danger {
    background-color: #dc3545;
    color: white;
  }

  .btn-danger:hover {
    background-color: #c82333;
  }

  .table-container {
    overflow-x: auto;
  }

  .data-table td {
    padding: 12px 8px;
    vertical-align: top;
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
  }

  .modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.4);
    overflow-y: auto;
  }

  .modal.show {
    display: block;
  }

  .modal-content {
    background-color: #fefefe;
    margin: 2% auto;
    padding: 20px;
    border: 1px solid #888;
    width: 90%;
    max-width: 800px;
    border-radius: 8px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
  }

  .modal-title {
    margin: 0;
    color: #333;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #999;
  }

  .close-btn:hover {
    color: #333;
  }

  .event-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .event-detail-item {
    margin-bottom: 0.5rem;
  }

  .event-detail-label {
    font-weight: bold;
    color: #555;
    margin-bottom: 4px;
  }

  .event-detail-value {
    color: #333;
  }

  @media (max-width: 768px) {
    .event-details {
      grid-template-columns: 1fr;
    }
    
    .modal-content {
      width: 95%;
      margin: 5% auto;
    }
  }
`;

// Add styles to head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default function AllEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [registrationCounts, setRegistrationCounts] = useState({}); // New state for registration counts
  const [viewEventModal, setViewEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [stats, setStats] = useState({
    workshops: 0,
    trips: 0,
    bazaars: 0,
    booths: 0,
    conferences: 0
  });

  // Fetch events data
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        console.log('Fetching events from API...');
        
        const response = await api.get('/events/all');
        console.log('Events API response:', response);
        
        // Parse the JSON string response if needed
        let eventsData = response;
        if (typeof response === 'string') {
          eventsData = JSON.parse(response);
        }
        
        console.log('Parsed events data:', eventsData);
        setEvents(eventsData || []);
        
        // Calculate stats
        const eventStats = {
          workshops: eventsData?.filter(e => e.type === 'Workshop').length || 0,
          trips: eventsData?.filter(e => e.type === 'Trip').length || 0,
          bazaars: eventsData?.filter(e => e.type === 'Bazaar').length || 0,
          booths: eventsData?.filter(e => e.type === 'Booth').length || 0,
          conferences: eventsData?.filter(e => e.type === 'Conference').length || 0
        };
        
        console.log('Calculated stats:', eventStats);
        setStats(eventStats);
        
        // Fetch registration counts for each event
        if (eventsData && eventsData.length > 0) {
          await fetchRegistrationCounts(eventsData);
        }
        
      } catch (error) {
        console.error('Error fetching events:', error);
        // If there's an error, keep showing the placeholder
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Function to fetch registration counts for all events
  const fetchRegistrationCounts = async (events) => {
    try {
      // Use the new bulk endpoint to get all registration counts at once
      const response = await api.get('/admin/registrations/counts');
      console.log('Registration counts response:', response);
      
      if (response && response.counts) {
        setRegistrationCounts(response.counts);
      } else {
        // Fallback: set all counts to 0
        const counts = {};
        events.forEach(event => {
          counts[event._id] = 0;
        });
        setRegistrationCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching registration counts:', error);
      // Fallback: set all counts to 0
      const counts = {};
      events.forEach(event => {
        counts[event._id] = 0;
      });
      setRegistrationCounts(counts);
    }
  };

  // Helper function to get event status badge
  const getStatusBadge = (event) => {
    const now = new Date();
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    
    if (event.status === 'cancelled') {
      return <span style={{color: '#f44336', fontWeight: 'bold'}}>❌ Cancelled</span>;
    } else if (now < startDate) {
      return <span style={{color: '#2196f3', fontWeight: 'bold'}}>🔜 Upcoming</span>;
    } else if (now >= startDate && now <= endDate) {
      return <span style={{color: '#4caf50', fontWeight: 'bold'}}>▶️ Active</span>;
    } else {
      return <span style={{color: '#666', fontWeight: 'bold'}}>✅ Completed</span>;
    }
  };

  // Helper function to get event capacity from the correct nested object
  const getEventCapacity = (event) => {
    switch(event.type) {
      case 'Workshop':
        return event.workshop?.capacity || 'N/A';
      case 'Trip':
        return event.trip?.capacity || 'N/A';
      case 'Bazaar':
        // For bazaars, capacity is based on vendor slots
        return event.bazaar?.vendors_participating?.length || 0;
      case 'Booth':
        // For booths, show number of vendor slots
        return event.booth?.vendors?.length || 0;
      case 'Conference':
        return 'Unlimited';
      default:
        return 'N/A';
    }
  };

  // Helper function to get registration count
  const getRegistrationCount = (eventId) => {
    return registrationCounts[eventId] || 0;
  };

  // Filter events based on type and search term
  const filteredEvents = events.filter(event => {
    // Filter by type
    if (filter !== 'all' && event.type !== filter) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return event.name.toLowerCase().includes(searchLower) ||
             event.location.toLowerCase().includes(searchLower) ||
             event.short_description.toLowerCase().includes(searchLower);
    }
    
    return true;
  });

  const handleDeleteEvent = async (eventId, eventName) => {
    if (!confirm(`Are you sure you want to delete the event "${eventName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await api.delete(`/events/delete/${eventId}`);
      // Refresh events list
      const response = await api.get('/events/all');
      let eventsData = response;
      if (typeof response === 'string') {
        eventsData = JSON.parse(response);
      }
      setEvents(eventsData || []);
      
      // Refresh registration counts for the updated events list
      if (eventsData && eventsData.length > 0) {
        await fetchRegistrationCounts(eventsData);
      }
      
      alert('Event deleted successfully!');
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    setViewEventModal(true);
  };

  const EventDetailsModal = ({ isOpen, onClose, event }) => {
    if (!event) return null;

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const renderEventSpecificDetails = () => {
      switch(event.type) {
        case 'Workshop':
          return (
            <div style={{marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px'}}>
              <h4>Workshop Details</h4>
              <div className="event-details">
                {event.workshop?.faculty_responsible && (
                  <div className="event-detail-item">
                    <div className="event-detail-label">Faculty Responsible:</div>
                    <div className="event-detail-value">{event.workshop.faculty_responsible}</div>
                  </div>
                )}
                {event.workshop?.professors_participating && (
                  <div className="event-detail-item">
                    <div className="event-detail-label">Professors:</div>
                    <div className="event-detail-value">{event.workshop.professors_participating.join(', ')}</div>
                  </div>
                )}
                {event.workshop?.required_budget && (
                  <div className="event-detail-item">
                    <div className="event-detail-label">Budget:</div>
                    <div className="event-detail-value">${event.workshop.required_budget}</div>
                  </div>
                )}
                {event.workshop?.funding_source && (
                  <div className="event-detail-item">
                    <div className="event-detail-label">Funding:</div>
                    <div className="event-detail-value">{event.workshop.funding_source}</div>
                  </div>
                )}
              </div>
              {event.workshop?.full_agenda && (
                <div className="event-detail-item">
                  <div className="event-detail-label">Agenda:</div>
                  <div className="event-detail-value">{event.workshop.full_agenda}</div>
                </div>
              )}
            </div>
          );
        case 'Trip':
          return (
            <div style={{marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px'}}>
              <h4>Trip Details</h4>
              <div className="event-details">
                {event.trip?.price && (
                  <div className="event-detail-item">
                    <div className="event-detail-label">Price:</div>
                    <div className="event-detail-value">${event.trip.price}</div>
                  </div>
                )}
                {event.trip?.registration_deadline && (
                  <div className="event-detail-item">
                    <div className="event-detail-label">Registration Deadline:</div>
                    <div className="event-detail-value">{formatDate(event.trip.registration_deadline)}</div>
                  </div>
                )}
              </div>
            </div>
          );
        case 'Conference':
          return (
            <div style={{marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px'}}>
              <h4>Conference Details</h4>
              <div className="event-details">
                {event.conference?.campus && (
                  <div className="event-detail-item">
                    <div className="event-detail-label">Campus:</div>
                    <div className="event-detail-value">{event.conference.campus}</div>
                  </div>
                )}
                {event.conference?.conference_website && (
                  <div className="event-detail-item">
                    <div className="event-detail-label">Website:</div>
                    <div className="event-detail-value">
                      <a href={event.conference.conference_website} target="_blank" rel="noopener noreferrer">
                        {event.conference.conference_website}
                      </a>
                    </div>
                  </div>
                )}
                {event.conference?.required_budget && (
                  <div className="event-detail-item">
                    <div className="event-detail-label">Budget:</div>
                    <div className="event-detail-value">${event.conference.required_budget}</div>
                  </div>
                )}
              </div>
              {event.conference?.full_agenda && (
                <div className="event-detail-item">
                  <div className="event-detail-label">Agenda:</div>
                  <div className="event-detail-value">{event.conference.full_agenda}</div>
                </div>
              )}
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div className={`modal ${isOpen ? 'show' : ''}`} onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">{event.name}</h3>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>
          
          <div className="event-details">
            <div className="event-detail-item">
              <div className="event-detail-label">Type:</div>
              <div className="event-detail-value">
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '0.85em',
                  fontWeight: '500',
                  backgroundColor: 
                    event.type === 'Workshop' ? '#e3f2fd' :
                    event.type === 'Trip' ? '#f3e5f5' :
                    event.type === 'Bazaar' ? '#fff3e0' :
                    event.type === 'Booth' ? '#e8f5e8' :
                    event.type === 'Conference' ? '#fce4ec' : '#f5f5f5',
                  color:
                    event.type === 'Workshop' ? '#1976d2' :
                    event.type === 'Trip' ? '#7b1fa2' :
                    event.type === 'Bazaar' ? '#ef6c00' :
                    event.type === 'Booth' ? '#388e3c' :
                    event.type === 'Conference' ? '#c2185b' : '#666'
                }}>
                  {event.type}
                </span>
              </div>
            </div>
            
            <div className="event-detail-item">
              <div className="event-detail-label">Status:</div>
              <div className="event-detail-value">{getStatusBadge(event)}</div>
            </div>

            <div className="event-detail-item">
              <div className="event-detail-label">Start Date:</div>
              <div className="event-detail-value">{formatDate(event.start_date)}</div>
            </div>

            <div className="event-detail-item">
              <div className="event-detail-label">End Date:</div>
              <div className="event-detail-value">{formatDate(event.end_date)}</div>
            </div>

            <div className="event-detail-item">
              <div className="event-detail-label">Time:</div>
              <div className="event-detail-value">{event.time}</div>
            </div>

            <div className="event-detail-item">
              <div className="event-detail-label">Location:</div>
              <div className="event-detail-value">{event.location}</div>
            </div>

            <div className="event-detail-item">
              <div className="event-detail-label">Capacity:</div>
              <div className="event-detail-value">{getEventCapacity(event)}</div>
            </div>

            <div className="event-detail-item">
              <div className="event-detail-label">Registered:</div>
              <div className="event-detail-value">{getRegistrationCount(event._id)}</div>
            </div>
          </div>

          {event.short_description && (
            <div className="event-detail-item" style={{marginTop: '1rem'}}>
              <div className="event-detail-label">Description:</div>
              <div className="event-detail-value">{event.short_description}</div>
            </div>
          )}

          {renderEventSpecificDetails()}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">⚙️ Admin Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        {viewEventModal && selectedEvent && (
          <EventDetailsModal
            isOpen={viewEventModal}
            onClose={() => {
              setViewEventModal(false);
              setSelectedEvent(null);
            }}
            event={selectedEvent}
          />
        )}
        
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/admin">🏠 Dashboard</Link></li>
            <li><Link href="/admin/users">👥 Manage Users</Link></li>
            <li><Link href="/admin/events">📅 All Events</Link></li>
            <li><Link href="/admin/registrations">🎫 Registrations</Link></li>
            <li><Link href="/admin/vendors">🏪 Vendor Applications</Link></li>
            <li><Link href="/admin/settings">⚙️ Settings</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <div className="page-header">
            <h1>All Events 📅</h1>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🎨</div>
              <div className="stat-info">
                <h3>{stats.workshops}</h3>
                <p>Workshops</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🚌</div>
              <div className="stat-info">
                <h3>{stats.trips}</h3>
                <p>Trips</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎪</div>
              <div className="stat-info">
                <h3>{stats.bazaars}</h3>
                <p>Bazaars</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏪</div>
              <div className="stat-info">
                <h3>{stats.booths}</h3>
                <p>Booths</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎓</div>
              <div className="stat-info">
                <h3>{stats.conferences}</h3>
                <p>Conferences</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <section className="section">
            <div className="filter-bar">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="🔍 Search events by title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-buttons">
                <button 
                  className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('all')}
                >
                  All Events
                </button>
                <button 
                  className={filter === 'Workshop' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('Workshop')}
                >
                  Workshops
                </button>
                <button 
                  className={filter === 'Trip' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('Trip')}
                >
                  Trips
                </button>
                <button 
                  className={filter === 'Bazaar' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('Bazaar')}
                >
                  Bazaars
                </button>
                <button 
                  className={filter === 'Booth' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('Booth')}
                >
                  Booths
                </button>
                <button 
                  className={filter === 'Conference' ? 'filter-btn active' : 'filter-btn'}
                  onClick={() => setFilter('Conference')}
                >
                  Conferences
                </button>
              </div>
            </div>

            {/* Events Table */}
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Event Title</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Capacity</th>
                    <th>Registered</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="empty-row">
                        <div className="empty-state">
                          <p>⏳ Loading events...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="empty-row">
                        <div className="empty-state">
                          <p>📅 No events found</p>
                          {filter !== 'all' && (
                            <p style={{fontSize: '0.9rem', color: '#999'}}>
                              No {filter.toLowerCase()} events match your search criteria
                            </p>
                          )}
                          {searchTerm && (
                            <p style={{fontSize: '0.9rem', color: '#999'}}>
                              Try adjusting your search terms
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((event) => (
                      <tr key={event._id}>
                        <td>
                          <div>
                            <strong>{event.name}</strong>
                            <br/>
                            <small style={{color: '#666', fontSize: '0.85em'}}>
                              {event.short_description}
                            </small>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.85em',
                            fontWeight: '500',
                            backgroundColor: 
                              event.type === 'Workshop' ? '#e3f2fd' :
                              event.type === 'Trip' ? '#f3e5f5' :
                              event.type === 'Bazaar' ? '#fff3e0' :
                              event.type === 'Booth' ? '#e8f5e8' :
                              event.type === 'Conference' ? '#fce4ec' : '#f5f5f5',
                            color:
                              event.type === 'Workshop' ? '#1976d2' :
                              event.type === 'Trip' ? '#7b1fa2' :
                              event.type === 'Bazaar' ? '#ef6c00' :
                              event.type === 'Booth' ? '#388e3c' :
                              event.type === 'Conference' ? '#c2185b' : '#666'
                          }}>
                            {event.type}
                          </span>
                        </td>
                        <td>
                          <div>
                            <strong>{new Date(event.start_date).toLocaleDateString()}</strong>
                            <br/>
                            <small style={{color: '#666'}}>
                              {event.time}
                            </small>
                            {event.end_date !== event.start_date && (
                              <><br/><small style={{color: '#666'}}>
                                to {new Date(event.end_date).toLocaleDateString()}
                              </small></>
                            )}
                          </div>
                        </td>
                        <td>{event.location}</td>
                        <td>{getEventCapacity(event)}</td>
                        <td>{getRegistrationCount(event._id)}</td>
                        <td>{getStatusBadge(event)}</td>
                        <td>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleViewEvent(event)}
                            title="View Event Details"
                          >
                            👁️ View
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteEvent(event._id, event.name)}
                            title="Delete Event"
                            style={{marginLeft: '4px'}}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
