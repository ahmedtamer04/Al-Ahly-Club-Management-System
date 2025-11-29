'use client';

import { useState, useEffect } from 'react';
import { eventAPI, getUser } from '@/utils/api';

export default function CommentsList({ eventId, onCommentClick }) {
  const [comments, setComments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const currentUser = getUser();

  useEffect(() => {
    fetchComments();
  }, [eventId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await eventAPI.getComments(eventId);
      // Filter out deleted comments for non-admin users
      const visibleComments = currentUser?.role === 'Admin' || currentUser?.role === 'EventsOffice'
        ? data.comments
        : data.comments.filter(c => c.status === 'visible');
      
      setComments(visibleComments || []);
      setStats({
        total: data.totalComments || 0,
        active: data.activeComments || 0,
        deleted: data.deletedComments || 0
      });
    } catch (err) {
      setError(err.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isMyComment = (comment) => {
    return comment.author_id?._id === currentUser?._id;
  };

  if (loading) {
    return <div className="loading">Loading comments...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="comments-list">
      <div className="comments-header">
        <h3>Comments</h3>
        <div className="comments-stats">
          <span>{stats.active} {stats.active === 1 ? 'comment' : 'comments'}</span>
          {stats.deleted > 0 && currentUser?.role === 'Admin' && (
            <span className="deleted-count">({stats.deleted} deleted)</span>
          )}
        </div>
        {onCommentClick && (
          <button onClick={onCommentClick} className="comment-btn">
            Add Comment
          </button>
        )}
      </div>

      {comments.length === 0 ? (
        <div className="no-comments">
          <p>No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="comments-container">
          {comments.map((comment) => (
            <div 
              key={comment._id} 
              className={`comment-item ${comment.status === 'deleted' ? 'deleted' : ''} ${isMyComment(comment) ? 'my-comment' : ''}`}
            >
              <div className="comment-header-info">
                <div className="author-details">
                  <strong>{comment.author_id?.first_name} {comment.author_id?.last_name}</strong>
                  {isMyComment(comment) && <span className="author-badge">You</span>}
                  <span className="comment-date">{formatDate(comment.createdAt)}</span>
                </div>
                {comment.status === 'deleted' && (
                  <span className="deleted-badge">Deleted</span>
                )}
              </div>
              
              <p className="comment-body">{comment.body}</p>
              
              {comment.status === 'deleted' && comment.deleted_by && (
                <div className="deletion-info">
                  <small>
                    Deleted by {comment.deleted_by.first_name} {comment.deleted_by.last_name}
                  </small>
                </div>
              )}
              
              {comment.createdAt !== comment.updatedAt && comment.status !== 'deleted' && (
                <div className="edited-info">
                  <small>Edited {formatDate(comment.updatedAt)}</small>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .comments-list {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .comments-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .comments-header h3 {
          margin: 0;
          color: #2c3e50;
        }

        .comments-stats {
          display: flex;
          gap: 8px;
          color: #7f8c8d;
          font-size: 14px;
        }

        .deleted-count {
          color: #e74c3c;
        }

        .comment-btn {
          padding: 8px 16px;
          background-color: #3498db;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .comment-btn:hover {
          background-color: #2980b9;
        }

        .no-comments {
          text-align: center;
          padding: 40px 20px;
          color: #7f8c8d;
        }

        .comments-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .comment-item {
          padding: 16px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #3498db;
        }

        .comment-item.my-comment {
          border-left-color: #27ae60;
          background-color: #e8f8f5;
        }

        .comment-item.deleted {
          opacity: 0.6;
          border-left-color: #e74c3c;
          background-color: #ffebee;
        }

        .comment-header-info {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          gap: 12px;
        }

        .author-details {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }

        .author-details strong {
          color: #2c3e50;
          font-size: 14px;
        }

        .author-badge {
          background-color: #27ae60;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .deleted-badge {
          background-color: #e74c3c;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .comment-date {
          color: #95a5a6;
          font-size: 12px;
        }

        .comment-body {
          margin: 0;
          color: #2c3e50;
          line-height: 1.6;
          font-size: 14px;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .deletion-info,
        .edited-info {
          margin-top: 8px;
          color: #95a5a6;
          font-size: 12px;
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
          .comments-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .author-details {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
        }
      `}</style>
    </div>
  );
}
