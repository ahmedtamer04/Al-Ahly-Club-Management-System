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
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/admin">🏠 Dashboard</Link></li>
            <li><Link href="/admin/users">👥 Manage Users</Link></li>
            <li><Link href="/admin/events">📅 All Events</Link></li>
            <li><Link href="/admin/registrations">🎫 Registrations</Link></li>
            <li><Link href="/admin/vendors">🏪 Vendor Applications</Link></li>
            <li><Link href="/admin/facilities">🏟️ Facilities</Link></li>
            <li><Link href="/admin/reports">📊 Reports</Link></li>
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
                            onClick={() => window.open(`/admin/events/${event._id}`, '_blank')}
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
