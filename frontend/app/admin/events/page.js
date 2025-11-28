'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { salesReportAPI } from '@/utils/api';
import { useRouter } from 'next/navigation';
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
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterProfessor, setFilterProfessor] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [registrationCounts, setRegistrationCounts] = useState({}); // New state for registration counts
  const [viewEventModal, setViewEventModal] = useState(false);
  // Sales report modal state
  const [salesModalOpen, setSalesModalOpen] = useState(false);
  const [salesReport, setSalesReport] = useState(null);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState('');
  // modal filter states
  const [salesNameFilter, setSalesNameFilter] = useState('');
  const [salesTypeFilter, setSalesTypeFilter] = useState('all');
  const [salesStartDateFilter, setSalesStartDateFilter] = useState('');
  const [salesEndDateFilter, setSalesEndDateFilter] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventComments, setEventComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [stats, setStats] = useState({
    workshops: 0,
    trips: 0,
    bazaars: 0,
    booths: 0,
    conferences: 0
  });

  // Fetch events data and accepted booth applications
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
        
        // Filter out Booth type events - we'll get those from vendor applications
        const nonBoothEvents = eventsData?.filter(e => e.type !== 'Booth') || [];
        console.log('Non-booth events:', nonBoothEvents);
        
        // Fetch accepted booth applications
        console.log('Fetching accepted booth applications...');
        const boothResponse = await api.get('/admin/vendor-requests?status=accepted&kind=booth_event');
        console.log('Booth applications response:', boothResponse);
        
        // Transform booth applications to event format
        const boothEvents = (boothResponse.applications || []).map(app => {
          // Calculate end date based on duration
          const startDate = app.preferred_start_date ? new Date(app.preferred_start_date) : new Date(app.applied_at);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + ((app.duration_weeks || 1) * 7));
          
          return {
            _id: app._id,
            name: app.vendor?.company_name || `${app.vendor?.name}'s Booth`,
            type: 'Booth',
            location: app.application?.booth_location?.description || 
                     `Zone ${app.application?.booth_location?.zone || 'N/A'} - ${app.platform_position?.wall || 'N/A'} Wall, Slot ${app.platform_position?.slot || 'N/A'}`,
            short_description: `${app.duration_weeks || 1} week booth - ${app.application?.booth_size || 'Standard size'}`,
            start_date: startDate,
            end_date: endDate,
            time: 'All Day',
            status: 'active',
            booth: {
              vendors: [{
                vendor_name: app.vendor?.name,
                company_name: app.vendor?.company_name,
                contact_info: {
                  email: app.vendor?.email
                },
                booth_assignment: `${app.platform_position?.wall || 'N/A'}-${app.platform_position?.slot || 'N/A'} (${app.application?.booth_size || 'N/A'})`,
                setup_time: `${app.duration_weeks || 1} week(s)`
              }]
            },
            // Store original application data for reference
            _isBoothApplication: true,
            _applicationData: app
          };
        });
        
        console.log('Transformed booth events:', boothEvents);
        
        // Combine events and booth applications
        const allEvents = [...nonBoothEvents, ...boothEvents];
        console.log('All events combined:', allEvents);
        setEvents(allEvents);
        setFilteredEvents(allEvents); // Initialize filtered events
        
        // Calculate stats
        const eventStats = {
          workshops: nonBoothEvents.filter(e => e.type === 'Workshop').length || 0,
          trips: nonBoothEvents.filter(e => e.type === 'Trip').length || 0,
          bazaars: nonBoothEvents.filter(e => e.type === 'Bazaar').length || 0,
          booths: boothEvents.length || 0,
          conferences: nonBoothEvents.filter(e => e.type === 'Conference').length || 0
        };
        
        console.log('Calculated stats:', eventStats);
        setStats(eventStats);
        
        // Fetch registration counts for each event (only for non-booth events)
        if (nonBoothEvents && nonBoothEvents.length > 0) {
          await fetchRegistrationCounts(nonBoothEvents);
        }
        
      } catch (error) {
        console.error('Error fetching events:', error);
        // If there's an error, keep showing the placeholder
        setEvents([]);
        setFilteredEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFiltersAndSort();
  }, [events, searchTerm, filter, filterLocation, filterProfessor, sortOrder]);

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
    
    // Check database status first
    if (event.status === 'cancelled') {
      return <span style={{color: '#f44336', fontWeight: 'bold'}}>❌ Cancelled</span>;
    }
    
    if (event.status === 'completed') {
      return <span style={{color: '#9c27b0', fontWeight: 'bold'}}>🎓 Completed</span>;
    }
    
    // Fall back to date-based status
    if (now < startDate) {
      return <span style={{color: '#2196f3', fontWeight: 'bold'}}>🔜 Upcoming</span>;
    } else if (now >= startDate && now <= endDate) {
      return <span style={{color: '#4caf50', fontWeight: 'bold'}}>▶️ Active</span>;
    } else {
      // Past end date but not marked as completed
      return <span style={{color: '#ff9800', fontWeight: 'bold'}}>⌛ Ended</span>;
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

  // Apply comprehensive filters and sorting
  const applyFiltersAndSort = () => {
    let result = [...events];

    // Search by event name, location, description, or professor name
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(event => {
        const nameMatch = event.name?.toLowerCase().includes(searchLower);
        const locationMatch = event.location?.toLowerCase().includes(searchLower);
        const descriptionMatch = event.short_description?.toLowerCase().includes(searchLower);
        const professorMatch = 
          event.workshop?.professors_participating?.some(prof => 
            prof.toLowerCase().includes(searchLower)
          ) ||
          event.conference?.professors_participating?.some(prof => 
            prof.toLowerCase().includes(searchLower)
          );
        return nameMatch || locationMatch || descriptionMatch || professorMatch;
      });
    }

    // Filter by type
    if (filter !== 'all') {
      result = result.filter(event => event.type === filter);
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

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilter('all');
    setFilterLocation('');
    setFilterProfessor('');
    setSortOrder('desc');
  };

  const handleDeleteEvent = async (eventId, eventName, isBooth = false) => {
    const message = isBooth 
      ? `Are you sure you want to cancel this booth application "${eventName}"? This will reject the vendor's booth.`
      : `Are you sure you want to delete the event "${eventName}"? This action cannot be undone.`;
    
    if (!confirm(message)) {
      return;
    }
    
    try {
      if (isBooth) {
        // For booth applications, we should reject them instead of deleting
        const reason = prompt('Enter reason for canceling this booth:');
        if (!reason || reason.trim() === '') {
          alert('Cancellation reason is required');
          return;
        }
        
        await api.post(`/admin/vendor-requests/${eventId}/reject`, {
          rejection_reason: reason.trim()
        });
        alert('Booth application cancelled successfully!');
      } else {
        // For regular events, delete normally
        await api.delete(`/events/delete/${eventId}`);
        alert('Event deleted successfully!');
      }
      
      // Refresh events list
      const response = await api.get('/events/all');
      let eventsData = response;
      if (typeof response === 'string') {
        eventsData = JSON.parse(response);
      }
      
      // Filter out Booth type events
      const nonBoothEvents = eventsData?.filter(e => e.type !== 'Booth') || [];
      
      // Fetch accepted booth applications
      const boothResponse = await api.get('/admin/vendor-requests?status=accepted&kind=booth_event');
      
      // Transform booth applications to event format (same as in useEffect)
      const boothEvents = (boothResponse.applications || []).map(app => {
        const startDate = app.preferred_start_date ? new Date(app.preferred_start_date) : new Date(app.applied_at);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + ((app.duration_weeks || 1) * 7));
        
        return {
          _id: app._id,
          name: app.vendor?.company_name || `${app.vendor?.name}'s Booth`,
          type: 'Booth',
          location: app.application?.booth_location?.description || 
                   `Zone ${app.application?.booth_location?.zone || 'N/A'} - ${app.platform_position?.wall || 'N/A'} Wall, Slot ${app.platform_position?.slot || 'N/A'}`,
          short_description: `${app.duration_weeks || 1} week booth - ${app.application?.booth_size || 'Standard size'}`,
          start_date: startDate,
          end_date: endDate,
          time: 'All Day',
          status: 'active',
          booth: {
            vendors: [{
              vendor_name: app.vendor?.name,
              company_name: app.vendor?.company_name,
              contact_info: {
                email: app.vendor?.email
              },
              booth_assignment: `${app.platform_position?.wall || 'N/A'}-${app.platform_position?.slot || 'N/A'} (${app.application?.booth_size || 'N/A'})`,
              setup_time: `${app.duration_weeks || 1} week(s)`
            }]
          },
          _isBoothApplication: true,
          _applicationData: app
        };
      });
      
      const allEvents = [...nonBoothEvents, ...boothEvents];
      setEvents(allEvents);
      setFilteredEvents(allEvents); // Update filtered events as well
      
      // Refresh registration counts for the updated events list
      if (nonBoothEvents && nonBoothEvents.length > 0) {
        await fetchRegistrationCounts(nonBoothEvents);
      }
      
    } catch (error) {
      console.error('Error deleting/cancelling:', error);
      alert('Failed to process request: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleViewEvent = async (event) => {
    setSelectedEvent(event);
    setViewEventModal(true);
    
    // Fetch comments for this event
    await fetchEventComments(event._id);
  };

  const router = useRouter();

  // Navigate to admin reports page for all events / all attendees
  // fetch sales report with optional filters
  const fetchSalesReport = async (params = {}) => {
    console.debug('fetchSalesReport called with params:', params);
    setSalesLoading(true);
    setSalesError('');
    try {
      const data = await salesReportAPI.getSalesReport(params);
      setSalesReport(data);
    } catch (err) {
      console.error('Failed to fetch sales report:', err);
      setSalesError(err.message || 'Failed to load report');
      setSalesReport(null);
    } finally {
      setSalesLoading(false);
    }
  };

  const handleViewAllAttendees = async () => {
    setSalesModalOpen(true);
    // apply current modal filters
    const params = {};
    if (salesTypeFilter && salesTypeFilter !== 'all') params.event_type = salesTypeFilter;
    if (salesNameFilter && salesNameFilter.trim().length > 0) params.name = salesNameFilter.trim();
    if (salesStartDateFilter) params.start_date = salesStartDateFilter;
    if (salesEndDateFilter) params.end_date = salesEndDateFilter;
    await fetchSalesReport(params);
  };

  const clearSalesFilters = async () => {
    console.debug('clearSalesFilters called');
    setSalesNameFilter('');
    setSalesTypeFilter('all');
    setSalesStartDateFilter('');
    setSalesEndDateFilter('');
    await fetchSalesReport({});
  };

  const applySalesFilters = async () => {
    const params = {
      event_type: salesTypeFilter !== 'all' ? salesTypeFilter : undefined,
      name: salesNameFilter || undefined,
      start_date: salesStartDateFilter || undefined,
      end_date: salesEndDateFilter || undefined
    };
    console.debug('applySalesFilters params:', params);
    await fetchSalesReport(params);
  };

  const fetchEventComments = async (eventId) => {
    try {
      setLoadingComments(true);
      const response = await api.get(`/events/${eventId}/comments`);
      console.log('Comments response:', response);
      setEventComments(response.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setEventComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.delete(`/admin/comment/${commentId}`);
      alert('Comment deleted successfully!');
      
      // Refresh comments for the current event
      if (selectedEvent) {
        await fetchEventComments(selectedEvent._id);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCompleteWorkshop = async (workshopId, workshopName, endDate) => {
    const now = new Date();
    const workshopEndDate = new Date(endDate);
    const needsForce = workshopEndDate > now;

    let message = `Complete workshop "${workshopName}" and send certificates to all participants?\n\n`;
    
    if (needsForce) {
      message += `⚠️ WARNING: Workshop hasn't ended yet!\n`;
      message += `End date: ${workshopEndDate.toLocaleDateString()}\n`;
      message += `Current date: ${now.toLocaleDateString()}\n\n`;
      message += `This will use FORCE MODE to complete the workshop early.\n`;
      message += `Certificates will be sent immediately to all participants.\n\n`;
      message += `Continue anyway?`;
    } else {
      message += `Workshop has ended. Certificates will be sent to all eligible participants.`;
    }

    if (!confirm(message)) {
      return;
    }

    try {
      // Add force=true parameter if workshop hasn't ended
      const url = needsForce 
        ? `/workshop/${workshopId}/complete?force=true`
        : `/workshop/${workshopId}/complete`;
      
      const response = await api.patch(url);
      
      const successMsg = response.force_mode
        ? `✅ Workshop completed with FORCE MODE!\n\n`
        : `✅ Workshop completed successfully!\n\n`;
      
      const certificateMsg = `Certificates sent: ${response.certificates.sent}/${response.certificates.total}\n`;
      const failedMsg = response.certificates.failed > 0
        ? `Failed: ${response.certificates.failed}\n\n`
        : '';
      
      alert(successMsg + certificateMsg + failedMsg + 'Participants have received their certificates via email.');
      
      // Refresh events list
      const eventsResponse = await api.get('/events/all');
      let eventsData = eventsResponse;
      if (typeof eventsResponse === 'string') {
        eventsData = JSON.parse(eventsResponse);
      }
      
      const nonBoothEvents = eventsData?.filter(e => e.type !== 'Booth') || [];
      const boothResponse = await api.get('/admin/vendor-requests?status=accepted&kind=booth_event');
      
      const boothEvents = (boothResponse.applications || []).map(app => {
        const startDate = app.preferred_start_date ? new Date(app.preferred_start_date) : new Date(app.applied_at);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + ((app.duration_weeks || 1) * 7));
        
        return {
          _id: app._id,
          name: app.vendor?.company_name || `${app.vendor?.name}'s Booth`,
          type: 'Booth',
          location: app.application?.booth_location?.description || 
                   `Zone ${app.application?.booth_location?.zone || 'N/A'} - ${app.platform_position?.wall || 'N/A'} Wall, Slot ${app.platform_position?.slot || 'N/A'}`,
          short_description: `${app.duration_weeks || 1} week booth - ${app.application?.booth_size || 'Standard size'}`,
          start_date: startDate,
          end_date: endDate,
          time: 'All Day',
          status: 'active',
          booth: {
            vendors: [{
              vendor_name: app.vendor?.name,
              company_name: app.vendor?.company_name,
              contact_info: {
                email: app.vendor?.email
              },
              booth_assignment: `${app.platform_position?.wall || 'N/A'}-${app.platform_position?.slot || 'N/A'} (${app.application?.booth_size || 'N/A'})`,
              setup_time: `${app.duration_weeks || 1} week(s)`
            }]
          },
          _isBoothApplication: true,
          _applicationData: app
        };
      });
      
      const allEvents = [...nonBoothEvents, ...boothEvents];
      setEvents(allEvents);
      setFilteredEvents(allEvents);
      
      if (nonBoothEvents && nonBoothEvents.length > 0) {
        await fetchRegistrationCounts(nonBoothEvents);
      }
    } catch (error) {
      console.error('Error completing workshop:', error);
      const errorMsg = error.response?.data?.message || error.message;
      const hint = error.response?.data?.hint || '';
      alert(`Failed to complete workshop:\n\n${errorMsg}\n\n${hint}`);
    }
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
        case 'Booth':
          // Show booth application details if this is a booth application
          if (event._isBoothApplication && event._applicationData) {
            const app = event._applicationData;
            return (
              <div style={{marginTop: '1rem', padding: '1rem', backgroundColor: '#e8f5e8', borderRadius: '8px', border: '1px solid #4caf50'}}>
                <h4>🏪 Booth Application Details</h4>
                <div className="event-details">
                  <div className="event-detail-item">
                    <div className="event-detail-label">Vendor:</div>
                    <div className="event-detail-value">{app.vendor?.name}</div>
                  </div>
                  <div className="event-detail-item">
                    <div className="event-detail-label">Company:</div>
                    <div className="event-detail-value">{app.vendor?.company_name || 'N/A'}</div>
                  </div>
                  <div className="event-detail-item">
                    <div className="event-detail-label">Email:</div>
                    <div className="event-detail-value">{app.vendor?.email}</div>
                  </div>
                  <div className="event-detail-item">
                    <div className="event-detail-label">Booth Size:</div>
                    <div className="event-detail-value">{app.application?.booth_size || 'N/A'}</div>
                  </div>
                  <div className="event-detail-item">
                    <div className="event-detail-label">Duration:</div>
                    <div className="event-detail-value">{app.duration_weeks || 1} week(s)</div>
                  </div>
                  <div className="event-detail-item">
                    <div className="event-detail-label">Platform Position:</div>
                    <div className="event-detail-value">
                      {app.platform_position?.wall || 'N/A'} wall, Slot {app.platform_position?.slot || 'N/A'}
                    </div>
                  </div>
                  {app.application?.booth_location?.zone && (
                    <div className="event-detail-item">
                      <div className="event-detail-label">Zone:</div>
                      <div className="event-detail-value">Zone {app.application.booth_location.zone}</div>
                    </div>
                  )}
                  <div className="event-detail-item">
                    <div className="event-detail-label">Status:</div>
                    <div className="event-detail-value">
                      <span style={{color: '#4caf50', fontWeight: 'bold'}}>✅ Accepted</span>
                    </div>
                  </div>
                  {app.approved_by && (
                    <div className="event-detail-item">
                      <div className="event-detail-label">Approved By:</div>
                      <div className="event-detail-value">{app.approved_by.name}</div>
                    </div>
                  )}
                  {app.approved_at && (
                    <div className="event-detail-item">
                      <div className="event-detail-label">Approved On:</div>
                      <div className="event-detail-value">{formatDate(app.approved_at)}</div>
                    </div>
                  )}
                </div>
                {app.application?.notes && (
                  <div className="event-detail-item" style={{marginTop: '1rem'}}>
                    <div className="event-detail-label">Notes:</div>
                    <div className="event-detail-value">{app.application.notes}</div>
                  </div>
                )}
              </div>
            );
          }
          // Fallback for regular booth events
          return (
            <div style={{marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px'}}>
              <h4>Booth Details</h4>
              {event.booth?.vendors && event.booth.vendors.length > 0 && (
                <div className="event-detail-item">
                  <div className="event-detail-label">Vendors:</div>
                  <div className="event-detail-value">
                    {event.booth.vendors.map((v, i) => (
                      <div key={i}>{v.vendor_name} - {v.booth_assignment}</div>
                    ))}
                  </div>
                </div>
              )}
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

          {/* Comments Section */}
          <div style={{marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6'}}>
            <h4 style={{marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              💬 Comments & Feedback
              <span style={{
                fontSize: '0.85rem',
                fontWeight: 'normal',
                color: '#666',
                backgroundColor: '#e9ecef',
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                {eventComments.length}
              </span>
            </h4>
            
            {loadingComments ? (
              <div style={{textAlign: 'center', padding: '1rem', color: '#666'}}>
                ⏳ Loading comments...
              </div>
            ) : eventComments.length === 0 ? (
              <div style={{textAlign: 'center', padding: '2rem', color: '#999'}}>
                <p>💬 No comments yet</p>
                <small>Users haven't commented on this event yet</small>
              </div>
            ) : (
              <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                {eventComments.map((comment) => (
                  <div 
                    key={comment._id} 
                    style={{
                      backgroundColor: comment.status === 'deleted' ? '#ffebee' : 'white',
                      padding: '1rem',
                      marginBottom: '0.75rem',
                      borderRadius: '8px',
                      border: comment.status === 'deleted' ? '1px solid #ef5350' : '1px solid #e0e0e0',
                      opacity: comment.status === 'deleted' ? 0.6 : 1
                    }}
                  >
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem'}}>
                      <div>
                        <strong style={{color: '#333'}}>
                          {comment.author_id?.first_name} {comment.author_id?.last_name}
                        </strong>
                        <br/>
                        <small style={{color: '#666', fontSize: '0.85em'}}>
                          {comment.author_id?.email}
                        </small>
                        {comment.status === 'deleted' && (
                          <span style={{
                            marginLeft: '0.5rem',
                            color: '#d32f2f',
                            fontSize: '0.85em',
                            fontWeight: 'bold'
                          }}>
                            🗑️ DELETED
                          </span>
                        )}
                      </div>
                      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem'}}>
                        <small style={{color: '#999', fontSize: '0.85em'}}>
                          {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString()}
                        </small>
                        {comment.status !== 'deleted' && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.75em',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                            title="Delete Comment"
                          >
                            🗑️ Delete
                          </button>
                        )}
                      </div>
                    </div>
                    <p style={{margin: '0.5rem 0 0 0', color: '#333', lineHeight: '1.5'}}>
                      {comment.body}
                    </p>
                  </div>
                ))}
              </div>
            )}
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

        {salesModalOpen && (
          <div className={`modal show`} onClick={() => setSalesModalOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">📊 Attendees & Sales Report (All Events)</h3>
                <button className="close-btn" onClick={() => setSalesModalOpen(false)}>&times;</button>
              </div>

              <div style={{ padding: '8px 0 16px 0' }}>
                {/* Filters inside modal */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <input
                    type="text"
                    placeholder="Search by event name or description"
                    value={salesNameFilter}
                    onChange={(e) => setSalesNameFilter(e.target.value)}
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', minWidth: '220px' }}
                  />

                  <select
                    value={salesTypeFilter}
                    onChange={(e) => setSalesTypeFilter(e.target.value)}
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                  >
                    <option value="all">All Types</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Trip">Trip</option>
                    <option value="Bazaar">Bazaar</option>
                    <option value="Booth">Booth</option>
                    <option value="Conference">Conference</option>
                  </select>

                  <input
                    type="date"
                    value={salesStartDateFilter}
                    onChange={(e) => setSalesStartDateFilter(e.target.value)}
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                    title="Start date (filter by event start/end overlap)"
                  />

                  <input
                    type="date"
                    value={salesEndDateFilter}
                    onChange={(e) => setSalesEndDateFilter(e.target.value)}
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                    title="End date (filter by event start/end overlap)"
                  />

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={applySalesFilters}
                      disabled={salesLoading}
                    >
                      Apply
                    </button>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={clearSalesFilters}
                      disabled={salesLoading}
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <strong>Summary</strong>
                  {salesLoading && <small style={{ color: '#666' }}>Loading...</small>}
                  {salesError && <small style={{ color: 'red' }}>{salesError}</small>}
                </div>

                {!salesLoading && salesReport && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <div className="stat-card" style={{ padding: '12px' }}>
                        <div className="stat-icon">💰</div>
                        <div className="stat-info">
                          <h3>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(salesReport.totals?.total_revenue || 0)}</h3>
                          <p>Total Revenue</p>
                        </div>
                      </div>
                      <div className="stat-card" style={{ padding: '12px' }}>
                        <div className="stat-icon">🎫</div>
                        <div className="stat-info">
                          <h3>{salesReport.totals?.total_attendees || 0}</h3>
                          <p>Total Attendees</p>
                        </div>
                      </div>
                      <div className="stat-card" style={{ padding: '12px' }}>
                        <div className="stat-icon">✅</div>
                        <div className="stat-info">
                          <h3>{salesReport.totals?.total_paid_registrations || 0}</h3>
                          <p>Paid Registrations</p>
                        </div>
                      </div>
                      <div className="stat-card" style={{ padding: '12px' }}>
                        <div className="stat-icon">⚠️</div>
                        <div className="stat-info">
                          <h3>{salesReport.totals?.total_unpaid_registrations || 0}</h3>
                          <p>Unpaid Registrations</p>
                        </div>
                      </div>
                    </div>

                    {/* Quick table */}
                    <div style={{ marginTop: '16px', maxHeight: '60vh', overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#f8f9fa' }}>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Event</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Type</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Attendees</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Paid</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Free</th>
                            <th style={{ padding: '8px', textAlign: 'right' }}>Unpaid</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salesReport.report?.map((r, i) => (
                            <tr key={r.event_id || i} style={{ borderBottom: '1px solid #eee' }}>
                              <td style={{ padding: '8px' }}>{r.event_name}</td>
                              <td style={{ padding: '8px' }}>{r.event_type}</td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>{r.total_attendees}</td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>{r.paid_registrations}</td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>{r.free_registrations}</td>
                              <td style={{ padding: '8px', textAlign: 'right' }}>{r.unpaid_registrations}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
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
              {/* Search by Name, Location, Description, or Professor */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Search by Name, Location, Description, or Professor
                </label>
                <input
                  type="text"
                  placeholder="Enter search terms..."
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
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
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
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', alignItems: 'center' }}>
                <button
                  onClick={handleViewAllAttendees}
                  className="btn btn-secondary btn-sm"
                  title="View attendees across all events"
                >
                  📊 View All Attendees
                </button>

                <button 
                  onClick={clearFilters} 
                  className="btn btn-secondary btn-sm"
                >
                  🔄 Clear All Filters
                </button>
              </div>
            </div>

            {/* Results Count */}
            <div style={{ marginTop: '12px', color: '#666', fontSize: '14px' }}>
              Showing {filteredEvents.length} of {events.length} events
              {(searchTerm || filter !== 'all' || filterLocation || filterProfessor) && (
                <span style={{ 
                  marginLeft: '10px',
                  background: '#0066cc',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  ✓ Filters Active
                </span>
              )}
            </div>
          </div>

          <section className="section">

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
                  ) : filteredEvents.length === 0 && events.length > 0 ? (
                    <tr>
                      <td colSpan="8" className="empty-row">
                        <div className="empty-state">
                          <p>� No events found matching your criteria</p>
                          {filter !== 'all' && (
                            <p style={{fontSize: '0.9rem', color: '#999'}}>
                              No {filter.toLowerCase()} events match your search criteria
                            </p>
                          )}
                          {searchTerm && (
                            <p style={{fontSize: '0.9rem', color: '#999'}}>
                              Try adjusting your search terms or clearing filters
                            </p>
                          )}
                          <button 
                            onClick={clearFilters}
                            className="btn btn-secondary btn-sm"
                            style={{marginTop: '10px'}}
                          >
                            Clear All Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="empty-row">
                        <div className="empty-state">
                          <p>📅 No events available</p>
                          <p style={{fontSize: '0.9rem', color: '#999'}}>
                            No events have been created yet
                          </p>
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
                          {event.type === 'Workshop' && event.status !== 'completed' && event.status !== 'cancelled' && (
                            <button 
                              className="btn btn-sm"
                              onClick={() => handleCompleteWorkshop(event._id, event.name, event.end_date)}
                              title="Complete Workshop & Send Certificates"
                              style={{marginLeft: '4px', backgroundColor: '#28a745', color: 'white'}}
                            >
                              🎓 Complete
                            </button>
                          )}
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteEvent(event._id, event.name, event._isBoothApplication)}
                            title={event._isBoothApplication ? "Cancel Booth" : "Delete Event"}
                            style={{marginLeft: '4px'}}
                          >
                            {event._isBoothApplication ? '❌ Cancel' : '🗑️ Delete'}
                          </button>
                          {/* (removed per-event Reports button) */}
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
