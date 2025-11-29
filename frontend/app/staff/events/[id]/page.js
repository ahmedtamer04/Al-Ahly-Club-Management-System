'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { eventAPI, getUser, registrationAPI } from '@/utils/api';
import PaymentModal from '@/app/components/PaymentModal';
import RatingStars from '@/app/components/RatingStars';
import RatingForm from '@/app/components/RatingForm';
import RatingsList from '@/app/components/RatingsList';
import CommentForm from '@/app/components/CommentForm';
import CommentsList from '@/app/components/CommentsList';

export default function StaffEventDetails({ params }) {
  const router = useRouter();
  const eventId = params.id;
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({ name: '', email: '', personalId: '' });
  const [registering, setRegistering] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        // Fetch event details by ID
        const data = await eventAPI.getById(params.id);
        if (data && data._id) {
          setEvent(data);
        } else {
          setError('Event not found');
        }
      } catch (err) {
        setError(err.message || 'Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadEvent();
    }
    
    // Pre-fill form with user data
    const user = getUser();
    if (user) {
      setRegistrationForm({
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        email: user.email || '',
        personalId: user.id_number || ''
      });
    }
  }, [params.id]);

  const handleRegisterClick = () => {
    if (event.type !== 'Workshop' && event.type !== 'Trip') {
      alert('Registration is only available for Workshops and Trips');
      return;
    }
    setShowRegistrationModal(true);
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    setRegistering(true);

    try {
      const user = getUser();
      
      if (!user) {
        alert('You must be logged in to register');
        setRegistering(false);
        return;
      }

      const response = await fetch('http://localhost:5001/api/registration/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_id: event._id,
          name: registrationForm.name,
          email: registrationForm.email,
          personalId: registrationForm.personalId,
          role: user.role
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Check if event requires payment
      const eventPrice = event.workshop?.price || event.trip?.price || 0;
      
      if (eventPrice > 0) {
        // Close registration modal and show payment modal
        setShowRegistrationModal(false);
        setPaymentData({
          eventId: event._id,
          registrationId: data.registration._id,
          amount: eventPrice,
          eventName: event.name,
          eventType: event.type
        });
        setShowPaymentModal(true);
      } else {
        // Free event - registration complete
        alert('Registration successful! You can view your registrations in the Browse Events page.');
        setShowRegistrationModal(false);
      }
      
      setRegistrationForm({ name: '', email: '', personalId: '' });
      
    } catch (err) {
      alert(err.message);
    } finally {
      setRegistering(false);
    }
  };

  const handlePaymentSuccess = async (payment) => {
    console.log('Payment successful:', payment);
    setShowPaymentModal(false);
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

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!event) return <div>Event not found</div>;

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <h1 className="nav-brand">Al-Ahly Events</h1>
          <div className="nav-links">
            <span className="nav-user">👨‍💼 Staff Dashboard</span>
            <Link href="/">Logout</Link>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li><Link href="/staff">🏠 Dashboard</Link></li>
            <li><Link href="/staff/events">📅 Browse Events</Link></li>
            <li><Link href="/staff/favorites">⭐ My Favorites</Link></li>
            <li><Link href="/staff/payment-history">💰 Payment History</Link></li>
            <li><Link href="/polls-voting">📊 Vote for Vendors</Link></li>
            <li><Link href="/loyalty-program">🎁 Loyalty Program</Link></li>
            <li><Link href="/staff/gym/schedule">💪 Gym Schedule</Link></li>
            <li><Link href="/staff/profile">👤 Profile</Link></li>
          </ul>
        </aside>

        <main className="main-content">
          <div className="section">
            <Link href="/staff/events" className="back-button">← Back to Events</Link>
            
            <h1>{event.name}</h1>
            <div className="event-details">
              <div className="event-info">
                <p className="event-type">{event.type}</p>
                <p className="event-location">📍 {event.location}</p>
                <p className="event-time">
                  🗓️ {new Date(event.start_date).toLocaleDateString()} at {event.time}
                </p>
                {event.end_date && (
                  <p className="event-end">
                    Ends: {new Date(event.end_date).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="event-description">
                <h2>Description</h2>
                <p>{event.short_description}</p>
              </div>

              {event.type === 'Workshop' && event.workshop && (
                <div className="workshop-details">
                  <h2>Workshop Details</h2>
                  <p><strong>Faculty:</strong> {event.workshop.faculty_responsible}</p>
                  <p><strong>Professors:</strong> {event.workshop.professors_participating?.join(', ')}</p>
                  <p><strong>Capacity:</strong> {event.workshop.capacity} participants</p>
                  <div className="agenda">
                    <h3>Full Agenda</h3>
                    <p>{event.workshop.full_agenda}</p>
                  </div>
                </div>
              )}

              {event.type === 'Trip' && event.trip && (
                <div className="trip-details">
                  <h2>Trip Details</h2>
                  <p><strong>Price:</strong> {event.trip.price} EGP</p>
                  <p><strong>Capacity:</strong> {event.trip.capacity} participants</p>
                  {event.trip.registration_deadline && (
                    <p><strong>Registration Deadline:</strong> {new Date(event.trip.registration_deadline).toLocaleDateString()}</p>
                  )}
                </div>
              )}

              {event.type === 'Conference' && event.conference && (
                <div className="conference-details">
                  <h2>Conference Details</h2>
                  <p><strong>Campus:</strong> {event.conference.campus}</p>
                  <p><strong>Professors:</strong> {event.conference.professors_participating?.join(', ')}</p>
                  <div className="agenda">
                    <h3>Full Agenda</h3>
                    <p>{event.conference.full_agenda}</p>
                  </div>
                  <p><a href={event.conference.conference_website} target="_blank" rel="noopener noreferrer">Conference Website ↗</a></p>
                </div>
              )}

              <div className="event-actions">
                {(event.type === 'Workshop' || event.type === 'Trip') && (
                  <button
                    className="btn-primary"
                    onClick={handleRegisterClick}
                  >
                    📝 Register for {event.type}
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Registration Modal */}
      {showRegistrationModal && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowRegistrationModal(false)}
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
            zIndex: 1001
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%',
              color: '#333'
            }}
          >
            <h2>Register for {event.name}</h2>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              <strong>Type:</strong> {event.type}
              {event.type === 'Trip' && event.trip?.price && (
                <span style={{ display: 'block', marginTop: '0.5rem' }}>
                  <strong>Price:</strong> {event.trip.price} EGP
                </span>
              )}
            </p>
            
            <form onSubmit={handleRegistrationSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Name:
                </label>
                <input
                  type="text"
                  required
                  value={registrationForm.name}
                  onChange={(e) => setRegistrationForm({...registrationForm, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Email:
                </label>
                <input
                  type="email"
                  required
                  value={registrationForm.email}
                  onChange={(e) => setRegistrationForm({...registrationForm, email: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Personal ID:
                </label>
                <input
                  type="text"
                  required
                  value={registrationForm.personalId}
                  onChange={(e) => setRegistrationForm({...registrationForm, personalId: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  type="submit"
                  disabled={registering}
                  className="btn-primary"
                  style={{ 
                    flex: 1,
                    opacity: registering ? 0.7 : 1,
                    cursor: registering ? 'not-allowed' : 'pointer'
                  }}
                >
                  {registering ? 'Registering...' : 'Register'}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowRegistrationModal(false)}
                  disabled={registering}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: registering ? 'not-allowed' : 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
