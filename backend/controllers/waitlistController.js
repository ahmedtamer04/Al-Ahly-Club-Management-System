import Waitlist from "../models/Waitlist.js";
import Event from "../models/Events.js";
import Registration from "../models/Registration.js";
import Notification from "../models/Notification.js";
import mongoose from "mongoose";

// Join waitlist for a full event
export const joinWaitlist = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { event_id } = req.body;
    const user_id = req.user._id;

    if (!event_id) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Event ID is required." });
    }

    // Only students can join waitlist
    if (req.user.role !== 'student' && req.user.role !== 'Student') {
      await session.abortTransaction();
      return res.status(403).json({ 
        message: "Waitlist is only available for students. This event is full." 
      });
    }

    // Check if event exists
    const event = await Event.findById(event_id).session(session);
    if (!event) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Event not found." });
    }

    // Check if registration is open
    if (!event.registration_open) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Registration is closed for this event." });
    }

    // Check if event is actually full by calculating real available spots
    const availableSpots = await event.calculateAvailableSpots();
    if (availableSpots > 0) {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: "Event still has available spots. Please register directly.",
        available_spots: availableSpots
      });
    }

    // Check if user is already registered
    const existingRegistration = await Registration.findOne({
      user_id,
      event_id,
      status: "registered",
      payment_status: { $in: ['paid', 'free'] }
    }).session(session);

    if (existingRegistration) {
      await session.abortTransaction();
      return res.status(409).json({ message: "You are already registered for this event." });
    }

    // Check if user is already on waitlist
    const existingWaitlist = await Waitlist.findOne({
      user: user_id,
      event: event_id,
      status: { $in: ['waiting', 'promoted'] }
    }).session(session);

    if (existingWaitlist) {
      await session.abortTransaction();
      return res.status(409).json({ 
        message: "You are already on the waitlist for this event.",
        position: existingWaitlist.position,
        status: existingWaitlist.status
      });
    }

    // Get the next position in waitlist
    const lastPosition = await Waitlist.findOne({
      event: event_id
    })
      .sort({ position: -1 })
      .select('position')
      .session(session);

    const nextPosition = lastPosition ? lastPosition.position + 1 : 1;

    // Create waitlist entry
    const waitlistEntry = new Waitlist({
      user: user_id,
      event: event_id,
      position: nextPosition,
      status: 'waiting'
    });

    await waitlistEntry.save({ session });

    // Create notification
    const eventDetails = await Event.findById(event_id).select('name type start_date').session(session);
    await Notification.create([{
      user_id,
      type: 'waitlist_joined',
      message: `You have joined the waitlist for ${eventDetails.name}. Your position: #${nextPosition}`,
      link: `/student/my-waitlist`,
      event_id,
      metadata: {
        event_name: eventDetails.name,
        event_type: eventDetails.type,
        waitlist_position: nextPosition
      }
    }], { session });

    await session.commitTransaction();

    res.status(201).json({
      message: "Successfully joined waitlist",
      waitlist: {
        id: waitlistEntry._id,
        position: nextPosition,
        status: 'waiting'
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error joining waitlist:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({ message: "You are already on the waitlist for this event." });
    }
    
    res.status(500).json({ message: "Server error.", error: error.message });
  } finally {
    session.endSession();
  }
};

// Get user's waitlist entries
export const getMyWaitlist = async (req, res) => {
  try {
    const user_id = req.user._id;

    const waitlistEntries = await Waitlist.find({
      user: user_id,
      status: { $in: ['waiting', 'promoted'] }
    })
      .populate('event', 'name type start_date location available_spots')
      .sort({ createdAt: -1 });

    // Calculate waitlist size for each event
    const enrichedEntries = await Promise.all(
      waitlistEntries.map(async (entry) => {
        const waitlistSize = await Waitlist.countDocuments({
          event: entry.event._id,
          status: { $in: ['waiting', 'promoted'] }
        });

        return {
          _id: entry._id,
          event: entry.event,
          position: entry.position,
          status: entry.status,
          promotedAt: entry.promotedAt,
          confirmationDeadline: entry.confirmationDeadline,
          createdAt: entry.createdAt,
          waitlistSize
        };
      })
    );

    res.json({
      message: "Waitlist entries retrieved successfully",
      waitlist: enrichedEntries
    });

  } catch (error) {
    console.error('Error fetching waitlist:', error);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

// Get waitlist for a specific event (with position info)
export const getEventWaitlist = async (req, res) => {
  try {
    const { eventId } = req.params;
    const user_id = req.user._id;

    // Get user's position if they're on the waitlist
    const userEntry = await Waitlist.findOne({
      user: user_id,
      event: eventId,
      status: { $in: ['waiting', 'promoted'] }
    });

    // Get total waitlist size
    const waitlistSize = await Waitlist.countDocuments({
      event: eventId,
      status: { $in: ['waiting', 'promoted'] }
    });

    res.json({
      message: "Waitlist info retrieved successfully",
      onWaitlist: !!userEntry,
      position: userEntry ? userEntry.position : null,
      status: userEntry ? userEntry.status : null,
      promotedAt: userEntry ? userEntry.promotedAt : null,
      confirmationDeadline: userEntry ? userEntry.confirmationDeadline : null,
      waitlistSize
    });

  } catch (error) {
    console.error('Error fetching event waitlist:', error);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

// Leave waitlist
export const leaveWaitlist = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { eventId } = req.params;
    const user_id = req.user._id;

    const waitlistEntry = await Waitlist.findOne({
      user: user_id,
      event: eventId,
      status: { $in: ['waiting', 'promoted'] }
    }).session(session);

    if (!waitlistEntry) {
      await session.abortTransaction();
      return res.status(404).json({ message: "You are not on the waitlist for this event." });
    }

    const removedPosition = waitlistEntry.position;

    // Update status to cancelled
    waitlistEntry.status = 'cancelled';
    await waitlistEntry.save({ session });

    // Reorder positions for everyone after this person
    await Waitlist.updateMany(
      {
        event: eventId,
        position: { $gt: removedPosition },
        status: { $in: ['waiting', 'promoted'] }
      },
      {
        $inc: { position: -1 }
      },
      { session }
    );

    // Notify users who moved up
    const movedUpUsers = await Waitlist.find({
      event: eventId,
      position: { $gte: removedPosition },
      status: { $in: ['waiting', 'promoted'] }
    }).session(session);

    const eventDetails = await Event.findById(eventId).select('name').session(session);

    for (const entry of movedUpUsers) {
      await Notification.create([{
        user_id: entry.user,
        type: 'waitlist_moved_up',
        message: `You moved up in the waitlist for ${eventDetails.name}. Your new position: #${entry.position}`,
        link: `/student/my-waitlist`,
        event_id: eventId,
        metadata: {
          event_name: eventDetails.name,
          new_position: entry.position
        }
      }], { session });
    }

    await session.commitTransaction();

    res.json({ message: "Successfully left waitlist" });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error leaving waitlist:', error);
    res.status(500).json({ message: "Server error.", error: error.message });
  } finally {
    session.endSession();
  }
};

// Confirm promotion (user accepts their promoted spot)
export const confirmPromotion = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const user_id = req.user._id;

    const waitlistEntry = await Waitlist.findOne({
      _id: id,
      user: user_id,
      status: 'promoted'
    }).session(session);

    if (!waitlistEntry) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Promotion not found or already processed." });
    }

    // Check if deadline has passed
    if (new Date() > waitlistEntry.confirmationDeadline) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Confirmation deadline has passed." });
    }

    // Update waitlist status
    waitlistEntry.status = 'confirmed';
    await waitlistEntry.save({ session });

    // Get user details
    const user = await mongoose.model('User').findById(user_id).session(session);
    const event = await Event.findById(waitlistEntry.event).session(session);

    // Create registration (same logic as regular registration)
    let requiresPayment = false;
    let eventPrice = 0;

    if (event.type === 'Workshop' && event.workshop?.price) {
      requiresPayment = event.workshop.price > 0;
      eventPrice = event.workshop.price;
    } else if (event.type === 'Trip' && event.trip?.price) {
      requiresPayment = event.trip.price > 0;
      eventPrice = event.trip.price;
    }

    const registration = new Registration({
      event_id: waitlistEntry.event,
      user_id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      personalId: user.id_number,
      role: user.role,
      payment_status: requiresPayment ? 'pending' : 'free',
      payment_amount: eventPrice
    });

    await registration.save({ session });

    // Create confirmation notification
    await Notification.create([{
      user_id,
      type: 'waitlist_confirmed',
      message: `You confirmed your spot for ${event.name}. ${requiresPayment ? 'Please complete payment within 24 hours.' : 'You are now registered!'}`,
      link: requiresPayment ? `/student/payment-history` : `/student/my-registrations`,
      event_id: waitlistEntry.event,
      registration_id: registration._id,
      metadata: {
        event_name: event.name,
        requires_payment: requiresPayment,
        payment_amount: eventPrice
      }
    }], { session });

    await session.commitTransaction();

    res.json({
      message: "Successfully confirmed your spot",
      registration: {
        id: registration._id,
        requiresPayment,
        paymentAmount: eventPrice
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error confirming promotion:', error);
    res.status(500).json({ message: "Server error.", error: error.message });
  } finally {
    session.endSession();
  }
};

// Auto-promote next person in waitlist (called when registration is cancelled)
export const promoteNextInWaitlist = async (eventId, session) => {
  try {
    // Find the next person in line
    const nextInLine = await Waitlist.findOne({
      event: eventId,
      status: 'waiting'
    })
      .sort({ position: 1 })
      .session(session);

    if (!nextInLine) {
      console.log('No one waiting in the waitlist for this event');
      return null;
    }

    // Set promotion deadline (24 hours from now)
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + 24);

    // Update waitlist entry
    nextInLine.status = 'promoted';
    nextInLine.promotedAt = new Date();
    nextInLine.confirmationDeadline = deadline;
    await nextInLine.save({ session });

    // Get event details
    const event = await Event.findById(eventId).select('name type').session(session);

    // Create notification
    await Notification.create([{
      user_id: nextInLine.user,
      type: 'waitlist_promoted',
      message: `Great news! A spot opened for ${event.name}. Confirm within 24 hours to secure your registration.`,
      link: `/student/my-waitlist`,
      event_id: eventId,
      metadata: {
        event_name: event.name,
        event_type: event.type,
        confirmation_deadline: deadline,
        waitlist_id: nextInLine._id
      }
    }], { session });

    console.log(`Promoted user ${nextInLine.user} from waitlist for event ${eventId}`);
    return nextInLine;

  } catch (error) {
    console.error('Error promoting from waitlist:', error);
    throw error;
  }
};
