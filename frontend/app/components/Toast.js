'use client';

import { useEffect } from 'react';

/**
 * Toast Component - Display notification messages
 * @param {Object} props
 * @param {string} props.type - 'success', 'error', 'warning', 'info'
 * @param {string} props.title - Toast title
 * @param {string} props.message - Toast message
 * @param {number} props.duration - Auto-dismiss duration in ms (default: 5000)
 * @param {function} props.onClose - Callback when toast is closed
 */
export default function Toast({ type = 'info', title, message, duration = 5000, onClose }) {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  return (
    <div className={`toast toast-${type}`} role="alert" aria-live="polite">
      <div className="toast-icon">
        {icons[type]}
      </div>
      <div className="toast-content">
        {title && <div className="toast-title">{title}</div>}
        {message && <p className="toast-message">{message}</p>}
      </div>
      {onClose && (
        <button 
          className="toast-close" 
          onClick={onClose}
          aria-label="Close notification"
        >
          ×
        </button>
      )}
    </div>
  );
}
