'use client';

import { useEffect, useState } from 'react';
import StaffLayout from '../../components/StaffLayout';
import { waitlistAPI } from '../../../utils/api';
import ConfirmPromotionModal from '../../components/ConfirmPromotionModal';
import '../../student/my-waitlist/waitlist.css';

export default function MyWaitlist() {
  const [waitlistEntries, setWaitlistEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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

  const onConfirmSuccess = () => {
    setShowConfirmModal(false);
    setSelectedPromotion(null);
    fetchWaitlist();
    alert('Registration confirmed! Please complete payment if required.');
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
      <StaffLayout>
        <div className="waitlist-loading">Loading your waitlist...</div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
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
      </div>
    </StaffLayout>
  );
}
