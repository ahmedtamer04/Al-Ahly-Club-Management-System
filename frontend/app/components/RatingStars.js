'use client';

import { useState } from 'react';

export default function RatingStars({ 
  rating, 
  onRatingChange, 
  readOnly = false, 
  size = 'medium' 
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (value) => {
    if (!readOnly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value) => {
    if (!readOnly) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating || 0;

  const sizeClasses = {
    small: '16px',
    medium: '24px',
    large: '32px'
  };

  const fontSize = sizeClasses[size] || sizeClasses.medium;

  return (
    <div className="rating-stars">
      {[1, 2, 3, 4, 5].map((value) => (
        <span
          key={value}
          className={`star ${value <= displayRating ? 'filled' : 'empty'} ${!readOnly ? 'interactive' : ''}`}
          onClick={() => handleClick(value)}
          onMouseEnter={() => handleMouseEnter(value)}
          onMouseLeave={handleMouseLeave}
          style={{ fontSize }}
        >
          {value <= displayRating ? '★' : '☆'}
        </span>
      ))}
      
      <style jsx>{`
        .rating-stars {
          display: inline-flex;
          gap: 4px;
          align-items: center;
        }

        .star {
          cursor: ${readOnly ? 'default' : 'pointer'};
          transition: all 0.2s ease;
          user-select: none;
        }

        .star.filled {
          color: #ffc107;
        }

        .star.empty {
          color: #ddd;
        }

        .star.interactive:hover {
          transform: scale(1.2);
        }

        .star.interactive:active {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}
