'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StudentLayout from '../../components/StudentLayout';
import { waitlistAPI } from '../../../utils/api';
import ConfirmPromotionModal from '../../components/ConfirmPromotionModal';
import PaymentModal from '../../components/PaymentModal';
import './waitlist.css';

export default function MyWaitlist() {
  const router = useRouter();
  const [waitlistEntries, setWaitlistEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    fetchWaitlist();
    
    // Poll for updates every 30 seconds to check for promotions
    const interval = setInterval(fetchWaitlist, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchWaitlist = async () => {
    try {
      setError('');
      const response = await waitlistAPI.getMyWaitlist();
      setWaitlistEntries(response.waitlist || []);
    } catch (err) {
      console.error('Error fetching waitlist:', err);
      setError(err.message || 'Failed to load waitlist');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveWaitlist = async (eventId, eventName) => {
    if (!confirm(`Are you sure you want to leave the waitlist for ${eventName}?`)) {
      return;
    }

    try {
      await waitlistAPI.leave(eventId);
      alert('Successfully left waitlist');
      fetchWaitlist();
    } catch (err) {
      console.error('Error leaving waitlist:', err);
      alert(err.message || 'Failed to leave waitlist');
    }
  };

  const handleConfirmPromotion = (entry) => {
    setSelectedPromotion(entry);
    setShowConfirmModal(true);
  };

  const onConfirmSuccess = (response) => {
    setShowConfirmModal(false);
    setSelectedPromotion(null);
    fetchWaitlist();
    
    // Check if payment is required
    if (response?.registration?.requiresPayment) {
      // Redirect to payment
      setPaymentData({
        registrationId: response.registration.id,
        amount: response.registration.paymentAmount,
        eventName: selectedPromotion?.event?.name || 'Event',
        eventType: selectedPromotion?.event?.type || 'Event'
      });
      setShowPaymentModal(true);
    } else {
      // Free event - registration complete
      alert('Registration confirmed! You are now registered.');
      router.push('/student/my-registrations');
    }
  };
  
  const handlePaymentSuccess = async (payment) => {
    console.log('Payment successful:', payment);
    setShowPaymentModal(false);
    setPaymentData(null);
    alert('Payment completed! Registration confirmed.');
    router.push('/student/my-registrations');
  };
  
  const handlePaymentModalClose = async () => {
    // User closed modal without paying - registration still pending
    setShowPaymentModal(false);
    setPaymentData(null);
    alert('Payment not completed. You can complete payment from My Registrations page.');
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (deadline) => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="waitlist-loading">Loading your waitlist...</div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="waitlist-container">
        <div className="waitlist-header">
          <h1>My Waitlist</h1>
          <p>Events you're waiting for</p>
        </div>

        {error && <div className="waitlist-error">{error}</div>}

        {waitlistEntries.length === 0 ? (
          <div className="waitlist-empty">
            <p>You're not on any waitlists</p>
            <p className="waitlist-empty-subtitle">
              When an event is full, you can join the waitlist and get notified if a spot opens up.
            </p>
          </div>
        ) : (
          <div className="waitlist-grid">
            {waitlistEntries.map((entry) => (
              <div 
                key={entry._id} 
                className={`waitlist-card ${entry.status === 'promoted' ? 'promoted' : ''}`}
              >
                {entry.status === 'promoted' && (
                  <div className="promotion-badge">🎉 You've been promoted!</div>
                )}

                <div className="waitlist-card-header">
                  <h3>{entry.event.name}</h3>
                  <span className="event-type-badge">{entry.event.type}</span>
                </div>

                <div className="waitlist-card-details">
                  <div className="detail-row">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">{formatDate(entry.event.start_date)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">{entry.event.location}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Your Position:</span>
                    <span className="position-badge">#{entry.position}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">People Waiting:</span>
                    <span className="detail-value">{entry.waitlistSize}</span>
                  </div>

                  {entry.status === 'promoted' && entry.confirmationDeadline && (
                    <div className="deadline-warning">
                      <div className="deadline-timer">
                        ⏰ {getTimeRemaining(entry.confirmationDeadline)}
                      </div>
                      <p className="deadline-text">
                        Confirm now or your spot will go to the next person!
                      </p>
                    </div>
                  )}
                </div>

                <div className="waitlist-card-actions">
                  {entry.status === 'promoted' ? (
                    <button 
                      className="btn-confirm-promotion"
                      onClick={() => handleConfirmPromotion(entry)}
                    >
                      Confirm Registration
                    </button>
                  ) : (
                    <button 
                      className="btn-leave-waitlist"
                      onClick={() => handleLeaveWaitlist(entry.event._id, entry.event.name)}
                    >
                      Leave Waitlist
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showConfirmModal && selectedPromotion && (
          <ConfirmPromotionModal
            waitlistEntry={selectedPromotion}
            onClose={() => {
              setShowConfirmModal(false);
              setSelectedPromotion(null);
            }}
            onSuccess={onConfirmSuccess}
          />
        )}
        
        {showPaymentModal && paymentData && (
          <PaymentModal
            registrationId={paymentData.registrationId}
            amount={paymentData.amount}
            eventName={paymentData.eventName}
            eventType={paymentData.eventType}
            onSuccess={handlePaymentSuccess}
            onClose={handlePaymentModalClose}
          />
        )}
      </div>
    </StudentLayout>
  );
}
