'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import '@/app/dashboard.css';
import { eventAPI, bazaarAPI, registrationAPI, getUser } from '@/utils/api';
import PaymentModal from '@/app/components/PaymentModal';

function EventCard({ event, onViewDetails, isRegistered, isFavorite, onToggleFavorite }) {
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

      <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
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
            flex: '1'
          }}
          onMouseOver={(e) => e.target.style.background = '#0052a3'}
          onMouseOut={(e) => e.target.style.background = '#0066cc'}
        >
          📋 Details
        </button>
        {/* Show Register button only for Workshops and Trips */}
        {(event.type?.toLowerCase().includes('workshop') || event.type?.toLowerCase().includes('trip')) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isRegistered) {
                onViewDetails(event, true); // Pass true to open registration form directly
              }
            }}
            disabled={isRegistered}
            style={{
              padding: '8px 20px',
              fontSize: '14px',
              fontWeight: '600',
              border: 'none',
              borderRadius: '6px',
              cursor: isRegistered ? 'not-allowed' : 'pointer',
              background: isRegistered ? '#6c757d' : '#28a745',
              color: 'white',
              transition: 'all 0.3s',
              flex: '1',
              opacity: isRegistered ? 0.7 : 1
            }}
            onMouseOver={(e) => !isRegistered && (e.target.style.background = '#218838')}
            onMouseOut={(e) => !isRegistered && (e.target.style.background = '#28a745')}
          >
            {isRegistered ? '✓ Registered' : '✍️ Register'}
          </button>
        )}
        {/* NEW: Favorite button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(event);
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: isFavorite ? '#ffd700' : '#fff',
            color: isFavorite ? '#000' : '#666',
            border: '2px solid #ffd700',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1.2rem',
            transition: 'all 0.3s ease',
            minWidth: '50px'
          }}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? '⭐' : '☆'}
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
  
  // Registration states
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    name: '',
    email: '',
    staffId: ''
  });
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState({ text: '', type: '' });
  const [registeredEventIds, setRegisteredEventIds] = useState(new Set());
  const [registrationMap, setRegistrationMap] = useState({}); // Map of eventId -> registrationId
  
  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  
  // Cancellation states
  const [cancelling, setCancelling] = useState(false);
  
  // My Registrations view states
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'registrations'
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [registeredEventsLoading, setRegisteredEventsLoading] = useState(false);

  // NEW: Favorites state
  const [favorites, setFavorites] = useState(new Set());

  // Function to sort events by date
  const sortEvents = (events, order) => {
    return [...events].sort((a, b) => {
      const dateA = new Date(a.start_date);
      const dateB = new Date(b.start_date);
      return order === 'asc' ? dateA - dateB : dateB - dateA;
    });
  };

  // Function to fetch full details of registered events
  const fetchRegisteredEvents = async (eventIds, allRegistrations = []) => {
    if (!eventIds || eventIds.size === 0) {
      setRegisteredEvents([]);
      return;
    }
    
    setRegisteredEventsLoading(true);
    try {
      // If we have registration data with populated events, use it directly
      if (allRegistrations.length > 0) {
        const eventsFromRegs = allRegistrations
          .filter(reg => reg.event_id && (typeof reg.event_id === 'object'))
          .map(reg => reg.event_id);
        
        if (eventsFromRegs.length > 0) {
          setRegisteredEvents(eventsFromRegs);
          setRegisteredEventsLoading(false);
          return;
        }
      }
      
      // Fetch all events (both upcoming and past) and filter to registered ones
      const upcomingEvents = await eventAPI.getUpcoming();
      const registered = upcomingEvents.filter(event => 
        eventIds.has(event._id || event.id)
      );
      
      // Enrich with vendor data if needed
      const enriched = await Promise.all(registered.map(async (ev) => {
        // For bazaars, extract vendors from bazaar.vendors_participating
        if (ev.type && ev.type.toLowerCase().includes('bazaar')) {
          if (ev.bazaar && ev.bazaar.vendors_participating && ev.bazaar.vendors_participating.length > 0) {
            ev.vendors = ev.bazaar.vendors_participating;
            return ev;
          }
          
          // If not already populated, try to fetch bazaar by id
          try {
            if (ev.bazaar_id || ev.id || ev._id) {
              const bazaarId = ev.bazaar_id || ev.id || ev._id;
              const response = await bazaarAPI.getById(bazaarId);
              // Response format: { message, bazaar }
              if (response && response.bazaar && response.bazaar.bazaar && response.bazaar.bazaar.vendors_participating) {
                ev.vendors = response.bazaar.bazaar.vendors_participating;
                return ev;
              }
            }
          } catch (e) {
            console.error('Error fetching bazaar vendors:', e);
          }
        }
        
        // For booths, extract vendors from booth.vendors
        if (ev.type && ev.type.toLowerCase().includes('booth')) {
          if (ev.booth && ev.booth.vendors && ev.booth.vendors.length > 0) {
            ev.vendors = ev.booth.vendors;
            return ev;
          }
        }
        
        return ev;
      }));
      
      setRegisteredEvents(enriched);
    } catch (error) {
      console.error('Error fetching registered events:', error);
      setRegisteredEvents([]);
    } finally {
      setRegisteredEventsLoading(false);
    }
  };

  // NEW: Load user's favorites
  const loadFavorites = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5001/api/favorites', {
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
        const response = await fetch(`http://localhost:5001/api/favorites/${event._id}`, {
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
        const response = await fetch('http://localhost:5001/api/favorites', {
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

  // Load user data and auto-fill form + load registered events from database
  useEffect(() => {
    const user = getUser();
    if (user) {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      setRegistrationData({
        name: fullName || '',
        email: user.email || '',
        staffId: user.id_number || ''
      });

      // Load registered events from database
      const loadRegistrationsFromDB = async () => {
        try {
          const response = await registrationAPI.getMyRegistrations(user._id);
          if (response) {
            // Extract event IDs from both upcoming and past registrations and create mapping
            const eventIds = new Set();
            const regMap = {};
            const allRegs = [];
            
            // Process upcoming registrations
            if (response.upcoming) {
              response.upcoming.forEach(reg => {
                const eventId = reg.event_id._id || reg.event_id;
                eventIds.add(eventId);
                regMap[eventId] = reg._id; // Store registration ID for cancellation
                allRegs.push(reg);
              });
            }
            
            // Process past registrations
            if (response.past) {
              response.past.forEach(reg => {
                const eventId = reg.event_id._id || reg.event_id;
                eventIds.add(eventId);
                regMap[eventId] = reg._id; // Store registration ID for cancellation
                allRegs.push(reg);
              });
            }
            
            setRegisteredEventIds(eventIds);
            setRegistrationMap(regMap);
            
            // Fetch full details of registered events, passing registration data
            fetchRegisteredEvents(eventIds, allRegs);
          }
        } catch (error) {
          console.error('Error loading registrations from database:', error);
          // Fallback: try to load from localStorage
          const storedRegistrations = localStorage.getItem(`registeredEvents_${user.id_number}`);
          if (storedRegistrations) {
            try {
              const registeredArray = JSON.parse(storedRegistrations);
              const registeredSet = new Set(registeredArray);
              setRegisteredEventIds(registeredSet);
              fetchRegisteredEvents(registeredSet);
            } catch (e) {
              console.error('Error loading from localStorage:', e);
            }
          }
        }
      };
      
      loadRegistrationsFromDB();
    }

    // NEW: Load favorites
    loadFavorites();
  }, []);

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
          // For bazaars, extract vendors from bazaar.vendors_participating
          if (ev.type && ev.type.toLowerCase().includes('bazaar')) {
            console.log('Processing bazaar:', ev.name, 'Has bazaar object:', !!ev.bazaar);
            
            if (ev.bazaar && ev.bazaar.vendors_participating && ev.bazaar.vendors_participating.length > 0) {
              console.log('Found vendors in event.bazaar.vendors_participating:', ev.bazaar.vendors_participating.length);
              ev.vendors = ev.bazaar.vendors_participating;
              return ev;
            }
            
            // If not already populated, try to fetch bazaar by id
            try {
              if (ev.bazaar_id || ev.id || ev._id) {
                const bazaarId = ev.bazaar_id || ev.id || ev._id;
                console.log('Fetching bazaar details for ID:', bazaarId);
                const response = await bazaarAPI.getById(bazaarId);
                console.log('Bazaar API response:', response);
                
                // Response format: { message, bazaar }
                // The bazaar object itself contains the bazaar property with vendors_participating
                if (response && response.bazaar) {
                  if (response.bazaar.bazaar && response.bazaar.bazaar.vendors_participating) {
                    console.log('Found vendors in response.bazaar.bazaar.vendors_participating:', response.bazaar.bazaar.vendors_participating.length);
                    ev.vendors = response.bazaar.bazaar.vendors_participating;
                    return ev;
                  } else if (response.bazaar.vendors_participating) {
                    console.log('Found vendors in response.bazaar.vendors_participating:', response.bazaar.vendors_participating.length);
                    ev.vendors = response.bazaar.vendors_participating;
                    return ev;
                  }
                }
              }
            } catch (e) {
              console.error('Error fetching bazaar vendors:', e);
            }
          }
          
          // For booths, extract vendors from booth.vendors
          if (ev.type && ev.type.toLowerCase().includes('booth')) {
            if (ev.booth && ev.booth.vendors && ev.booth.vendors.length > 0) {
              ev.vendors = ev.booth.vendors;
              return ev;
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
        
        // Search in workshop professors
        let matchesProfessor = false;
        if (event.workshop) {
          if (event.workshop.professors_participating && Array.isArray(event.workshop.professors_participating)) {
            matchesProfessor = event.workshop.professors_participating.some(prof => 
              prof.toLowerCase().includes(searchStr)
            );
          }
          if (!matchesProfessor && event.workshop.faculty_responsible) {
            matchesProfessor = event.workshop.faculty_responsible.toLowerCase().includes(searchStr);
          }
        }
        
        // Search in conference professors (if applicable)
        if (!matchesProfessor && event.conference) {
          if (event.conference.professors_participating && Array.isArray(event.conference.professors_participating)) {
            matchesProfessor = event.conference.professors_participating.some(prof => 
              prof.toLowerCase().includes(searchStr)
            );
          }
          if (!matchesProfessor && event.conference.faculty_responsible) {
            matchesProfessor = event.conference.faculty_responsible.toLowerCase().includes(searchStr);
          }
        }
        
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
        // Check workshop.professors_participating array
        if (event.workshop && event.workshop.professors_participating) {
          const profArray = event.workshop.professors_participating;
          return profArray.some(prof => prof.toLowerCase().includes(professorStr));
        }
        // Check conference.professors_participating array (if conferences have it)
        if (event.conference && event.conference.professors_participating) {
          const profArray = event.conference.professors_participating;
          return profArray.some(prof => prof.toLowerCase().includes(professorStr));
        }
        // Also check faculty_responsible as fallback
        if (event.workshop && event.workshop.faculty_responsible) {
          return event.workshop.faculty_responsible.toLowerCase().includes(professorStr);
        }
        if (event.conference && event.conference.faculty_responsible) {
          return event.conference.faculty_responsible.toLowerCase().includes(professorStr);
        }
        return false;
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
  const handleViewDetails = (event, openRegistration = false) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
    if (openRegistration && isRegisterableEvent(event)) {
      setShowRegistrationForm(true);
    }
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

  // Check if event is registerable (workshop or trip)
  const isRegisterableEvent = (event) => {
    if (!event || !event.type) return false;
    const type = event.type.toLowerCase();
    return type.includes('workshop') || type.includes('trip');
  };

  // Check if already registered for this event
  const isAlreadyRegistered = (event) => {
    const eventId = event._id || event.id;
    return registeredEventIds.has(eventId);
  };

  // Check if cancellation is allowed (must be at least 2 weeks before event start)
  const canCancelRegistration = (event) => {
    if (!event || !event.start_date) return false;
    const eventStart = new Date(event.start_date);
    const now = new Date();
    const daysUntilEvent = (eventStart - now) / (1000 * 60 * 60 * 24);
    return daysUntilEvent >= 14; // 14 days = 2 weeks
  };

  // Get days remaining until event for display
  const getDaysUntilEvent = (event) => {
    if (!event || !event.start_date) return 0;
    const eventStart = new Date(event.start_date);
    const now = new Date();
    const daysUntilEvent = Math.ceil((eventStart - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysUntilEvent);
  };

  // Helper functions to separate upcoming and past events
  const getUpcomingEvents = (events) => {
    const now = new Date();
    return events.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate >= now;
    }).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  };

  const getPastEvents = (events) => {
    const now = new Date();
    return events.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate < now;
    }).sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
  };

  // Handle registration form submit
  const handleRegistration = async (e) => {
    e.preventDefault();
    setRegistrationLoading(true);
    setRegistrationMessage({ text: '', type: '' });

    try {
      // Validate form data
      if (!registrationData.name || !registrationData.email || !registrationData.staffId) {
        setRegistrationMessage({ text: 'Please fill in all fields', type: 'error' });
        setRegistrationLoading(false);
        return;
      }

      // Prepare registration payload
      const payload = {
        event_id: selectedEvent._id || selectedEvent.id,
        name: registrationData.name,
        email: registrationData.email,
        personalId: registrationData.staffId,
        role: 'professor' // Backend expects lowercase
      };

      const response = await registrationAPI.register(payload);
      
      // Update local state with registration from database
      const eventId = selectedEvent._id || selectedEvent.id;
      const updatedRegistrations = new Set([...registeredEventIds, eventId]);
      setRegisteredEventIds(updatedRegistrations);
      
      // Update registration map with the new registration ID
      setRegistrationMap({
        ...registrationMap,
        [eventId]: response.registration._id
      });
      
      // Check if event requires payment
      const eventPrice = selectedEvent.workshop?.price || selectedEvent.trip?.price || 0;
      
      if (eventPrice > 0) {
        // Close registration form and show payment modal
        setShowRegistrationForm(false);
        setShowDetailsModal(false);
        setPaymentData({
          eventId: selectedEvent._id || selectedEvent.id,
          registrationId: response.registration._id,
          amount: eventPrice,
          eventName: selectedEvent.name,
          eventType: selectedEvent.type
        });
        setShowPaymentModal(true);
      } else {
        // Free event - registration complete
        // Refresh registered events list from database
        fetchRegisteredEvents(updatedRegistrations);
        
        setRegistrationMessage({ text: 'Successfully registered for the event!', type: 'success' });
        
        // Close form and reset message after 2 seconds (keep user data)
        setTimeout(() => {
          setShowRegistrationForm(false);
          setRegistrationMessage({ text: '', type: '' });
        }, 2000);
      }

    } catch (error) {
      setRegistrationMessage({ 
        text: error.message || 'Failed to register. Please try again.', 
        type: 'error' 
      });
    } finally {
      setRegistrationLoading(false);
    }
  };

  const handlePaymentSuccess = async (payment) => {
    console.log('Payment successful:', payment);
    setShowPaymentModal(false);
    
    // Add event to registered set and update registration map
    const eventId = paymentData.eventId;
    const registrationId = paymentData.registrationId;
    const updatedRegistrations = new Set([...registeredEventIds, eventId]);
    setRegisteredEventIds(updatedRegistrations);
    
    // Update registration map
    setRegistrationMap({
      ...registrationMap,
      [eventId]: registrationId
    });
    
    // Refresh registered events list from database
    fetchRegisteredEvents(updatedRegistrations);
    
    setPaymentData(null);
    alert('Payment completed! Registration confirmed.');
  };

  const handlePaymentModalClose = async () => {
    if (paymentData?.registrationId) {
      // User closed modal without paying - cancel the pending registration
      try {
        const token = localStorage.getItem('token');
        await fetch(`http://localhost:5001/api/registration/cancel-unpaid/${paymentData.registrationId}`, {
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
  };

  // Handle canceling a registration
  const handleCancelRegistration = async (eventId) => {
    // Check if cancellation deadline has passed
    const event = events.find(e => (e._id || e.id) === eventId) || 
                  registeredEvents.find(e => (e._id || e.id) === eventId);
    
    if (event && !canCancelRegistration(event)) {
      alert(`Cannot cancel registration within 2 weeks of event start. Event starts in ${getDaysUntilEvent(event)} days.`);
      return;
    }

    if (!window.confirm('Are you sure you want to cancel your registration for this event?')) {
      return;
    }

    try {
      // Get the registration ID from the registration map
      const registrationId = registrationMap[eventId];
      
      if (!registrationId) {
        console.error('Registration ID not found in map for event:', eventId);
        alert('Registration not found. Please refresh the page and try again.');
        return;
      }

      console.log('Cancelling registration:', registrationId, 'for event:', eventId);
      await registrationAPI.cancel(registrationId);
      
      // Update local state
      const updatedEventIds = new Set(registeredEventIds);
      updatedEventIds.delete(eventId);
      setRegisteredEventIds(updatedEventIds);
      
      // Update registration map
      const updatedRegMap = { ...registrationMap };
      delete updatedRegMap[eventId];
      setRegistrationMap(updatedRegMap);
      
      // Refresh registered events list
      fetchRegisteredEvents(updatedEventIds);
      
      // Close modal
      setShowDetailsModal(false);
      
      alert('Registration cancelled successfully');
    } catch (error) {
      console.error('Error canceling registration:', error);
      alert('Failed to cancel registration. Please try again.');
    }
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
            <li><Link href="/professor/favorites">⭐ My Favorites</Link></li>
            <li><Link href="/professor/workshops">🎨 My Workshops</Link></li>
            <li><Link href="/professor/payment-history">💰 Payment History</Link></li>
            <li><Link href="/polls-voting">📊 Vote for Vendors</Link></li>
            <li><Link href="/loyalty-program">🎁 Loyalty Program</Link></li>
            <li><Link href="/professor/gym">💪 Gym Schedule</Link></li>
            <li><Link href="/professor/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <div style={{ marginBottom: '30px' }}>
            <h1 style={{ marginBottom: '20px' }}>Events</h1>
            
            {/* View Mode Toggle Tabs */}
            <div style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '20px',
              borderBottom: '2px solid #e0e0e0'
            }}>
              <button
                onClick={() => setViewMode('all')}
                style={{
                  padding: '12px 24px',
                  fontSize: '15px',
                  fontWeight: '600',
                  border: 'none',
                  borderBottom: viewMode === 'all' ? '3px solid #0066cc' : '3px solid transparent',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: viewMode === 'all' ? '#0066cc' : '#666',
                  transition: 'all 0.3s',
                  marginBottom: '-2px'
                }}
                onMouseOver={(e) => {
                  if (viewMode !== 'all') e.target.style.color = '#333';
                }}
                onMouseOut={(e) => {
                  if (viewMode !== 'all') e.target.style.color = '#666';
                }}
              >
                📅 All Events
              </button>
              <button
                onClick={() => setViewMode('registrations')}
                style={{
                  padding: '12px 24px',
                  fontSize: '15px',
                  fontWeight: '600',
                  border: 'none',
                  borderBottom: viewMode === 'registrations' ? '3px solid #0066cc' : '3px solid transparent',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: viewMode === 'registrations' ? '#0066cc' : '#666',
                  transition: 'all 0.3s',
                  marginBottom: '-2px'
                }}
                onMouseOver={(e) => {
                  if (viewMode !== 'registrations') e.target.style.color = '#333';
                }}
                onMouseOut={(e) => {
                  if (viewMode !== 'registrations') e.target.style.color = '#666';
                }}
              >
                ✓ My Registrations {registeredEventIds.size > 0 && `(${registeredEventIds.size})`}
              </button>
            </div>
          </div>

          {/* All Events View */}
          {viewMode === 'all' && (
            <>
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
                        <option value="Trip">Trips</option>
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
                        isRegistered={isAlreadyRegistered(ev)}
                        isFavorite={isFavorite(ev._id)}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
            </>
          )}

          {/* My Registrations View */}
          {viewMode === 'registrations' && (
            <div>
              {registeredEventsLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading your registrations...</p>
                </div>
              ) : registeredEvents.length === 0 ? (
                <div className="empty-state">
                  <h3>No Registrations Yet</h3>
                  <p>You haven't registered for any events yet. Browse all events and register for workshops or trips!</p>
                  <button 
                    onClick={() => setViewMode('all')}
                    style={{
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: '#0066cc',
                      color: 'white',
                      marginTop: '20px',
                      transition: 'all 0.3s'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#0052a3'}
                    onMouseOut={(e) => e.target.style.background = '#0066cc'}
                  >
                    Browse All Events
                  </button>
                </div>
              ) : (
                <>
                  {/* Upcoming Events Section */}
                  {getUpcomingEvents(registeredEvents).length > 0 && (
                    <div style={{ marginBottom: '40px' }}>
                      <h2 style={{ 
                        fontSize: '20px', 
                        fontWeight: '600',
                        marginBottom: '20px',
                        color: '#333',
                        paddingBottom: '10px',
                        borderBottom: '2px solid #e0e0e0'
                      }}>
                        🔜 Upcoming Events ({getUpcomingEvents(registeredEvents).length})
                      </h2>
                      <div className="events-list">
                        {getUpcomingEvents(registeredEvents).map((ev) => (
                          <EventCard 
                            key={ev._id || ev.id || ev.event_id} 
                            event={ev}
                            onViewDetails={handleViewDetails}
                            isRegistered={true}
                            isFavorite={isFavorite(ev._id)}
                            onToggleFavorite={toggleFavorite}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Past Events Section */}
                  {getPastEvents(registeredEvents).length > 0 && (
                    <div>
                      <h2 style={{ 
                        fontSize: '20px', 
                        fontWeight: '600',
                        marginBottom: '20px',
                        color: '#666',
                        paddingBottom: '10px',
                        borderBottom: '2px solid #e0e0e0'
                      }}>
                        📅 Past Events ({getPastEvents(registeredEvents).length})
                      </h2>
                      <div className="events-list">
                        {getPastEvents(registeredEvents).map((ev) => (
                          <EventCard 
                            key={ev._id || ev.id || ev.event_id} 
                            event={ev}
                            onViewDetails={handleViewDetails}
                            isRegistered={true}
                            isFavorite={isFavorite(ev._id)}
                            onToggleFavorite={toggleFavorite}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

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
                        {(selectedEvent.workshop?.faculty_responsible || selectedEvent.conference?.faculty_responsible) && (
                          <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#495057' }}>👨‍🏫 Faculty Responsible:</strong>
                            <div style={{ marginTop: '4px', color: '#666' }}>
                              {selectedEvent.workshop?.faculty_responsible || selectedEvent.conference?.faculty_responsible}
                            </div>
                          </div>
                        )}
                        
                        {((selectedEvent.workshop?.professors_participating && selectedEvent.workshop.professors_participating.length > 0) || 
                          (selectedEvent.conference?.professors_participating && selectedEvent.conference.professors_participating.length > 0)) && (
                          <div style={{ marginBottom: '12px' }}>
                            <strong style={{ color: '#495057' }}>👥 Professors Participating:</strong>
                            <div style={{ marginTop: '8px' }}>
                              {(selectedEvent.workshop?.professors_participating || selectedEvent.conference?.professors_participating || []).map((professor, idx) => (
                                <div 
                                  key={idx}
                                  style={{ 
                                    display: 'inline-block',
                                    padding: '6px 12px',
                                    margin: '4px 4px 4px 0',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)'
                                  }}
                                >
                                  👨‍🏫 {professor}
                                </div>
                              ))}
                            </div>
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
                        🏪 Participating Vendors ({selectedEvent.vendors.length})
                      </h3>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '16px'
                      }}>
                        {selectedEvent.vendors.map((v, idx) => {
                          const vendorUser = v.vendor_id;
                          const businessName = v.business_name || v.vendor_name || vendorUser?.vendor_info?.company_name || 'N/A';
                          const contactName = vendorUser ? `${vendorUser.first_name || ''} ${vendorUser.last_name || ''}`.trim() : '';
                          const email = vendorUser?.email || v.contact_email || '';
                          const boothNumber = v.booth_number || 'TBA';
                          const products = v.products || [];
                          
                          return (
                            <div 
                              key={v._id || v.id || idx} 
                              style={{
                                background: '#f8f9fa',
                                padding: '16px',
                                borderRadius: '8px',
                                border: '1px solid #e9ecef',
                                transition: 'all 0.2s',
                                cursor: 'default'
                              }}
                            >
                              <div style={{ 
                                fontWeight: '700', 
                                fontSize: '15px',
                                color: '#333',
                                marginBottom: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                <span style={{
                                  background: '#0066cc',
                                  color: 'white',
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: '700'
                                }}>
                                  {idx + 1}
                                </span>
                                {businessName}
                              </div>
                              
                              {contactName && (
                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center',
                                  gap: '8px',
                                  marginBottom: '8px',
                                  fontSize: '13px',
                                  color: '#666'
                                }}>
                                  <span>👤</span>
                                  <span>{contactName}</span>
                                </div>
                              )}
                              
                              {email && (
                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center',
                                  gap: '8px',
                                  marginBottom: '8px',
                                  fontSize: '13px',
                                  color: '#666',
                                  wordBreak: 'break-word'
                                }}>
                                  <span>📧</span>
                                  <a 
                                    href={`mailto:${email}`}
                                    style={{
                                      color: '#0066cc',
                                      textDecoration: 'none'
                                    }}
                                    onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                                    onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                                  >
                                    {email}
                                  </a>
                                </div>
                              )}
                              
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: products.length > 0 ? '8px' : '0',
                                fontSize: '13px',
                                color: '#666'
                              }}>
                                <span>📍</span>
                                <span>Booth: <strong>{boothNumber}</strong></span>
                              </div>
                              
                              {products.length > 0 && (
                                <div style={{
                                  marginTop: '12px',
                                  paddingTop: '12px',
                                  borderTop: '1px solid #dee2e6'
                                }}>
                                  <div style={{ 
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: '#495057',
                                    marginBottom: '6px'
                                  }}>
                                    Products/Services:
                                  </div>
                                  <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '6px'
                                  }}>
                                    {products.map((product, pIdx) => (
                                      <span
                                        key={pIdx}
                                        style={{
                                          background: 'white',
                                          padding: '4px 10px',
                                          borderRadius: '12px',
                                          fontSize: '11px',
                                          color: '#555',
                                          border: '1px solid #dee2e6'
                                        }}
                                      >
                                        {product}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Show message if bazaar but no vendors yet */}
                  {(selectedEvent.type?.toLowerCase().includes('bazaar') || selectedEvent.type?.toLowerCase().includes('booth')) && 
                   (!selectedEvent.vendors || selectedEvent.vendors.length === 0) && (
                    <div style={{
                      marginBottom: '24px',
                      padding: '16px',
                      background: '#fff3cd',
                      borderRadius: '8px',
                      border: '1px solid #ffc107',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '14px',
                        color: '#856404',
                        fontWeight: '500'
                      }}>
                        ℹ️ No vendors have been approved for this {selectedEvent.type?.toLowerCase()} yet.
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

                  {/* Registration Section */}
                  {isRegisterableEvent(selectedEvent) && !showRegistrationForm && !isAlreadyRegistered(selectedEvent) && (
                    <div style={{
                      marginTop: '24px',
                      padding: '20px',
                      background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                      borderRadius: '8px',
                      border: '2px solid #90caf9',
                      textAlign: 'center'
                    }}>
                      <h3 style={{ 
                        margin: '0 0 12px 0',
                        fontSize: '18px',
                        color: '#1565c0'
                      }}>
                        📝 Ready to Register?
                      </h3>
                      <p style={{ margin: '0 0 16px 0', color: '#424242' }}>
                        Click below to register for this {selectedEvent.type?.toLowerCase()}
                      </p>
                      <button
                        onClick={() => setShowRegistrationForm(true)}
                        style={{
                          padding: '12px 32px',
                          fontSize: '16px',
                          fontWeight: '700',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          background: '#0066cc',
                          color: 'white',
                          transition: 'all 0.3s',
                          boxShadow: '0 4px 12px rgba(0, 102, 204, 0.3)'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.background = '#0052a3';
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 6px 16px rgba(0, 102, 204, 0.4)';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = '#0066cc';
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 4px 12px rgba(0, 102, 204, 0.3)';
                        }}
                      >
                        ✍️ Register Now
                      </button>
                    </div>
                  )}

                  {/* Already Registered Message */}
                  {isRegisterableEvent(selectedEvent) && isAlreadyRegistered(selectedEvent) && (
                    <div style={{
                      marginTop: '24px',
                      padding: '20px',
                      background: canCancelRegistration(selectedEvent) 
                        ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)'
                        : 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
                      borderRadius: '8px',
                      border: `2px solid ${canCancelRegistration(selectedEvent) ? '#28a745' : '#f5c6cb'}`,
                      textAlign: 'center'
                    }}>
                      <h3 style={{ 
                        margin: '0 0 12px 0',
                        fontSize: '18px',
                        color: canCancelRegistration(selectedEvent) ? '#155724' : '#721c24',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                      }}>
                        ✓ Already Registered
                      </h3>
                      <p style={{ margin: '0 0 16px 0', color: canCancelRegistration(selectedEvent) ? '#155724' : '#721c24', fontWeight: '500' }}>
                        You have successfully registered for this {selectedEvent.type?.toLowerCase()}!
                      </p>
                      {canCancelRegistration(selectedEvent) ? (
                        <>
                          <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: canCancelRegistration(selectedEvent) ? '#155724' : '#721c24' }}>
                            ⏰ You can cancel up to 2 weeks before the event starts
                          </p>
                          <button
                            onClick={() => handleCancelRegistration(selectedEvent._id || selectedEvent.id)}
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

                  {/* Registration Form */}
                  {isRegisterableEvent(selectedEvent) && showRegistrationForm && !isAlreadyRegistered(selectedEvent) && (
                    <div style={{
                      marginTop: '24px',
                      padding: '24px',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      border: '2px solid #0066cc'
                    }}>
                      <h3 style={{ 
                        margin: '0 0 20px 0',
                        fontSize: '18px',
                        color: '#333',
                        textAlign: 'center'
                      }}>
                        📝 Registration Form
                      </h3>

                      {registrationMessage.text && (
                        <div style={{
                          padding: '12px 16px',
                          marginBottom: '20px',
                          borderRadius: '6px',
                          background: registrationMessage.type === 'success' ? '#d4edda' : '#f8d7da',
                          border: `1px solid ${registrationMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                          color: registrationMessage.type === 'success' ? '#155724' : '#721c24',
                          textAlign: 'center',
                          fontWeight: '600'
                        }}>
                          {registrationMessage.text}
                        </div>
                      )}

                      <form onSubmit={handleRegistration}>
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: '600',
                            color: '#495057'
                          }}>
                            Full Name *
                          </label>
                          <input
                            type="text"
                            value={registrationData.name}
                            readOnly
                            required
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              fontSize: '14px',
                              border: '2px solid #e0e0e0',
                              borderRadius: '6px',
                              outline: 'none',
                              boxSizing: 'border-box',
                              backgroundColor: '#f8f9fa',
                              cursor: 'not-allowed',
                              color: '#495057'
                            }}
                          />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                          <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: '600',
                            color: '#495057'
                          }}>
                            Email Address *
                          </label>
                          <input
                            type="email"
                            value={registrationData.email}
                            readOnly
                            required
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              fontSize: '14px',
                              border: '2px solid #e0e0e0',
                              borderRadius: '6px',
                              outline: 'none',
                              boxSizing: 'border-box',
                              backgroundColor: '#f8f9fa',
                              cursor: 'not-allowed',
                              color: '#495057'
                            }}
                          />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                          <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: '600',
                            color: '#495057'
                          }}>
                            Staff ID *
                          </label>
                          <input
                            type="text"
                            value={registrationData.staffId}
                            readOnly
                            required
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              fontSize: '14px',
                              border: '2px solid #e0e0e0',
                              borderRadius: '6px',
                              outline: 'none',
                              boxSizing: 'border-box',
                              backgroundColor: '#f8f9fa',
                              cursor: 'not-allowed',
                              color: '#495057'
                            }}
                          />
                        </div>

                        <div style={{ 
                          display: 'flex', 
                          gap: '12px',
                          justifyContent: 'flex-end'
                        }}>
                          <button
                            type="button"
                            onClick={() => {
                              setShowRegistrationForm(false);
                              setRegistrationMessage({ text: '', type: '' });
                              setRegistrationData({ name: '', email: '', staffId: '' });
                            }}
                            style={{
                              padding: '10px 24px',
                              fontSize: '14px',
                              fontWeight: '600',
                              border: '2px solid #6c757d',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              background: 'white',
                              color: '#6c757d',
                              transition: 'all 0.3s'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.background = '#6c757d';
                              e.target.style.color = 'white';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = 'white';
                              e.target.style.color = '#6c757d';
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={registrationLoading}
                            style={{
                              padding: '10px 24px',
                              fontSize: '14px',
                              fontWeight: '600',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: registrationLoading ? 'not-allowed' : 'pointer',
                              background: registrationLoading ? '#ccc' : '#28a745',
                              color: 'white',
                              transition: 'all 0.3s',
                              opacity: registrationLoading ? 0.6 : 1
                           
                            }}
                            onMouseOver={(e) => !registrationLoading && (e.target.style.background = '#218838')}
                            onMouseOut={(e) => !registrationLoading && (e.target.style.background = '#28a745')}
                          >
                            {registrationLoading ? '⏳ Registering...' : '✓ Submit Registration'}
                          </button>
                        </div>
                      </form>
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
                    onClick={() => {
                      setShowDetailsModal(false);
                      setShowRegistrationForm(false);
                      setRegistrationMessage({ text: '', type: '' });
                      setRegistrationData({ name: '', email: '', staffId: '' });
                    }}
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
    </div>
  );
}
