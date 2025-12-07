"use client";

import { useState } from 'react';
import { api } from '@/utils/api';

export default function MessageParticipantsModal({ event, onClose, onSuccess }) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    if (message.length > 500) {
      setError('Message is too long. Maximum 500 characters.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const data = await api.post(`/events/${event._id || event.id}/message-participants`, { message: message.trim() });

      if (onSuccess) onSuccess(data);
      onClose();
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Message All Participants</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          <p style={{ marginBottom: '1rem', color: '#666' }}>
            Send a message to all registered participants of <strong>{event.name}</strong>
          </p>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message (e.g., 'Don't forget to bring your ID card', 'Room changed to B301')"
            maxLength={500}
            rows={6}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '0.95rem',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />

          <div style={{ 
            marginTop: '0.5rem', 
            fontSize: '0.85rem', 
            color: message.length > 450 ? '#dc3545' : '#666',
            textAlign: 'right'
          }}>
            {message.length}/500 characters
          </div>

          {error && <div className="modal-error">{error}</div>}
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSend} disabled={submitting || !message.trim()}>
            {submitting ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </div>
      <style jsx>{`
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
          padding: 1rem;
        }
        .modal { 
          background: #fff; border-radius: 12px; width: 100%; max-width: 600px; 
          padding: 1.5rem; box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          max-height: 90vh; overflow-y: auto;
        }
        .modal-header { 
          display: flex; align-items: center; justify-content: space-between; 
          margin-bottom: 1rem;
        }
        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: #333;
        }
        .close-btn { 
          background: none; border: none; font-size: 2rem; 
          cursor: pointer; color: #666; line-height: 1;
        }
        .close-btn:hover {
          color: #333;
        }
        .modal-body { color: #333; }
        .modal-error { 
          background: #fee; color: #c33; padding: .75rem; 
          border-left: 4px solid #c33; border-radius: 6px; margin-top: .75rem; 
        }
        .modal-actions { 
          display: flex; justify-content: flex-end; gap: .75rem; margin-top: 1.5rem; 
        }
        .btn-primary { 
          background: #0066cc; color: white; border: none; border-radius: 8px; 
          padding: .75rem 1.5rem; font-weight: 600; cursor: pointer;
          transition: background 0.2s;
        }
        .btn-primary:hover:not(:disabled) {
          background: #0052a3;
        }
        .btn-primary:disabled { 
          opacity: .6; cursor: not-allowed; 
        }
        .btn-secondary { 
          background: white; color: #333; border: 2px solid #ddd; border-radius: 8px; 
          padding: .75rem 1.5rem; font-weight: 600; cursor: pointer;
          transition: border-color 0.2s;
        }
        .btn-secondary:hover:not(:disabled) {
          border-color: #999;
        }
      `}</style>
    </div>
  );
}
