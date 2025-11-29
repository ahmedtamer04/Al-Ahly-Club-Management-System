'use client';

import { useState, useEffect } from 'react';
import { eventAPI } from '@/utils/api';
import RatingStars from './RatingStars';

export default function RatingForm({ eventId, onSuccess, onCancel }) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [existingRating, setExistingRating] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExistingRating();
  }, [eventId]);

  const fetchExistingRating = async () => {
    try {
      const data = await eventAPI.getMyRating(eventId);
      if (data.rating) {
        setExistingRating(data.rating);
        setRating(data.rating.rating);
        setReview(data.rating.review || '');
      }
    } catch (err) {
      // No existing rating, that's fine
      console.log('No existing rating');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await eventAPI.rateEvent(eventId, { rating, review });
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your rating?')) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await eventAPI.deleteRating(eventId);
      setRating(0);
      setReview('');
      setExistingRating(null);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="rating-form">
      <h3>{existingRating ? 'Update Your Rating' : 'Rate This Event'}</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Your Rating *</label>
          <RatingStars 
            rating={rating} 
            onRatingChange={setRating}
            size="large"
          />
          <div className="rating-label">
            {rating === 0 && 'Select a rating'}
            {rating === 1 && '★ Poor'}
            {rating === 2 && '★★ Fair'}
            {rating === 3 && '★★★ Good'}
            {rating === 4 && '★★★★ Very Good'}
            {rating === 5 && '★★★★★ Excellent'}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="review">Review (Optional)</label>
          <textarea
            id="review"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Share your experience with this event..."
            maxLength={500}
            rows={4}
          />
          <div className="char-count">{review.length}/500</div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          <button 
            type="submit" 
            disabled={submitting || rating === 0}
            className="submit-btn"
          >
            {submitting ? 'Submitting...' : existingRating ? 'Update Rating' : 'Submit Rating'}
          </button>
          
          {existingRating && (
            <button 
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="delete-btn"
            >
              Delete Rating
            </button>
          )}
          
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel}
              disabled={submitting}
              className="cancel-btn"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <style jsx>{`
        .rating-form {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        h3 {
          margin: 0 0 20px 0;
          color: #2c3e50;
        }

        .form-group {
          margin-bottom: 20px;
        }

        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #2c3e50;
        }

        .rating-label {
          margin-top: 8px;
          color: #7f8c8d;
          font-size: 14px;
        }

        textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-family: inherit;
          font-size: 14px;
          resize: vertical;
        }

        textarea:focus {
          outline: none;
          border-color: #3498db;
        }

        .char-count {
          text-align: right;
          font-size: 12px;
          color: #95a5a6;
          margin-top: 4px;
        }

        .error-message {
          background-color: #ffebee;
          color: #c62828;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        button {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .submit-btn {
          background-color: #3498db;
          color: white;
        }

        .submit-btn:hover:not(:disabled) {
          background-color: #2980b9;
        }

        .delete-btn {
          background-color: #e74c3c;
          color: white;
        }

        .delete-btn:hover:not(:disabled) {
          background-color: #c0392b;
        }

        .cancel-btn {
          background-color: #95a5a6;
          color: white;
        }

        .cancel-btn:hover:not(:disabled) {
          background-color: #7f8c8d;
        }

        .loading {
          text-align: center;
          padding: 20px;
          color: #7f8c8d;
        }
      `}</style>
    </div>
  );
}
