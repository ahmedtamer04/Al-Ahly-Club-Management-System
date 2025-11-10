import Notification from "../models/Notification.js";
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getUnreadCount 
} from "../services/notificationService.js";

/**
 * Get all notifications for the logged-in user
 * GET /api/notifications
 */
export const getNotifications = async (req, res) => {
  try {
    const { unread_only } = req.query;
    const unreadOnly = unread_only === 'true';

    const notifications = await getUserNotifications(req.user._id, unreadOnly);

    res.json({
      message: "Notifications retrieved successfully",
      notifications,
      total: notifications.length
    });

  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
export const getUnreadNotificationCount = async (req, res) => {
  try {
    const count = await getUnreadCount(req.user._id);

    res.json({
      message: "Unread count retrieved successfully",
      unread_count: count
    });

  } catch (err) {
    console.error('Error fetching unread count:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Mark a specific notification as read
 * PATCH /api/notifications/:id/read
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      user_id: req.user._id  // Ensure user can only mark their own notifications
    });

    if (!notification) {
      return res.status(404).json({ 
        message: "Notification not found" 
      });
    }

    const updatedNotification = await markNotificationAsRead(id);

    res.json({
      message: "Notification marked as read",
      notification: updatedNotification
    });

  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Mark all notifications as read for the logged-in user
 * PATCH /api/notifications/mark-all-read
 */
export const markAllAsRead = async (req, res) => {
  try {
    const result = await markAllNotificationsAsRead(req.user._id);

    res.json({
      message: "All notifications marked as read",
      modified_count: result.modifiedCount
    });

  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      user_id: req.user._id  // Ensure user can only delete their own notifications
    });

    if (!notification) {
      return res.status(404).json({ 
        message: "Notification not found" 
      });
    }

    await Notification.findByIdAndDelete(id);

    res.json({
      message: "Notification deleted successfully"
    });

  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ message: err.message });
  }
};
