import Event from "../models/Events.js";
import Registration from "../models/Registration.js";
import Notification from "../models/Notification.js";

// Send message to all registered participants of an event
export const messageParticipants = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { message } = req.body;
    const senderId = req.user._id;
    const senderRole = req.user.role;

    // Validate message
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: "Message content is required." });
    }

    if (message.length > 500) {
      return res.status(400).json({ message: "Message is too long. Maximum 500 characters." });
    }

    // Get event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Authorization check: Only event creator, Admin, or EventsOffice can send messages
    const isCreator = event.created_by.toString() === senderId.toString();
    const isAuthorized = isCreator || senderRole === 'Admin' || senderRole === 'EventsOffice';

    if (!isAuthorized) {
      return res.status(403).json({ 
        message: "You are not authorized to send messages for this event." 
      });
    }

    // Get all registered participants (paid or free, status: registered)
    const registrations = await Registration.find({
      event_id: eventId,
      status: 'registered',
      payment_status: { $in: ['paid', 'free'] }
    }).select('user_id');

    if (registrations.length === 0) {
      return res.status(400).json({ 
        message: "No registered participants found for this event." 
      });
    }

    // Get unique user IDs
    const participantIds = [...new Set(registrations.map(reg => reg.user_id.toString()))];

    // Create notifications for all participants
    const notifications = participantIds.map(userId => ({
      user_id: userId,
      type: 'event_message',
      message: `Message from organizer about ${event.name}: ${message}`,
      link: `/student/events/${eventId}`,
      event_id: eventId,
      metadata: {
        event_name: event.name,
        event_type: event.type,
        organizer_message: message,
        sender_name: `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim()
      }
    }));

    await Notification.insertMany(notifications);

    console.log(`Sent message to ${participantIds.length} participants for event ${eventId}`);

    res.json({
      message: "Message sent successfully to all registered participants.",
      recipients: participantIds.length,
      event: {
        id: event._id,
        name: event.name,
        type: event.type
      }
    });

  } catch (error) {
    console.error('Error sending message to participants:', error);
    res.status(500).json({ 
      message: "Server error.", 
      error: error.message 
    });
  }
};
