'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { eventAPI } from '@/utils/api';
import '@/app/dashboard.css';

export default function ViewAllEvents() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterProfessor, setFilterProfessor] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchAllEvents();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [events, searchTerm, filterType, filterLocation, filterProfessor, sortOrder]);

  const fetchAllEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await eventAPI.getAll();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let result = [...events];

    // Search by event name or professor name
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(event => {
        const nameMatch = event.name?.toLowerCase().includes(searchLower);
        const professorMatch = 
          event.workshop?.professors_participating?.some(prof => 
            prof.toLowerCase().includes(searchLower)
          ) ||
          event.conference?.professors_participating?.some(prof => 
            prof.toLowerCase().includes(searchLower)
          );
        return nameMatch || professorMatch;
      });
    }

    // Filter by type
    if (filterType && filterType !== 'all') {
      result = result.filter(event => event.type === filterType);
    }

    // Filter by location
    if (filterLocation) {
      const locationLower = filterLocation.toLowerCase();
      result = result.filter(event => 
        event.location?.toLowerCase().includes(locationLower)
      );
    }

    // Filter by professor
    if (filterProfessor) {
      const profLower = filterProfessor.toLowerCase();
      result = result.filter(event => {
        return (
          event.workshop?.professors_participating?.some(prof => 
            prof.toLowerCase().includes(profLower)
          ) ||
          event.conference?.professors_participating?.some(prof => 
            prof.toLowerCase().includes(profLower)
          )
        );
      });
    }

    // Sort by date
    result.sort((a, b) => {
      const dateA = new Date(a.start_date);
      const dateB = new Date(b.start_date);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    setFilteredEvents(result);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterLocation('');
    setFilterProfessor('');
    setSortOrder('asc');
  };

  const getEventTypeIcon = (type) => {
    const icons = {
      'Workshop': '🎓',
      'Trip': '✈️',
      'Bazaar': '🛍️',
      'Booth': '🏪',
      'Conference': '📊'
    };
    return icons[type] || '📅';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (event) => {
    const now = new Date();
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);

    // Check database status first
    if (event.status === 'cancelled') {
      return <span className="badge badge-danger">❌ Cancelled</span>;
    }
    
    if (event.status === 'completed') {
      return <span className="badge" style={{backgroundColor: '#9c27b0', color: 'white'}}>🎓 Completed</span>;
    }
    
    // Fall back to date-based status
    if (now < startDate) {
      return <span className="badge badge-primary">🔜 Upcoming</span>;
    }
    if (startDate <= now && endDate >= now) {
      return <span className="badge badge-success">▶️ Active</span>;
    }
    // Past end date but not marked as completed
    return <span className="badge" style={{backgroundColor: '#ff9800', color: 'white'}}>⌛ Ended</span>;
  };

  const getVendorsInfo = (event) => {
    if (event.type === 'Bazaar' && event.bazaar?.vendors_participating) {
      return event.bazaar.vendors_participating;
    }
    if (event.type === 'Booth' && event.booth?.vendors) {
      return event.booth.vendors;
    }
    return [];
  };

  const EventDetailsModal = ({ event, onClose }) => {
    if (!event) return null;

    const vendors = getVendorsInfo(event);

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{getEventTypeIcon(event.type)} {event.name}</h2>
            <button onClick={onClose} className="close-btn">×</button>
          </div>
          <div className="modal-body">
            <div className="event-detail-section">
              <h3>Basic Information</h3>
              <p><strong>Type:</strong> {event.type}</p>
              <p><strong>Location:</strong> {event.location}</p>
              <p><strong>Start Date:</strong> {formatDate(event.start_date)}</p>
              <p><strong>End Date:</strong> {formatDate(event.end_date)}</p>
              <p><strong>Time:</strong> {event.time}</p>
              <p><strong>Status:</strong> {getStatusBadge(event)}</p>
              <p><strong>Description:</strong> {event.short_description}</p>
            </div>

            {/* Workshop Details */}
            {event.type === 'Workshop' && event.workshop && (
              <div className="event-detail-section">
                <h3>Workshop Details</h3>
                <p><strong>Faculty:</strong> {event.workshop.faculty_responsible}</p>
                <p><strong>Professors:</strong> {event.workshop.professors_participating?.join(', ')}</p>
                <p><strong>Capacity:</strong> {event.workshop.capacity}</p>
                <p><strong>Registration Deadline:</strong> {formatDate(event.workshop.registration_deadline)}</p>
                <p><strong>Budget:</strong> ${event.workshop.required_budget}</p>
                <p><strong>Funding Source:</strong> {event.workshop.funding_source}</p>
                {event.workshop.full_agenda && (
                  <p><strong>Agenda:</strong> {event.workshop.full_agenda}</p>
                )}
              </div>
            )}

            {/* Conference Details */}
            {event.type === 'Conference' && event.conference && (
              <div className="event-detail-section">
                <h3>Conference Details</h3>
                <p><strong>Campus:</strong> {event.conference.campus}</p>
                <p><strong>Professors:</strong> {event.conference.professors_participating?.join(', ')}</p>
                <p><strong>Budget:</strong> ${event.conference.required_budget}</p>
                <p><strong>Funding Source:</strong> {event.conference.funding_source}</p>
                {event.conference.conference_website && (
                  <p><strong>Website:</strong> <a href={event.conference.conference_website} target="_blank" rel="noopener noreferrer">{event.conference.conference_website}</a></p>
                )}
                {event.conference.full_agenda && (
                  <p><strong>Agenda:</strong> {event.conference.full_agenda}</p>
                )}
              </div>
            )}

            {/* Trip Details */}
            {event.type === 'Trip' && event.trip && (
              <div className="event-detail-section">
                <h3>Trip Details</h3>
                <p><strong>Price:</strong> ${event.trip.price}</p>
                <p><strong>Capacity:</strong> {event.trip.capacity}</p>
                <p><strong>Registration Deadline:</strong> {formatDate(event.trip.registration_deadline)}</p>
              </div>
            )}

            {/* Vendors for Bazaar and Booth */}
            {(event.type === 'Bazaar' || event.type === 'Booth') && vendors.length > 0 && (
              <div className="event-detail-section">
                <h3>Participating Vendors ({vendors.length})</h3>
                <div className="vendors-list">
                  {vendors.map((vendor, index) => (
                    <div key={index} className="vendor-card">
                      <p><strong>Vendor:</strong> {vendor.vendor_name || vendor.vendor_id?.company_name || 'N/A'}</p>
                      {vendor.company_name && <p><strong>Company:</strong> {vendor.company_name}</p>}
                      {vendor.booth_number && <p><strong>Booth:</strong> {vendor.booth_number}</p>}
                      {vendor.booth_assignment && <p><strong>Booth:</strong> {vendor.booth_assignment}</p>}
                      {vendor.products && vendor.products.length > 0 && (
                        <p><strong>Products:</strong> {vendor.products.join(', ')}</p>
                      )}
                      {vendor.payment_status && (
                        <p><strong>Payment:</strong> <span className={`badge badge-${vendor.payment_status === 'paid' ? 'success' : 'warning'}`}>{vendor.payment_status}</span></p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bazaar registration info */}
            {event.type === 'Bazaar' && event.bazaar && (
              <div className="event-detail-section">
                <h3>Bazaar Information</h3>
                <p><strong>Vendor Registration Deadline:</strong> {formatDate(event.bazaar.registration_deadline)}</p>
                <p><strong>Registered Vendors:</strong> {vendors.length}</p>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button onClick={onClose} className="btn-secondary">Close</button>
          </div>
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
            <span className="nav-user">🎯 Events Office</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/eventsoffice">🏠 Dashboard</Link></li>
            <li><Link href="/eventsoffice/events" className="active">📅 View All Events</Link></li>
            <li><Link href="/eventsoffice/conferences">🎓 Conferences</Link></li>
            <li><Link href="/eventsoffice/conferences/create">➕ Create Conference</Link></li>
            <li><Link href="/eventsoffice/trips">✈️ Trips</Link></li>
            <li><Link href="/eventsoffice/bazaars">🛍️ Bazaars</Link></li>
            <li><Link href="/eventsoffice/gym">💪 Gym Sessions</Link></li>
            <li><Link href="/eventsoffice/facilities">🏢 Facilities</Link></li>
            <li><Link href="/eventsoffice/vendors">👥 Vendor Requests</Link></li>
            <li><Link href="/eventsoffice/registrations">📋 Registrations</Link></li>
            <li><Link href="/eventsoffice/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <div className="section-header">
            <h1>📅 All Events</h1>
            <Link href="/eventsoffice" className="btn-secondary">← Back to Dashboard</Link>
          </div>

          {/* Search and Filter Section */}
          <div className="filters-section" style={{ 
            background: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '8px', 
            marginBottom: '24px' 
          }}>
            <h3 style={{ marginBottom: '16px' }}>🔍 Search & Filter</h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '16px',
              marginBottom: '16px'
            }}>
              {/* Search by Name or Professor */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Search by Name or Professor
                </label>
                <input
                  type="text"
                  placeholder="Enter event or professor name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Filter by Type */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Filter by Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="all">All Types</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Conference">Conference</option>
                  <option value="Trip">Trip</option>
                  <option value="Bazaar">Bazaar</option>
                  <option value="Booth">Booth</option>
                </select>
              </div>

              {/* Filter by Location */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Filter by Location
                </label>
                <input
                  type="text"
                  placeholder="Enter location..."
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Filter by Professor */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Filter by Professor
                </label>
                <input
                  type="text"
                  placeholder="Enter professor name..."
                  value={filterProfessor}
                  onChange={(e) => setFilterProfessor(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Sort and Clear Buttons */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontWeight: '500' }}>Sort by Date:</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="asc">Oldest First</option>
                  <option value="desc">Newest First</option>
                </select>
              </div>
              <button 
                onClick={clearFilters} 
                className="btn-secondary"
                style={{ marginLeft: 'auto' }}
              >
                🔄 Clear All Filters
              </button>
            </div>

            {/* Results Count */}
            <div style={{ marginTop: '12px', color: '#666', fontSize: '14px' }}>
              Showing {filteredEvents.length} of {events.length} events
            </div>
          </div>

          {/* Events List */}
          {loading ? (
            <div className="empty-state">
              <p>Loading events...</p>
            </div>
          ) : error ? (
            <div className="empty-state" style={{ color: 'red' }}>
              <p>{error}</p>
              <button onClick={fetchAllEvents} className="btn-primary">Retry</button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="empty-state">
              <p>No events found matching your criteria</p>
              <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
              gap: '20px' 
            }}>
              {filteredEvents.map((event) => {
                const vendors = getVendorsInfo(event);
                return (
                  <div 
                    key={event._id} 
                    className="admin-card"
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div className="admin-icon">{getEventTypeIcon(event.type)}</div>
                      {getStatusBadge(event)}
                    </div>
                    <h3 style={{ margin: '12px 0' }}>{event.name}</h3>
                    <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
                      <p><strong>Type:</strong> {event.type}</p>
                      <p><strong>Location:</strong> {event.location}</p>
                      <p><strong>Date:</strong> {formatDate(event.start_date)}</p>
                      
                      {/* Show professor info for workshops and conferences */}
                      {event.type === 'Workshop' && event.workshop?.professors_participating && (
                        <p><strong>Professors:</strong> {event.workshop.professors_participating.slice(0, 2).join(', ')}
                          {event.workshop.professors_participating.length > 2 && '...'}</p>
                      )}
                      
                      {event.type === 'Conference' && event.conference?.professors_participating && (
                        <p><strong>Professors:</strong> {event.conference.professors_participating.slice(0, 2).join(', ')}
                          {event.conference.professors_participating.length > 2 && '...'}</p>
                      )}
                      
                      {/* Show vendor count for bazaars and booths */}
                      {(event.type === 'Bazaar' || event.type === 'Booth') && (
                        <p><strong>Vendors:</strong> {vendors.length} participating</p>
                      )}
                      
                      <p style={{ marginTop: '8px', color: '#333' }}>{event.short_description?.substring(0, 100)}...</p>
                    </div>
                    <button 
                      className="btn-primary" 
                      style={{ marginTop: '12px', width: '100%' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(event);
                      }}
                    >
                      View Details
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventDetailsModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      )}

      <style jsx>{`
        .badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        .badge-primary { background: #007bff; color: white; }
        .badge-success { background: #28a745; color: white; }
        .badge-warning { background: #ffc107; color: black; }
        .badge-danger { background: #dc3545; color: white; }
        .badge-secondary { background: #6c757d; color: white; }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #ddd;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 24px;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 32px;
          cursor: pointer;
          color: #666;
          line-height: 1;
        }

        .close-btn:hover {
          color: #000;
        }

        .modal-body {
          padding: 20px;
        }

        .event-detail-section {
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid #eee;
        }

        .event-detail-section:last-child {
          border-bottom: none;
        }

        .event-detail-section h3 {
          margin-bottom: 16px;
          color: #333;
          font-size: 18px;
        }

        .event-detail-section p {
          margin: 8px 0;
          line-height: 1.6;
        }

        .vendors-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 16px;
          margin-top: 16px;
        }

        .vendor-card {
          background: #f8f9fa;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #ddd;
        }

        .vendor-card p {
          margin: 6px 0;
          font-size: 14px;
        }

        .modal-footer {
          padding: 20px;
          border-top: 1px solid #ddd;
          display: flex;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
}
