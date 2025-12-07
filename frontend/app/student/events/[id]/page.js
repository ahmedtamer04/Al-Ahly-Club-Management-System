'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import StudentLayout from '@/app/components/StudentLayout';
import '@/app/dashboard.css';
import { eventAPI, registrationAPI, getUser, notificationAPI } from '@/utils/api';
import PaymentModal from '@/app/components/PaymentModal';
import RatingsList from '@/app/components/RatingsList';
import RatingForm from '@/app/components/RatingForm';
import CommentsList from '@/app/components/CommentsList';
import CommentForm from '@/app/components/CommentForm';
import EventResourcesTab from '@/app/components/EventResourcesTab';

export default function EventDetailsPage({ params }) {
  const searchParams = useSearchParams();
  const notificationId = searchParams?.get('notification');
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // details, ratings, comments
  const [organizerMessages, setOrganizerMessages] = useState([]);
  
  // Registration modal states
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    email: '',
    personalId: ''
  });
  const [registering, setRegistering] = useState(false);
  
  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  
  // Rating and Comment form states
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);

  useEffect(() => {
    const loadEvent = async () => {
      try {
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

    const loadOrganizerMessages = async () => {
      try {
        const response = await notificationAPI.getNotifications(false);
        const messages = response.notifications
          .filter(n => n.type === 'event_message' && n.event_id === params.id)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrganizerMessages(messages);
      } catch (err) {
        console.error('Failed to load organizer messages:', err);
      }
    };

    if (params.id) {
      loadEvent();
      loadOrganizerMessages();
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

      const response = await fetch('http://localhost:5000/api/registration/register', {
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

      const eventPrice = event.workshop?.price || event.trip?.price || 0;
      
      if (eventPrice > 0) {
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
        alert('Registration successful!');
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
      try {
        const token = localStorage.getItem('token');
        await fetch(`http://localhost:5000/api/registration/cancel-unpaid/${paymentData.registrationId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('Unpaid registration canceled');
      } catch (error) {
        console.error('Error canceling registration:', error);
      }
    }
    setShowPaymentModal(false);
    setPaymentData(null);
  };

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

  const handleRatingSuccess = () => {
    setShowRatingForm(false);
    alert('Rating submitted successfully!');
  };

  const handleCommentSuccess = () => {
    setShowCommentForm(false);
    alert('Comment posted successfully!');
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading event...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">{error}</div>
        <Link href="/student/events" className="btn-back">← Back to Events</Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="dashboard-container">
        <div className="error-message">Event not found</div>
        <Link href="/student/events" className="btn-back">← Back to Events</Link>
      </div>
    );
  }

  return (
    <StudentLayout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>{event.name}</h1>
          <Link href="/student/events" className="btn-back">← Back to Events</Link>
        </div>

        {/* Organizer Messages */}
        {organizerMessages.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                {organizerMessages.map((msg) => (
                  <div 
                    key={msg._id}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      padding: '20px',
                      borderRadius: '12px',
                      marginBottom: '12px',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '24px' }}>📨</span>
                      <div>
                        <strong style={{ fontSize: '16px', display: 'block' }}>Message from Organizer</strong>
                        {msg.metadata?.sender_name && (
                          <span style={{ fontSize: '14px', opacity: 0.9 }}>{msg.metadata.sender_name}</span>
                        )}
                      </div>
                      <span style={{ marginLeft: 'auto', fontSize: '13px', opacity: 0.8 }}>
                        {new Date(msg.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      padding: '16px',
                      borderRadius: '8px',
                      fontSize: '15px',
                      lineHeight: '1.6'
                    }}>
                      {msg.metadata?.organizer_message}
                    </div>
                  </div>
                ))}
              </div>
            )}

        {/* Tab Navigation */}
        <div className="tabs-container">
          <button 
            className={`tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Event Details
          </button>
          <button 
            className={`tab ${activeTab === 'ratings' ? 'active' : ''}`}
            onClick={() => setActiveTab('ratings')}
          >
            Ratings
          </button>
          <button 
            className={`tab ${activeTab === 'comments' ? 'active' : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            Comments
          </button>
          <button 
            className={`tab ${activeTab === 'resources' ? 'active' : ''}`}
            onClick={() => setActiveTab('resources')}
          >
            Resources
          </button>
        </div>

        {/* Event Details Tab */}
        {activeTab === 'details' && (
        <div className="event-details-card">
          <div className="event-header">
            <span className={`event-badge ${event.type.toLowerCase()}`}>
              {event.type}
            </span>
            <span className={`status-badge ${event.status}`}>
              {event.status}
            </span>
          </div>

          <div className="event-info-grid">
            <div className="info-item">
              <strong>📍 Location:</strong>
              <span>{event.location}</span>
            </div>
            
            <div className="info-item">
              <strong>📅 Start Date:</strong>
              <span>{formatDateTime(event.start_date)}</span>
            </div>
            
            <div className="info-item">
              <strong>📅 End Date:</strong>
              <span>{formatDateTime(event.end_date)}</span>
            </div>
            
            <div className="info-item">
              <strong>🕐 Time:</strong>
              <span>{event.time}</span>
            </div>
          </div>

          <div className="event-description">
            <h3>Description</h3>
            <p>{event.short_description}</p>
          </div>

          {/* Type-specific details */}
          {event.type === 'Workshop' && event.workshop && (
            <div className="workshop-details">
              <h3>Workshop Details</h3>
              <div className="info-item">
                <strong>Faculty Responsible:</strong>
                <span>{event.workshop.faculty_responsible}</span>
              </div>
              <div className="info-item">
                <strong>Professors:</strong>
                <span>{event.workshop.professors_participating?.join(', ')}</span>
              </div>
              <div className="info-item">
                <strong>Capacity:</strong>
                <span>{event.workshop.capacity} attendees</span>
              </div>
              <div className="info-item">
                <strong>Price:</strong>
                <span>${event.workshop.price || 0}</span>
              </div>
              <div className="info-item">
                <strong>Registration Deadline:</strong>
                <span>{formatDateTime(event.workshop.registration_deadline)}</span>
              </div>
              <div className="agenda">
                <strong>Full Agenda:</strong>
                <p>{event.workshop.full_agenda}</p>
              </div>
            </div>
          )}

          {event.type === 'Trip' && event.trip && (
            <div className="trip-details">
              <h3>Trip Details</h3>
              <div className="info-item">
                <strong>Price:</strong>
                <span>${event.trip.price}</span>
              </div>
              <div className="info-item">
                <strong>Capacity:</strong>
                <span>{event.trip.capacity} attendees</span>
              </div>
              <div className="info-item">
                <strong>Registration Deadline:</strong>
                <span>{formatDateTime(event.trip.registration_deadline)}</span>
              </div>
            </div>
          )}

          <div className="event-actions">
            <button onClick={handleRegisterClick} className="register-btn">
              Register for Event
            </button>
          </div>
        </div>
        )}

        {/* Ratings Tab */}
        {activeTab === 'ratings' && (
          <div className="ratings-tab">
            {showRatingForm ? (
              <RatingForm 
                eventId={event._id}
                onSuccess={handleRatingSuccess}
                onCancel={() => setShowRatingForm(false)}
              />
            ) : (
              <RatingsList 
                eventId={event._id}
                onRateClick={() => setShowRatingForm(true)}
              />
            )}
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <div className="comments-tab">
            {showCommentForm ? (
              <CommentForm 
                eventId={event._id}
                onSuccess={handleCommentSuccess}
                onCancel={() => setShowCommentForm(false)}
              />
            ) : (
              <CommentsList 
                eventId={event._id}
                onCommentClick={() => setShowCommentForm(true)}
              />
            )}
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="resources-tab">
            <EventResourcesTab 
              eventId={event._id}
              canUpload={false}
            />
          </div>
        )}

        {/* Registration Modal */}
        {showRegistrationModal && (
        <div className="modal-overlay" onClick={() => setShowRegistrationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Register for {event.name}</h2>
            <form onSubmit={handleRegistrationSubmit}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={registrationForm.name}
                  onChange={(e) => setRegistrationForm({...registrationForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={registrationForm.email}
                  onChange={(e) => setRegistrationForm({...registrationForm, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Personal ID *</label>
                <input
                  type="text"
                  value={registrationForm.personalId}
                  onChange={(e) => setRegistrationForm({...registrationForm, personalId: e.target.value})}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" disabled={registering}>
                  {registering ? 'Registering...' : 'Register'}
                </button>
                <button type="button" onClick={() => setShowRegistrationModal(false)}>
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
          eventId={paymentData.eventId}
          registrationId={paymentData.registrationId}
          amount={paymentData.amount}
          eventName={paymentData.eventName}
          eventType={paymentData.eventType}
          onSuccess={handlePaymentSuccess}
          onClose={handlePaymentModalClose}
        />
        )}

        <style jsx>{`
        .tabs-container {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 2px solid #ecf0f1;
        }

        .tab {
          padding: 12px 24px;
          background: transparent;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          font-weight: 600;
          color: #7f8c8d;
          transition: all 0.2s;
        }

        .tab:hover {
          color: #2c3e50;
        }

        .tab.active {
          color: #3498db;
          border-bottom-color: #3498db;
        }

        .event-details-card {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .event-header {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }

        .event-badge {
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
        }

        .event-badge.workshop {
          background-color: #e3f2fd;
          color: #1976d2;
        }

        .event-badge.trip {
          background-color: #fff3e0;
          color: #f57c00;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
        }

        .status-badge.upcoming {
          background-color: #e8f5e9;
          color: #2e7d32;
        }

        .status-badge.completed {
          background-color: #eceff1;
          color: #607d8b;
        }

        .event-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .info-item strong {
          color: #7f8c8d;
          font-size: 14px;
        }

        .info-item span {
          color: #2c3e50;
          font-size: 16px;
        }

        .event-description,
        .workshop-details,
        .trip-details {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #ecf0f1;
        }

        .event-description h3,
        .workshop-details h3,
        .trip-details h3 {
          margin: 0 0 16px 0;
          color: #2c3e50;
        }

        .event-description p {
          line-height: 1.6;
          color: #2c3e50;
        }

        .agenda {
          margin-top: 16px;
        }

        .agenda p {
          margin-top: 8px;
          line-height: 1.6;
          color: #2c3e50;
          white-space: pre-wrap;
        }

        .event-actions {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #ecf0f1;
        }

        .register-btn {
          padding: 12px 32px;
          background-color: #3498db;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .register-btn:hover {
          background-color: #2980b9;
        }

        .ratings-tab,
        .comments-tab,
        .resources-tab {
          margin-top: 0;
        }
        `}</style>
      </div>
    </StudentLayout>
  );
}
