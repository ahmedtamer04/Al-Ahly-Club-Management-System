'use client';

/**
 * EXAMPLE: Enhanced Event Detail Page
 * This demonstrates all UI/UX improvements applied
 * Use this as a template for updating other pages
 */

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { eventAPI, registrationAPI, getUser } from '@/utils/api';
import Breadcrumb from '@/app/components/Breadcrumb';
import { useToast } from '@/app/components/ToastContainer';
import Tooltip from '@/app/components/Tooltip';
import PaymentModal from '@/app/components/PaymentModal';
import '@/app/dashboard.css';
import '@/app/utilities.css';

export default function EnhancedEventDetailPage({ params }) {
  const eventId = params?.id;
  const toast = useToast();
  
  // State management
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Fetch event details
  useEffect(() => {
    fetchEventDetails();
    checkRegistrationStatus();
    checkFavoriteStatus();
  }, [eventId]);
  
  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const data = await eventAPI.getById(eventId);
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.showError('Error', 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };
  
  const checkRegistrationStatus = async () => {
    try {
      const user = getUser();
      if (!user) return;
      
      const registrations = await registrationAPI.getMyRegistrations(user._id);
      const registered = registrations.upcoming?.some(
        reg => (reg.event_id._id || reg.event_id) === eventId
      );
      setIsRegistered(registered);
    } catch (error) {
      console.error('Error checking registration:', error);
    }
  };
  
  const checkFavoriteStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/favorites`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const favorites = await response.json();
        setIsFavorite(favorites.some(fav => fav._id === eventId));
      }
    } catch (error) {
      console.error('Error checking favorites:', error);
    }
  };
  
  const handleRegister = async () => {
    try {
      setRegistering(true);
      const user = getUser();
      
      const registration = await registrationAPI.register({
        event_id: eventId,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        personalId: user.id_number,
        role: user.role
      });
      
      // If paid event, show payment modal
      if (event.fees > 0 || event.price > 0) {
        setShowPaymentModal(true);
      } else {
        setIsRegistered(true);
        toast.showSuccess('Registration Successful!', 'You are now registered for this event');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.showError('Registration Failed', error.message || 'Please try again');
    } finally {
      setRegistering(false);
    }
  };
  
  const handleToggleFavorite = async () => {
    try {
      const method = isFavorite ? 'DELETE' : 'POST';
      const url = isFavorite 
        ? `${process.env.NEXT_PUBLIC_API_URL}/favorites/${eventId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/favorites`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: method === 'POST' ? JSON.stringify({ event_id: eventId }) : undefined
      });
      
      if (response.ok) {
        setIsFavorite(!isFavorite);
        toast.showSuccess(
          isFavorite ? 'Removed from Favorites' : 'Added to Favorites',
          isFavorite ? 'Event removed from your favorites' : 'Event added to your favorites'
        );
      }
    } catch (error) {
      toast.showError('Error', 'Failed to update favorites');
    }
  };
  
  const formatDate = (date) => {
    if (!date) return 'TBD';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="dashboard">
        <nav className="dashboard-nav">
          <div className="nav-container">
            <h1 className="nav-brand">Al-Ahly Events</h1>
            <div className="nav-links">
              <span className="nav-user">👨‍🎓 Student Dashboard</span>
              <Link href="/">Logout</Link>
            </div>
          </div>
        </nav>
        
        <div className="dashboard-content">
          <main className="main-content">
            {/* Loading state with proper feedback */}
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="animate-pulse">Loading event details...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  // Error state
  if (!event) {
    return (
      <div className="dashboard">
        <nav className="dashboard-nav">
          <div className="nav-container">
            <h1 className="nav-brand">Al-Ahly Events</h1>
            <div className="nav-links">
              <span className="nav-user">👨‍🎓 Student Dashboard</span>
              <Link href="/">Logout</Link>
            </div>
          </div>
        </nav>
        
        <div className="dashboard-content">
          <main className="main-content">
            {/* Error state with guidance */}
            <div className="empty-state">
              <h3>Event Not Found</h3>
              <p>The event you're looking for doesn't exist or has been removed.</p>
              <Link href="/student/events" className="btn-primary mt-3">
                ← Back to Events
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  return (
    <div className="dashboard">
      {/* Navigation Bar */}
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">👨‍🎓 Student Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>
      
      <div className="dashboard-content">
        {/* Sidebar - kept for consistency */}
        <aside className="sidebar">
          <ul className="sidebar-menu">
            {/* Section: Main */}
            <li className="sidebar-section-title">Main</li>
            <li><Link href="/student">🏠 Dashboard</Link></li>
            <li><Link href="/student/events" className="active">📅 Browse Events</Link></li>
            
            <div className="sidebar-divider"></div>
            
            {/* Section: My Activity */}
            <li className="sidebar-section-title">My Activity</li>
            <li><Link href="/student/favorites">⭐ My Favorites</Link></li>
            <li><Link href="/student/my-registrations">🎫 My Registrations</Link></li>
            <li><Link href="/student/payment-history">💰 Payment History</Link></li>
            
            <div className="sidebar-divider"></div>
            
            {/* Section: More */}
            <li className="sidebar-section-title">More</li>
            <li><Link href="/polls-voting">📊 Vote for Vendors</Link></li>
            <li><Link href="/loyalty-program">🎁 Loyalty Program</Link></li>
            <li><Link href="/student/facilities">🏢 Facilities</Link></li>
            <li><Link href="/student/gym/schedule">💪 Gym Schedule</Link></li>
            
            <div className="sidebar-divider"></div>
            
            {/* Section: Account */}
            <li className="sidebar-section-title">Account</li>
            <li><Link href="/student/profile">👤 Profile</Link></li>
          </ul>
        </aside>
        
        <main className="main-content">
          {/* Breadcrumb Navigation - NO browser back button needed! */}
          <Breadcrumb items={[
            { label: 'Dashboard', href: '/student' },
            { label: 'Events', href: '/student/events' },
            { label: event.name }
          ]} />
          
          {/* Back Button */}
          <Link href="/student/events" className="btn-back mb-3">
            ← Back to Events
          </Link>
          
          {/* Page Header with Actions */}
          <div className="flex justify-between items-start mb-3">
            <div>
              <h1 className="m-0">{event.name}</h1>
              <span className={`status-badge status-${event.status}`}>
                {event.status}
              </span>
            </div>
            
            <div className="flex gap-2">
              {/* Favorite Button with Tooltip */}
              <Tooltip text={isFavorite ? "Remove from favorites" : "Add to favorites"}>
                <button
                  onClick={handleToggleFavorite}
                  className="btn-secondary"
                  aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  aria-pressed={isFavorite}
                >
                  {isFavorite ? '⭐' : '☆'} Favorite
                </button>
              </Tooltip>
              
              {/* Register Button with Loading State */}
              {!isRegistered ? (
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className={registering ? 'btn-primary btn-loading' : 'btn-primary'}
                  aria-label="Register for event"
                >
                  {registering ? 'Registering...' : '📝 Register Now'}
                </button>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-md">
                  <span>✓</span>
                  <span className="font-semibold">Registered</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Event Details Card */}
          <div className="section">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Event Info */}
              <div>
                <h2 className="text-xl font-bold mb-3">Event Information</h2>
                
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold" style={{minWidth: '120px'}}>📅 Date:</span>
                    <span>{formatDate(event.start_date)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-semibold" style={{minWidth: '120px'}}>📍 Location:</span>
                    <span>{event.location}</span>
                  </div>
                  
                  {event.type === 'Workshop' && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold" style={{minWidth: '120px'}}>👨‍🏫 Professor:</span>
                        <span>{event.workshop?.faculty_responsible}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-semibold" style={{minWidth: '120px'}}>💰 Fee:</span>
                        <span className="text-lg font-bold text-red">
                          {event.workshop?.fees > 0 ? `${event.workshop.fees} EGP` : 'Free'}
                        </span>
                      </div>
                    </>
                  )}
                  
                  {event.type === 'Trip' && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold" style={{minWidth: '120px'}}>💰 Price:</span>
                      <span className="text-lg font-bold text-red">
                        {event.trip?.price} EGP
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <span className="font-semibold" style={{minWidth: '120px'}}>👥 Capacity:</span>
                    <span>{event.registration_count || 0} / {event.max_capacity}</span>
                    <div 
                      className="flex-1 bg-gray-200 rounded-full h-2 ml-2"
                      role="progressbar"
                      aria-valuenow={event.registration_count || 0}
                      aria-valuemin="0"
                      aria-valuemax={event.max_capacity}
                    >
                      <div 
                        className="bg-yellow h-2 rounded-full transition-all"
                        style={{width: `${((event.registration_count || 0) / event.max_capacity) * 100}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <div>
                <h2 className="text-xl font-bold mb-3">Description</h2>
                <p className="text-gray-700 leading-relaxed">
                  {event.description || event.short_description || 'No description available.'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Additional Information based on event type */}
          {event.type === 'Workshop' && event.workshop?.full_agenda && (
            <div className="section mt-3">
              <h2 className="text-xl font-bold mb-3">Workshop Agenda</h2>
              <p className="text-gray-700 whitespace-pre-line">
                {event.workshop.full_agenda}
              </p>
            </div>
          )}
          
          {/* Payment Modal */}
          {showPaymentModal && (
            <PaymentModal
              isOpen={showPaymentModal}
              onClose={() => setShowPaymentModal(false)}
              eventId={eventId}
              eventName={event.name}
              amount={event.workshop?.fees || event.trip?.price || 0}
              eventType={event.type.toLowerCase()}
              onPaymentSuccess={() => {
                setIsRegistered(true);
                setShowPaymentModal(false);
                toast.showSuccess('Payment Successful!', 'You are now registered for this event');
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
