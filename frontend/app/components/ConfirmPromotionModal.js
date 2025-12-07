"use client";

import { useEffect, useState } from 'react';
import { waitlistAPI } from '../../utils/api';

export default function ConfirmPromotionModal({ waitlistEntry, onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      if (!waitlistEntry?.confirmationDeadline) return;
      const now = new Date();
      const end = new Date(waitlistEntry.confirmationDeadline);
      const diff = end - now;
      if (diff <= 0) return setRemaining('Expired');
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };
    updateTimer();
    const id = setInterval(updateTimer, 1000);
    return () => clearInterval(id);
  }, [waitlistEntry]);

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      setError('');
      const response = await waitlistAPI.confirmPromotion(waitlistEntry._id);
      if (onSuccess) onSuccess(response);
    } catch (err) {
      console.error('Confirm promotion error:', err);
      setError(err.message || 'Failed to confirm promotion');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Confirm Your Spot</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          <p>
            A spot opened up in <strong>{waitlistEntry?.event?.name || 'this event'}</strong>.
            Confirm within <strong>{remaining}</strong> to secure your registration.
          </p>
          {error && <div className="modal-error">{error}</div>}
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="btn-primary" onClick={handleConfirm} disabled={submitting}>
            {submitting ? 'Confirming...' : 'Confirm Registration'}
          </button>
        </div>
      </div>
      <style jsx>{`
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center; z-index: 1000;
        }
        .modal { background: #fff; border-radius: 12px; width: 100%; max-width: 520px; padding: 1rem; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .modal-header { display:flex; align-items:center; justify-content: space-between; }
        .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
        .modal-body { margin-top: .5rem; color: #333; }
        .modal-error { background: #fee; color: #c33; padding: .75rem; border-left: 4px solid #c33; border-radius: 6px; margin-top: .75rem; }
        .modal-actions { display:flex; justify-content: flex-end; gap: .5rem; margin-top: 1rem; }
        .btn-primary { background: #4caf50; color: white; border: none; border-radius: 8px; padding: .6rem 1rem; font-weight: 600; cursor: pointer; }
        .btn-primary:disabled { opacity: .7; cursor: default; }
        .btn-secondary { background: white; color: #333; border: 1px solid #ccc; border-radius: 8px; padding: .6rem 1rem; font-weight: 600; cursor: pointer; }
      `}</style>
    </div>
  );
}
