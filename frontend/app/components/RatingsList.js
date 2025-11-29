'use client';

import { useState, useEffect } from 'react';
import { eventAPI } from '@/utils/api';
import RatingStars from './RatingStars';

export default function RatingsList({ eventId, onRateClick }) {
  const [ratings, setRatings] = useState([]);
  const [eventInfo, setEventInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRatings();
  }, [eventId]);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const data = await eventAPI.getRatings(eventId);
      setRatings(data.ratings || []);
      setEventInfo(data.event);
    } catch (err) {
      setError(err.message || 'Failed to load ratings');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">Loading ratings...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="ratings-list">
      <div className="ratings-header">
        <h3>Event Ratings</h3>
        {eventInfo && (
          <div className="event-rating-summary">
            <RatingStars rating={eventInfo.average_rating} readOnly size="medium" />
            <span className="average-rating">{eventInfo.average_rating.toFixed(1)}</span>
            <span className="total-ratings">({eventInfo.total_ratings} {eventInfo.total_ratings === 1 ? 'rating' : 'ratings'})</span>
          </div>
        )}
        {onRateClick && (
          <button onClick={onRateClick} className="rate-btn">
            Rate This Event
          </button>
        )}
      </div>

      {ratings.length === 0 ? (
        <div className="no-ratings">
          <p>No ratings yet. Be the first to rate this event!</p>
        </div>
      ) : (
        <div className="ratings-container">
          {ratings.map((rating) => (
            <div key={rating._id} className="rating-item">
              <div className="rating-user-info">
                <div className="user-details">
                  <strong>{rating.user_id?.first_name} {rating.user_id?.last_name}</strong>
                  <span className="rating-date">{formatDate(rating.createdAt)}</span>
                </div>
                <RatingStars rating={rating.rating} readOnly size="small" />
              </div>
              {rating.review && (
                <p className="rating-review">{rating.review}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .ratings-list {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .ratings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .ratings-header h3 {
          margin: 0;
          color: #2c3e50;
        }

        .event-rating-summary {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .average-rating {
          font-size: 24px;
          font-weight: 700;
          color: #2c3e50;
        }

        .total-ratings {
          color: #7f8c8d;
          font-size: 14px;
        }

        .rate-btn {
          padding: 8px 16px;
          background-color: #3498db;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .rate-btn:hover {
          background-color: #2980b9;
        }

        .no-ratings {
          text-align: center;
          padding: 40px 20px;
          color: #7f8c8d;
        }

        .ratings-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .rating-item {
          padding: 16px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #3498db;
        }

        .rating-user-info {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
          gap: 12px;
        }

        .user-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .user-details strong {
          color: #2c3e50;
          font-size: 14px;
        }

        .rating-date {
          color: #95a5a6;
          font-size: 12px;
        }

        .rating-review {
          margin: 8px 0 0 0;
          color: #2c3e50;
          line-height: 1.6;
          font-size: 14px;
        }

        .loading {
          text-align: center;
          padding: 20px;
          color: #7f8c8d;
        }

        .error-message {
          background-color: #ffebee;
          color: #c62828;
          padding: 12px;
          border-radius: 6px;
        }

        @media (max-width: 768px) {
          .ratings-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .rating-user-info {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
