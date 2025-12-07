'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { eventAPI, getUser } from '@/utils/api';
import MessageParticipantsModal from '@/app/components/MessageParticipantsModal';
import RatingStars from '@/app/components/RatingStars';
import RatingForm from '@/app/components/RatingForm';
import RatingsList from '@/app/components/RatingsList';
import CommentForm from '@/app/components/CommentForm';
import CommentsList from '@/app/components/CommentsList';

export default function EventsOfficeEventDetails() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id;
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const data = await eventAPI.getById(eventId);
      setEvent(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSuccess = () => {
    setShowRatingForm(false);
    fetchEventDetails(); // Refresh to update average rating
  };

  const handleCommentSuccess = () => {
    setShowCommentForm(false);
  };

  const user = getUser();
  const creatorId = event?.created_by?._id || event?.created_by || event?.creator || event?.createdBy;
  const userId = user?._id || user?.id;
  const canMessage = user && (user.role === 'Admin' || user.role === 'EventsOffice' || (creatorId && userId && String(creatorId) === String(userId)));

  const handleMessageSuccess = (data) => {
    const recipients = data?.recipients ?? data?.recipientsCount ?? 0;
    alert(`Message sent to ${recipients} participants`);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading event details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => router.push('/eventsoffice/events')} style={styles.backButton}>
          Back to Events
        </button>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={styles.errorContainer}>
        <h2>Event Not Found</h2>
        <button onClick={() => router.push('/eventsoffice/events')} style={styles.backButton}>
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => router.push('/eventsoffice/events')} style={styles.backButton}>
          ← Back to Events
        </button>
        <h1 style={styles.title}>{event.name}</h1>
        <div style={styles.ratingDisplay}>
          <RatingStars rating={event.average_rating || 0} readOnly size="medium" />
          <span style={styles.ratingText}>
            {event.average_rating ? event.average_rating.toFixed(1) : 'No ratings yet'}
            {event.total_ratings > 0 && ` (${event.total_ratings} ${event.total_ratings === 1 ? 'rating' : 'ratings'})`}
          </span>
        </div>
        {canMessage && (
          <div style={{ marginTop: 12 }}>
            <button onClick={() => setShowMessageModal(true)} style={{ padding: '8px 12px', borderRadius: 6, background: '#0066cc', color: '#fff', border: 'none', cursor: 'pointer' }}>
              📨 Message Participants
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{...styles.tab, ...(activeTab === 'details' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('details')}
        >
          Event Details
        </button>
        <button
          style={{...styles.tab, ...(activeTab === 'ratings' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('ratings')}
        >
          Ratings ({event.total_ratings || 0})
        </button>
        <button
          style={{...styles.tab, ...(activeTab === 'comments' ? styles.activeTab : {})}}
          onClick={() => setActiveTab('comments')}
        >
          Comments
        </button>
      </div>

      {/* Tab Content */}
      <div style={styles.tabContent}>
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div style={styles.detailsCard}>
            <div style={styles.detailRow}>
              <strong>Type:</strong>
              <span style={styles.badge}>{event.event_type}</span>
            </div>
            
            <div style={styles.detailRow}>
              <strong>Date:</strong>
              <span>{new Date(event.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>

            <div style={styles.detailRow}>
              <strong>Time:</strong>
              <span>{event.time}</span>
            </div>

            <div style={styles.detailRow}>
              <strong>Location:</strong>
              <span>{event.location}</span>
            </div>

            <div style={styles.detailRow}>
              <strong>Capacity:</strong>
              <span>{event.current_registrations || 0} / {event.capacity} registered</span>
            </div>

            <div style={styles.detailRow}>
              <strong>Payment Required:</strong>
              <span>{event.payment_required ? `Yes (${event.price} EGP)` : 'Free'}</span>
            </div>

            {event.description && (
              <div style={styles.descriptionSection}>
                <strong>Description:</strong>
                <p style={styles.description}>{event.description}</p>
              </div>
            )}

            {/* Workshop-specific details */}
            {event.event_type === 'workshop' && event.target_year && (
              <div style={styles.detailRow}>
                <strong>Target Year:</strong>
                <span>{event.target_year}</span>
              </div>
            )}

            {/* Trip-specific details */}
            {event.event_type === 'trip' && (
              <>
                {event.departure_time && (
                  <div style={styles.detailRow}>
                    <strong>Departure Time:</strong>
                    <span>{event.departure_time}</span>
                  </div>
                )}
                {event.return_time && (
                  <div style={styles.detailRow}>
                    <strong>Return Time:</strong>
                    <span>{event.return_time}</span>
                  </div>
                )}
              </>
            )}

            {/* Conference-specific details */}
            {event.event_type === 'conference' && event.guest_speakers && event.guest_speakers.length > 0 && (
              <div style={styles.descriptionSection}>
                <strong>Guest Speakers:</strong>
                <ul style={styles.speakersList}>
                  {event.guest_speakers.map((speaker, index) => (
                    <li key={index}>{speaker}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Ratings Tab */}
        {activeTab === 'ratings' && (
          <div>
            {showRatingForm ? (
              <RatingForm
                eventId={eventId}
                onSuccess={handleRatingSuccess}
                onCancel={() => setShowRatingForm(false)}
              />
            ) : (
              <RatingsList
                eventId={eventId}
                onRateClick={() => setShowRatingForm(true)}
              />
            )}
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <div>
            {showCommentForm ? (
              <CommentForm
                eventId={eventId}
                onSuccess={handleCommentSuccess}
                onCancel={() => setShowCommentForm(false)}
              />
            ) : (
              <CommentsList
                eventId={eventId}
                onCommentClick={() => setShowCommentForm(true)}
              />
            )}
          </div>
        )}
      </div>
    </div>
      {showMessageModal && (
        <MessageParticipantsModal
          event={event}
          onClose={() => setShowMessageModal(false)}
          onSuccess={handleMessageSuccess}
        />
      )}
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '20px',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorContainer: {
    maxWidth: '600px',
    margin: '50px auto',
    padding: '30px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: 'center',
  },
  header: {
    marginBottom: '30px',
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    marginBottom: '15px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: '10px',
  },
  ratingDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '10px',
  },
  ratingText: {
    fontSize: '16px',
    color: '#7f8c8d',
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    borderBottom: '2px solid #ecf0f1',
    marginBottom: '30px',
  },
  tab: {
    padding: '12px 24px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    color: '#7f8c8d',
    transition: 'all 0.3s ease',
  },
  activeTab: {
    color: '#3498db',
    borderBottomColor: '#3498db',
  },
  tabContent: {
    minHeight: '400px',
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '15px 0',
    borderBottom: '1px solid #ecf0f1',
  },
  badge: {
    padding: '4px 12px',
    backgroundColor: '#3498db',
    color: 'white',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
  },
  descriptionSection: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '2px solid #ecf0f1',
  },
  description: {
    marginTop: '10px',
    lineHeight: '1.6',
    color: '#34495e',
  },
  speakersList: {
    marginTop: '10px',
    paddingLeft: '20px',
    lineHeight: '1.8',
  },
};
