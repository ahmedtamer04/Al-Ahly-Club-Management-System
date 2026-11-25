'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { eventAPI, registrationAPI, getUser } from '@/utils/api';
import PaymentModal from '@/app/components/PaymentModal';
import Breadcrumb from '@/app/components/Breadcrumb';
import { ToastProvider, useToast } from '@/app/components/ToastContainer';
import StudentLayout from '@/app/components/StudentLayout';
import WaitlistButton from '@/app/components/WaitlistButton';
import '@/app/dashboard.css';
import '@/app/utilities.css';

export default function BrowseEventsPage() {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [registering, setRegistering] = useState(null);
  const [favorites, setFavorites] = useState(new Set()); // NEW: Track favorites
  const [registeredEventIds, setRegisteredEventIds] = useState(new Set()); // Track registered events
  const [selectedEvent, setSelectedEvent] = useState(null); // Track selected event
  
  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  
  // Advanced filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterProfessor, setFilterProfessor] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Fetch events when component mounts
  useEffect(() => {
    fetchEvents();
    loadFavorites(); // NEW: Load favorites on mount
    loadRegistrationsFromDB(); // Load registered events from database
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const eventData = await eventAPI.getUpcoming();
      console.log('Events fetched:', eventData);
      const sortedData = sortEvents(eventData || [], sortOrder);
      setEvents(sortedData);
      
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message || 'Failed to load events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Load registered events from database
  const loadRegistrationsFromDB = async () => {
    try {
      const user = getUser();
      if (!user) return;

      const response = await registrationAPI.getMyRegistrations(user._id);
      const registeredIds = new Set();
      if (response.upcoming) {
        response.upcoming.forEach(reg => {
          registeredIds.add(reg.event_id._id || reg.event_id);
        });
      }
      setRegisteredEventIds(registeredIds);
    } catch (err) {
      console.error('Error loading registrations:', err);
    }
  };

  // NEW: Load user's favorites
  const loadFavorites = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/favorites', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const favoriteEvents = await response.json();
        const favoriteIds = new Set(favoriteEvents.map(event => event._id));
        setFavorites(favoriteIds);
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
    }
  };

  // NEW: Toggle favorite status
  const toggleFavorite = async (event) => {
    try {
      const token = localStorage.getItem('token');
      const isFav = favorites.has(event._id);

      if (isFav) {
        // Remove from favorites
        const response = await fetch(`/api/favorites/${event._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const newFavorites = new Set(favorites);
          newFavorites.delete(event._id);
          setFavorites(newFavorites);
          
          // Show notification
          const notification = document.createElement('div');
          notification.textContent = '⭐ Removed from favorites!';
          notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #dc3545; color: white; padding: 1rem 2rem; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
          document.body.appendChild(notification);
          setTimeout(() => notification.remove(), 3000);
        }
      } else {
        // Add to favorites
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ event_id: event._id })
        });

        if (response.ok) {
          const newFavorites = new Set(favorites);
          newFavorites.add(event._id);
          setFavorites(newFavorites);
          
          // Show notification
          const notification = document.createElement('div');
          notification.textContent = '⭐ Added to favorites!';
          notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 1rem 2rem; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
          document.body.appendChild(notification);
          setTimeout(() => notification.remove(), 3000);
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      alert('Failed to update favorites. Please try again.');
    }
  };

  // NEW: Check if event is in favorites
  const isFavorite = (eventId) => {
    return favorites.has(eventId);
  };

  // Format date with time
  const formatDateTime = (date) => {
    if (!date) return 'TBD';
    return new Date(date).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to sort events by date
  const sortEvents = (events, order) => {
    return [...events].sort((a, b) => {
      const dateA = new Date(a.start_date);
      const dateB = new Date(b.start_date);
      return order === 'asc' ? dateA - dateB : dateB - dateA;
    });
  };

  // Apply search and filters to events
  const applySearchAndFilters = () => {
    if (!events.length) {
      setFilteredEvents([]);
      return;
    }
    
    let result = [...events];
    
    // 1. SEARCH: by event name OR professor name
    if (searchTerm.trim()) {
      const searchStr = searchTerm.toLowerCase();
      result = result.filter(event => {
        const matchesEventName = event.name?.toLowerCase().includes(searchStr);
        const matchesProfessor = 
          event.workshop?.professors_participating?.some(prof => prof.toLowerCase().includes(searchStr)) ||
          event.workshop?.faculty_responsible?.toLowerCase().includes(searchStr) ||
          event.conference?.professors_participating?.some(prof => prof.toLowerCase().includes(searchStr));
        
        return matchesEventName || matchesProfessor;
      });
    }
    
    // 2. FILTER by Type
    if (filterType !== 'all') {
      result = result.filter(event => {
        const eventType = event.type?.toLowerCase() || '';
        return eventType === filterType.toLowerCase();
      });
    }
    
    // 3. FILTER by Professor Name (for workshops/conferences)
    if (filterProfessor.trim()) {
      const professorStr = filterProfessor.toLowerCase();
      result = result.filter(event => {
        return (
          event.workshop?.professors_participating?.some(prof => prof.toLowerCase().includes(professorStr)) ||
          event.workshop?.faculty_responsible?.toLowerCase().includes(professorStr) ||
          event.conference?.professors_participating?.some(prof => prof.toLowerCase().includes(professorStr))
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
  };

  // Handle sort order change
  const handleSortChange = () => {
    const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newOrder);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterProfessor('');
    setFilterLocation('');
    setFilterDate('');
  };

  // Update filtered events when any search/filter criteria changes
  useEffect(() => {
    applySearchAndFilters();
  }, [searchTerm, filterType, filterProfessor, filterLocation, filterDate, sortOrder, events]);

  // Handle registration
  const handleRegister = async (event) => {
    const confirmMessage = `Are you sure you want to register for "${event.name}"?\n\n` +
      `Date: ${formatDateTime(event.start_date)}\n` +
      `Location: ${event.location}\n` +
      '\nClick OK to confirm your registration.';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setRegistering(event._id);
      const user = getUser();
      const token = localStorage.getItem('token');
      
      console.log('Registration attempt - User data:', user);
      
      if (!user || !token) {
        throw new Error('You must be logged in to register for events');
      }

      // Build user name from available fields
      const userName = user.name || 
                     (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : '') ||
                     user.username ||
                     'Student User';
      
      // Get personal ID from available fields
      const userPersonalId = user.personalId || user.id_number || user.student_id || user._id;
      
      // Get email from available fields  
      const userEmail = user.email || `${user.username || user._id}@university.edu`;
      
      // Get role from available fields
      const userRole = user.role || 'Student';
      
      console.log('Registration data to send:', {
        event_id: event._id,
        name: userName,
        email: userEmail,
        personalId: userPersonalId,
        role: userRole
      });

      const response = await registrationAPI.register({
        event_id: event._id,
        name: userName,
        email: userEmail,
        personalId: userPersonalId,
        role: userRole
      });

      // Refresh events to show updated capacity
      await fetchEvents();
      
      // Check if event requires payment
      const eventPrice = event.workshop?.price || event.trip?.price || 0;
      
      if (eventPrice > 0) {
        // Show payment modal
        setPaymentData({
          eventId: event._id,
          registrationId: response.registration._id,
          amount: eventPrice,
          eventName: event.name,
          eventType: event.type
        });
        setShowPaymentModal(true);
      } else {
        // Free event - registration complete
        alert('Successfully registered for the event!');
      }
      
    } catch (err) {
      console.error('Registration error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        error: err
      });
      
      // Show more specific error messages based on response
      if (err.response?.data?.message) {
        alert('Registration failed: ' + err.response.data.message);
      } else if (err.message?.includes('already registered')) {
        alert('You are already registered for this event.');
      } else if (err.message?.includes('capacity') || err.message?.includes('full')) {
        alert('Sorry, this event is full.');
      } else if (err.message?.includes('deadline') || err.message?.includes('closed')) {
        alert('Registration deadline has passed.');
      } else if (err.message?.includes('role')) {
        alert('Invalid user role. Please contact support.');
      } else {
        alert('Failed to register: ' + (err.message || 'Unknown error occurred'));
      }
    } finally {
      setRegistering(null);
    }
  };

  const handlePaymentSuccess = async (payment) => {
    console.log('Payment successful:', payment);
    setShowPaymentModal(false);
    setPaymentData(null);
    await fetchEvents();
    alert('Payment completed! Registration confirmed.');
  };

  const handlePaymentModalClose = async () => {
    if (paymentData?.registrationId) {
      // User closed modal without paying - cancel the pending registration
      try {
        const token = localStorage.getItem('token');
        await fetch(`/api/registration/cancel-unpaid/${paymentData.registrationId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('Unpaid registration canceled');
      } catch (error) {
        console.error('Error canceling unpaid registration:', error);
      }
    }
    setShowPaymentModal(false);
    setPaymentData(null);
    await fetchEvents();
  };

  // Helper function to check if event is already registered
  const isAlreadyRegistered = (event) => {
    return registeredEventIds.has(event._id || event.id);
  };

  // Helper function to check if registration can be canceled (at least 2 weeks before)
  const canCancelRegistration = (event) => {
    if (!event || !event.start_date) return false;
    const eventStart = new Date(event.start_date);
    const now = new Date();
    const daysUntilEvent = (eventStart - now) / (1000 * 60 * 60 * 24);
    return daysUntilEvent >= 14; // 14 days = 2 weeks
  };

  // Helper function to get days until event
  const getDaysUntilEvent = (event) => {
    if (!event || !event.start_date) return 0;
    const eventStart = new Date(event.start_date);
    const now = new Date();
    const daysUntilEvent = Math.ceil((eventStart - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysUntilEvent);
  };

  // Handle cancel registration
  const handleCancelRegistration = async (eventId) => {
    // Check if cancellation deadline has passed
    const event = events.find(e => (e._id || e.id) === eventId);
    if (event && !canCancelRegistration(event)) {
      alert(`Cannot cancel registration within 2 weeks of event start. Event starts in ${getDaysUntilEvent(event)} days.`);
      return;
    }

    if (!window.confirm('Are you sure you want to cancel your registration for this event?')) {
      return;
    }

    try {
      // Find the registration ID
      const user = getUser();
      if (!user) return;

      const response = await registrationAPI.getMyRegistrations(user._id);
      const registration = response.upcoming?.find(reg => 
        (reg.event_id._id || reg.event_id) === eventId
      );

      if (!registration) {
        alert('Registration not found');
        return;
      }

      await registrationAPI.cancel(registration._id);
      
      // Update local state
      const updatedEventIds = new Set(registeredEventIds);
      updatedEventIds.delete(eventId);
      setRegisteredEventIds(updatedEventIds);
      
      // Refresh events
      await loadRegistrationsFromDB();
      await fetchEvents();
      
      alert('Registration canceled successfully!');
    } catch (err) {
      console.error('Error canceling registration:', err);
      alert('Failed to cancel registration. Please try again.');
    }
  };

  return (
    <StudentLayout>
      <h1>Browse Events 📅</h1>

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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                      <option value="Trip">Trips</option>
                      <option value="Bazaar">Bazaars</option>
                      <option value="Booth">Booths</option>
                      <option value="Conference">Conferences</option>
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

                  {/* Clear Button */}
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

            {/* Results Counter */}
            {!loading && !error && events.length > 0 && (
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
                    {filteredEvents.length}
                  </span> of <span style={{ fontSize: '16px' }}>{events.length}</span> events
                </div>
                {(searchTerm || filterType !== 'all' || filterProfessor || filterLocation || filterDate) && (
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
            )}

            {/* Events Grid */}
            <div className="events-grid">
              {loading ? (
                <div className="loading-state">
                  <p>Loading events...</p>
                </div>
              ) : error ? (
                <div className="error-state">
                  <p>Error: {error}</p>
                  <button onClick={fetchEvents} className="btn-primary">
                    Try Again
                  </button>
                </div>
              ) : events.length === 0 ? (
                <div className="empty-state">
                  <p>📅 No events available</p>
                  <p style={{fontSize: '0.9rem', color: '#999'}}>
                    Check back later for upcoming events
                  </p>
                </div>
              ) : filteredEvents.length === 0 && (searchTerm || filterType !== 'all' || filterProfessor || filterLocation || filterDate) ? (
                <div className="empty-state">
                  <p>📅 No events found matching your criteria</p>
                  <p style={{fontSize: '0.9rem', color: '#999'}}>
                    Try adjusting your search terms or filters
                  </p>
                  <button onClick={handleClearFilters} className="btn-primary" style={{marginTop: '10px'}}>
                    Clear Filters
                  </button>
                </div>
              ) : (
                (filteredEvents.length > 0 ? filteredEvents : events).map((event) => (
                  <div key={event._id} className="event-card">
                    <div className="event-header">
                      <h3>{event.name}</h3>
                      <span className={`event-type event-type-${event.type?.toLowerCase() || 'default'}`}>
                        {event.type}
                      </span>
                    </div>
                    <div className="event-details">
                      <p><strong>📍 Location:</strong> {event.location}</p>
                      <p><strong>📅 Starts:</strong> {formatDateTime(event.start_date)}</p>
                      <p><strong>📅 Ends:</strong> {formatDateTime(event.end_date)}</p>
                      <p><strong>⌚ Time:</strong> {event.time}</p>
                      <p><strong>📝 Description:</strong> {event.short_description}</p>
                      
                      {event.type === 'Workshop' && event.workshop && (
                        <>
                          <p><strong>👨‍🏫 Faculty:</strong> {event.workshop.faculty_responsible}</p>
                          <p><strong>👥 Professors:</strong> {event.workshop.professors_participating?.join(', ')}</p>
                          <p><strong>🎯 Capacity:</strong> {event.workshop.capacity}</p>
                        </>
                      )}
                      
                      {event.type === 'Trip' && event.trip && (
                        <>
                          <p><strong>💰 Price:</strong> ${event.trip.price}</p>
                          <p><strong>🎯 Capacity:</strong> {event.trip.capacity}</p>
                        </>
                      )}
                      
                      {event.type === 'Conference' && event.conference && (
                        <>
                          <p><strong>🏛️ Campus:</strong> {event.conference.campus}</p>
                          <p><strong>👥 Professors:</strong> {event.conference.professors_participating?.join(', ')}</p>
                        </>
                      )}
                    </div>
                    
                    <div className="event-actions">
                      {/* View Details Button */}
                      <Link 
                        href={`/student/events/${event._id}`}
                        className="btn-secondary"
                        style={{ 
                          textDecoration: 'none', 
                          display: 'inline-block',
                          marginBottom: '0.75rem',
                          width: '100%',
                          textAlign: 'center'
                        }}
                      >
                        📋 View Event Details
                      </Link>

                      {/* Capacity display for events with capacity */}
                      {(event.type === 'Workshop' || event.type === 'Trip') && event.available_spots !== undefined && (
                        <div style={{
                          padding: '0.5rem',
                          background: event.available_spots === 0 ? '#fff3cd' : '#d4edda',
                          borderRadius: '6px',
                          marginBottom: '0.5rem',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          color: event.available_spots === 0 ? '#856404' : '#155724',
                          textAlign: 'center'
                        }}>
                          {event.available_spots === 0 
                            ? '🔴 Event Full' 
                            : `✅ ${event.available_spots} spots available`
                          }
                        </div>
                      )}

                      {/* NEW: Favorite button and Register/Waitlist button side by side */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        {event.registration_open && !event.is_full && event.available_spots > 0 ? (
                          <button 
                            className="register-btn"
                            onClick={() => handleRegister(event)}
                            disabled={registering === event._id}
                            style={{ flex: 1 }}
                          >
                            {registering === event._id ? 'Registering...' : 'Register Now'}
                          </button>
                        ) : (event.is_full || event.available_spots === 0) && event.registration_open && !isAlreadyRegistered(event) ? (
                          <div style={{ flex: 1 }}>
                            <WaitlistButton event={event} onUpdate={fetchEvents} />
                          </div>
                        ) : event.is_full || event.available_spots === 0 ? (
                          <div className="event-full-notice" style={{ flex: 1, textAlign: 'center' }}>
                            This event is full
                          </div>
                        ) : (
                          <div className="registration-closed-notice" style={{ flex: 1, textAlign: 'center' }}>
                            Registration closed
                          </div>
                        )}
                        
                        {/* NEW: Favorite button */}
                        <button 
                          onClick={() => toggleFavorite(event)}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: isFavorite(event._id) ? '#ffd700' : '#fff',
                            color: isFavorite(event._id) ? '#000' : '#666',
                            border: '2px solid #ffd700',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            transition: 'all 0.3s ease',
                            minWidth: '50px'
                          }}
                          title={isFavorite(event._id) ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          {isFavorite(event._id) ? '⭐' : '☆'}
                        </button>
                      </div>

                      {/* Already Registered Message */}
                      {isAlreadyRegistered(event) && (
                        <div style={{
                          marginTop: '24px',
                          padding: '20px',
                          background: canCancelRegistration(event) 
                            ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)'
                            : 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
                          borderRadius: '8px',
                          border: `2px solid ${canCancelRegistration(event) ? '#28a745' : '#f5c6cb'}`,
                          textAlign: 'center'
                        }}>
                          <h3 style={{ 
                            margin: '0 0 12px 0',
                            fontSize: '18px',
                            color: canCancelRegistration(event) ? '#155724' : '#721c24',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                          }}>
                            ✓ Already Registered
                          </h3>
                          <p style={{ margin: '0 0 16px 0', color: canCancelRegistration(event) ? '#155724' : '#721c24', fontWeight: '500' }}>
                            You have successfully registered for this {event.type?.toLowerCase()}!
                          </p>
                          {canCancelRegistration(event) ? (
                            <>
                              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: canCancelRegistration(event) ? '#155724' : '#721c24' }}>
                                ⏰ You can cancel up to 2 weeks before the event starts
                              </p>
                              <button
                                onClick={() => handleCancelRegistration(event._id || event.id)}
                                style={{
                                  padding: '10px 24px',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  background: '#dc3545',
                                  color: 'white',
                                  transition: 'all 0.3s',
                                  marginTop: '10px'
                                }}
                                onMouseOver={(e) => e.target.style.background = '#c82333'}
                                onMouseOut={(e) => e.target.style.background = '#dc3545'}
                              >
                                ✕ Cancel Registration
                              </button>
                            </>
                          ) : (
                            <div style={{
                              padding: '12px 16px',
                              background: 'rgba(0,0,0,0.1)',
                              borderRadius: '6px',
                              marginTop: '12px',
                              fontSize: '13px',
                              color: '#721c24'
                            }}>
                              ⚠️ Cancellation deadline has passed (less than 2 weeks before event)
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

      {/* Payment Modal */}
      {showPaymentModal && paymentData && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={handlePaymentModalClose}
          eventId={paymentData.eventId}
          registrationId={paymentData.registrationId}
          amount={paymentData.amount}
          eventName={paymentData.eventName}
          eventType={paymentData.eventType}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </StudentLayout>
  );
}
