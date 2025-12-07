"use client";

import { useState, useEffect } from 'react';
import { waitlistAPI } from '../../utils/api';

export default function WaitlistButton({ event, onUpdate }) {
  const [waitlistInfo, setWaitlistInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWaitlistInfo();
  }, [event._id]);

  const fetchWaitlistInfo = async () => {
    try {
      const response = await waitlistAPI.getEventWaitlist(event._id);
      setWaitlistInfo(response);
    } catch (err) {
      console.error('Error fetching waitlist info:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWaitlist = async () => {
    try {
      setSubmitting(true);
      await waitlistAPI.join(event._id);
      await fetchWaitlistInfo();
      if (onUpdate) onUpdate();
      alert('Successfully joined waitlist!');
    } catch (err) {
      console.error('Error joining waitlist:', err);
      alert(err.message || 'Failed to join waitlist');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveWaitlist = async () => {
    if (!confirm(`Are you sure you want to leave the waitlist for ${event.name}?`)) {
      return;
    }

    try {
      setSubmitting(true);
      await waitlistAPI.leave(event._id);
      await fetchWaitlistInfo();
      if (onUpdate) onUpdate();
      alert('Successfully left waitlist');
    } catch (err) {
      console.error('Error leaving waitlist:', err);
      alert(err.message || 'Failed to leave waitlist');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '0.5rem', color: '#666', fontSize: '0.9rem' }}>Loading...</div>;
  }

  if (!waitlistInfo) {
    return null;
  }

  // Show status if user is on waitlist
  if (waitlistInfo.onWaitlist) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        padding: '1rem',
        background: waitlistInfo.status === 'promoted' 
          ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)'
          : 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
        borderRadius: '8px',
        border: `2px solid ${waitlistInfo.status === 'promoted' ? '#28a745' : '#ffc107'}`
      }}>
        {waitlistInfo.status === 'promoted' ? (
          <>
            <div style={{ fontWeight: 700, color: '#155724', fontSize: '1.05rem' }}>
              🎉 You've been promoted!
            </div>
            <div style={{ fontSize: '0.9rem', color: '#155724' }}>
              Check My Waitlist to confirm your registration
            </div>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 600, color: '#856404', fontSize: '0.95rem' }}>
              ⏳ You're on the waitlist
            </div>
            <div style={{ fontSize: '0.85rem', color: '#856404' }}>
              Position: <strong>#{waitlistInfo.position}</strong> of {waitlistInfo.waitlistSize}
            </div>
            <button
              onClick={handleLeaveWaitlist}
              disabled={submitting}
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'white',
                color: '#d32f2f',
                border: '2px solid #d32f2f',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              {submitting ? 'Leaving...' : 'Leave Waitlist'}
            </button>
          </>
        )}
      </div>
    );
  }

  // Show join waitlist button if event is full and user is not on waitlist
  return (
    <button
      onClick={handleJoinWaitlist}
      disabled={submitting}
      style={{
        padding: '0.75rem 1.5rem',
        background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: '1rem',
        width: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s'
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'translateY(-2px)';
        e.target.style.boxShadow = '0 4px 12px rgba(255, 152, 0, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = 'none';
      }}
    >
      {submitting ? 'Joining...' : '⏳ Join Waitlist'}
    </button>
  );
}
