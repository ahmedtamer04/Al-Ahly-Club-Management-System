"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { notificationAPI } from '@/utils/api';
import './NotificationBell.css';

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ MODIFY THIS useEffect - Fetch unread count on mount and periodically
  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    // ✅ ADD THIS: Fetch again after 2 seconds to catch manual trigger notifications
    const delayedFetch = setTimeout(() => {
      fetchUnreadCount();
    }, 2000);
    
    // ✅ UPDATE CLEANUP to include delayedFetch
    return () => {
      clearInterval(interval);
      clearTimeout(delayedFetch);
    };
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchUnreadCount = async () => {
    try {
      const data = await notificationAPI.getUnreadCount();
      setUnreadCount(data.unread_count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationAPI.getNotifications(false);
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if not already
    if (!notification.is_read) {
      try {
        await notificationAPI.markAsRead(notification._id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n._id === notification._id ? { ...n, is_read: true } : n
          )
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate to link if provided
    if (notification.link) {
      setIsOpen(false);
      router.push(notification.link);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'workshop_submitted': return '📝';
      case 'workshop_accepted': return '✅';
      case 'workshop_rejected': return '❌';
      case 'workshop_revision_requested': return '✏️';
      case 'event_added': return '🎉';
      case 'event_reminder_1day': return '⏰';
      case 'event_reminder_1hour': return '🚨';
      default: return '🔔';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="notification-bell-container">
      <button 
        className="notification-bell-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="notification-overlay" 
            onClick={() => setIsOpen(false)}
          />
          <div className="notification-dropdown">
            <div className="notification-header">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllAsRead}
                  className="mark-all-read-btn"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="notification-list">
              {loading ? (
                <div className="notification-loading">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="notification-empty">No notifications</div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification._id}
                    className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                      <p className="notification-message">{notification.message}</p>
                      {notification.metadata?.requested_edits && (
                        <p className="notification-detail">
                          <strong>Requested edits:</strong> {notification.metadata.requested_edits}
                        </p>
                      )}
                      {notification.metadata?.rejection_reason && (
                        <p className="notification-detail">
                          <strong>Reason:</strong> {notification.metadata.rejection_reason}
                        </p>
                      )}
                      <span className="notification-time">{formatTime(notification.createdAt)}</span>
                    </div>
                    {!notification.is_read && (
                      <div className="unread-indicator"></div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
