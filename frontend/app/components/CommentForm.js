'use client';

import { useState, useEffect } from 'react';
import { eventAPI, getUser } from '@/utils/api';

export default function CommentForm({ eventId, onSuccess, onCancel }) {
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [existingComment, setExistingComment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExistingComment();
  }, [eventId]);

  const fetchExistingComment = async () => {
    try {
      const data = await eventAPI.getMyComment(eventId);
      if (data.comment) {
        setExistingComment(data.comment);
        setBody(data.comment.body);
      }
    } catch (err) {
      // No existing comment, that's fine
      console.log('No existing comment');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!body.trim()) {
      setError('Please enter a comment');
      return;
    }

    if (body.length > 1000) {
      setError('Comment cannot exceed 1000 characters');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (existingComment) {
        await eventAPI.updateComment(eventId, existingComment._id, { body });
      } else {
        await eventAPI.createComment(eventId, { body });
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your comment?')) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await eventAPI.deleteComment(eventId, existingComment._id);
      setBody('');
      setExistingComment(null);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="comment-form">
      <h3>{existingComment ? 'Edit Your Comment' : 'Add a Comment'}</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="comment-body">Your Comment *</label>
          <textarea
            id="comment-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your thoughts about this event..."
            maxLength={1000}
            rows={5}
            required
          />
          <div className="char-count">{body.length}/1000</div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          <button 
            type="submit" 
            disabled={submitting || !body.trim()}
            className="submit-btn"
          >
            {submitting ? 'Submitting...' : existingComment ? 'Update Comment' : 'Post Comment'}
          </button>
          
          {existingComment && (
            <button 
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="delete-btn"
            >
              Delete Comment
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
        .comment-form {
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
