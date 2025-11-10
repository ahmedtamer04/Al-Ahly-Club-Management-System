import Notification from "../models/Notification.js";
import User from "../models/User.js";

/**
 * Create a notification for a user
 * @param {ObjectId} userId - The user to notify
 * @param {String} type - Type of notification
 * @param {String} message - Notification message
 * @param {String} link - Optional link to navigate to
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Notification>}
 */
export const createNotification = async (userId, type, message, link = null, metadata = {}) => {
  try {
    const notification = await Notification.create({
      user_id: userId,
      type,
      message,
      link,
      metadata
    });
    
    console.log(`✅ Notification created for user ${userId}: ${type}`);
    return notification;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    throw error;
  }
};

/**
 * Notify EventsOffice users when a professor submits a workshop
 * @param {Object} workshop - The workshop event object
 * @param {Object} professor - The professor who created the workshop
 */
export const notifyEventsOfficeWorkshopSubmitted = async (workshop, professor) => {
  try {
    // Find all EventsOffice users
    const eventsOfficeUsers = await User.find({ 
      role: "EventsOffice", 
      status: "active" 
    });

    if (eventsOfficeUsers.length === 0) {
      console.log('⚠️ No EventsOffice users found to notify');
      return;
    }

    const professorName = `${professor.first_name} ${professor.last_name}`;
    const message = `New workshop submission: "${workshop.name}" by ${professorName}`;
    const link = `/eventsoffice/workshops/review/${workshop._id}`;

    // Create notification for each EventsOffice user
    const notifications = await Promise.all(
      eventsOfficeUsers.map(user => 
        createNotification(
          user._id,
          'workshop_submitted',
          message,
          link,
          {
            workshop_name: workshop.name,
            professor_name: professorName,
            workshop_id: workshop._id
          }
        )
      )
    );

    console.log(`✅ Notified ${notifications.length} EventsOffice users about new workshop submission`);
    return notifications;
  } catch (error) {
    console.error('❌ Error notifying EventsOffice users:', error);
    throw error;
  }
};

/**
 * Notify professor when their workshop is accepted
 * @param {Object} workshop - The workshop event object
 * @param {Object} reviewer - The EventsOffice/Admin who reviewed
 */
export const notifyProfessorWorkshopAccepted = async (workshop, reviewer) => {
  try {
    const reviewerName = `${reviewer.first_name} ${reviewer.last_name}`;
    const message = `Your workshop "${workshop.name}" has been accepted and published!`;
    const link = `/professor/workshops`;

    const notification = await createNotification(
      workshop.created_by,
      'workshop_accepted',
      message,
      link,
      {
        workshop_name: workshop.name,
        reviewed_by: reviewerName,
        workshop_id: workshop._id
      }
    );

    console.log(`✅ Notified professor about workshop acceptance`);
    return notification;
  } catch (error) {
    console.error('❌ Error notifying professor about acceptance:', error);
    throw error;
  }
};

/**
 * Notify professor when their workshop is rejected
 * @param {Object} workshop - The workshop event object
 * @param {Object} reviewer - The EventsOffice/Admin who reviewed
 * @param {String} rejectionReason - Reason for rejection
 */
export const notifyProfessorWorkshopRejected = async (workshop, reviewer, rejectionReason) => {
  try {
    const reviewerName = `${reviewer.first_name} ${reviewer.last_name}`;
    const message = `Your workshop "${workshop.name}" has been rejected`;
    const link = `/professor/workshops`;

    const notification = await createNotification(
      workshop.created_by,
      'workshop_rejected',
      message,
      link,
      {
        workshop_name: workshop.name,
        reviewed_by: reviewerName,
        rejection_reason: rejectionReason,
        workshop_id: workshop._id
      }
    );

    console.log(`✅ Notified professor about workshop rejection`);
    return notification;
  } catch (error) {
    console.error('❌ Error notifying professor about rejection:', error);
    throw error;
  }
};

/**
 * Notify professor when edits are requested for their workshop
 * @param {Object} workshop - The workshop event object
 * @param {Object} reviewer - The EventsOffice/Admin who reviewed
 * @param {String} requestedEdits - Edits that need to be made
 */
export const notifyProfessorEditsRequested = async (workshop, reviewer, requestedEdits) => {
  try {
    const reviewerName = `${reviewer.first_name} ${reviewer.last_name}`;
    const message = `Edits requested for your workshop "${workshop.name}"`;
    const link = `/professor/workshops`;

    const notification = await createNotification(
      workshop.created_by,
      'workshop_revision_requested',
      message,
      link,
      {
        workshop_name: workshop.name,
        reviewed_by: reviewerName,
        requested_edits: requestedEdits,
        workshop_id: workshop._id
      }
    );

    console.log(`✅ Notified professor about requested edits`);
    return notification;
  } catch (error) {
    console.error('❌ Error notifying professor about edits:', error);
    throw error;
  }
};

/**
 * Get all notifications for a user
 * @param {ObjectId} userId - The user ID
 * @param {Boolean} unreadOnly - Get only unread notifications
 * @returns {Promise<Array>}
 */
export const getUserNotifications = async (userId, unreadOnly = false) => {
  try {
    const query = { user_id: userId };
    if (unreadOnly) {
      query.is_read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 notifications

    return notifications;
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 * @param {ObjectId} notificationId - The notification ID
 * @returns {Promise<Notification>}
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { is_read: true },
      { new: true }
    );

    return notification;
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 * @param {ObjectId} userId - The user ID
 * @returns {Promise}
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { user_id: userId, is_read: false },
      { is_read: true }
    );

    console.log(`✅ Marked ${result.modifiedCount} notifications as read`);
    return result;
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Get unread notification count for a user
 * @param {ObjectId} userId - The user ID
 * @returns {Promise<Number>}
 */
export const getUnreadCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({
      user_id: userId,
      is_read: false
    });

    return count;
  } catch (error) {
    console.error('❌ Error getting unread count:', error);
    throw error;
  }
};

/**
 * Notify all active users when a new event is added
 * @param {Object} event - The newly created event object
 * @param {Array<String>} targetRoles - Roles to notify (default: all)
 */
export const notifyUsersNewEvent = async (event, targetRoles = ["Student", "Staff", "EventsOffice", "TA", "Professor"]) => {
  try {
    // Find all active users with target roles
    const users = await User.find({ 
      role: { $in: targetRoles },
      status: "active" 
    }).select('_id role');

    if (users.length === 0) {
      console.log('⚠️ No active users found to notify about new event');
      return;
    }

    const eventDate = new Date(event.start_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Create notifications for all users
    const notificationPromises = users.map(user => 
      createNotification(
        user._id,
        "event_added",
        `🎉 New ${event.type}: "${event.name}" has been added! Check it out.`,
        `/${user.role.toLowerCase()}/events/${event._id}`,
        {
          event_name: event.name,
          event_type: event.type,
          event_date: event.start_date,
          event_location: event.location
        }
      )
    );

    await Promise.all(notificationPromises);

    console.log(`✅ Notified ${users.length} users about new event: ${event.name}`);
  } catch (error) {
    console.error('❌ Error notifying users about new event:', error);
    // Don't throw - notifications shouldn't block event creation
  }
};
