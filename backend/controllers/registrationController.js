import Registration from "../models/Registration.js";
import ExcelJS from 'exceljs';
import Event from "../models/Events.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { promoteNextInWaitlist } from "./waitlistController.js";

// Register for a workshop or trip
export const registerForEvent = async (req, res) => {
  try {
    console.log('Registration request body:', req.body);
    console.log('User from auth middleware:', req.user);
    
    const { event_id, name, email, personalId, role } = req.body;
    const user_id = req.user._id;
    
    console.log('Extracted fields:', { event_id, name, email, personalId, role, user_id });
    
    if (!event_id || !name || !email || !personalId || !role) {
      console.log('Missing required fields:', { event_id: !!event_id, name: !!name, email: !!email, personalId: !!personalId, role: !!role });
      return res.status(400).json({ message: "All fields are required." });
    }
    
    // Normalize and validate role (match the Registration model enum)
    let normalizedRole;
    const roleLower = role ? role.toString().toLowerCase() : '';
    
    switch(roleLower) {
      case 'student':
        normalizedRole = 'student';
        break;
      case 'staff':
        normalizedRole = 'staff';
        break;
      case 'ta':
        normalizedRole = 'TA';  // Use uppercase as per model
        break;
      case 'professor':
        normalizedRole = 'professor';
        break;
      default:
        console.log('Invalid role provided:', role);
        return res.status(400).json({ message: `Invalid role: "${role}". Valid roles are: student, staff, TA, professor` });
    }
    
    console.log('Role validation:', { originalRole: role, normalizedRole });

    console.log('Looking up event with ID:', event_id);
    const event = await Event.findById(event_id);
    
    if (!event) {
      console.log('Event not found for ID:', event_id);
      return res.status(404).json({ message: "Event not found." });
    }

    console.log('Found event:', { id: event._id, name: event.name, type: event.type });

    // CHECK: Prevent registration for workshops that are not accepted
    if (event.type === 'Workshop') {
      const approvalStatus = event.workshop?.approval_status || 'pending';
      if (approvalStatus !== 'accepted') {
        console.log('Workshop not accepted - Status:', approvalStatus);
        return res.status(403).json({ 
          message: "This workshop is not available for registration.", 
          approval_status: approvalStatus 
        });
      }
    }

    // CHECK: Verify user role is allowed for this event
    const userRole = req.user?.role;
    if (event.allowed_roles && event.allowed_roles.length > 0) {
      if (!event.allowed_roles.includes(userRole)) {
        return res.status(403).json({ 
          message: "You do not have permission to register for this event.",
          allowed_roles: event.allowed_roles
        });
      }
    }

    // CHECK: Allow registration for all event types (removing restriction)
    console.log('Event type check - Type:', event.type);

    if (!event.registration_open) {
      return res.status(400).json({ message: "Registration is closed for this event." });
    }

    // Calculate real available spots
    if (event.type === 'Workshop' || event.type === 'Trip') {
      const availableSpots = await event.calculateAvailableSpots();
      
      if (availableSpots <= 0) {
        // Only students can join waitlist - others get rejected immediately
        const userRole = req.user?.role?.toLowerCase();
        if (userRole !== 'student') {
          return res.status(400).json({ 
            message: "Event is full. Registration is not available for non-students when capacity is reached." 
          });
        }
        // For students, still reject direct registration (they should use waitlist endpoint)
        return res.status(400).json({ message: "Event is full. Please join the waitlist." });
      }
    }

    // Check if user already has a registration for this event
    const existingRegistration = await Registration.findOne({
      user_id,
      event_id
    });

    if (existingRegistration) {
      // If existing registration is pending (unpaid) or canceled, delete it and allow re-registration
      if (existingRegistration.payment_status === 'pending' || existingRegistration.status === 'canceled') {
        console.log(`Found ${existingRegistration.status || existingRegistration.payment_status} registration, deleting it to allow re-registration`);
        await Registration.findByIdAndDelete(existingRegistration._id);
      } else {
        // If already paid or free, they're truly registered
        return res.status(409).json({ 
          message: "You are already registered for this event.",
          payment_status: existingRegistration.payment_status
        });
      }
    }

    // Determine if event requires payment
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
      event_id,
      user_id,
      name,
      email,
      personalId,
      role: normalizedRole,
      payment_status: requiresPayment ? 'pending' : 'free',
      payment_amount: eventPrice
    });
    
    console.log('Creating registration with data:', {
      event_id,
      user_id,
      name,
      email,
      personalId,
      role: normalizedRole
    });
    
    await registration.save();
    
    // No need to manually update available_spots - it's calculated dynamically
    // from the Registration database count
    
    const populatedRegistration = await Registration.findById(registration._id).populate('event_id');
    
    res.status(201).json({ 
      message: "Registration successful.", 
      registration: populatedRegistration
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      // This shouldn't happen anymore since we handle duplicates above,
      // but keeping as fallback
      return res.status(409).json({ 
        message: "You are already registered for this event. If you think this is an error, please contact support." 
      });
    }
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

// View registered events (upcoming & past)
export const viewRegisteredEvents = async (req, res) => {
  try {
    const user_id = req.params.user_id || req.user._id;
    
    console.log('ViewRegisteredEvents - user_id:', user_id);
    console.log('Params:', req.params);
    console.log('Auth user:', req.user._id);
    
    if (!user_id) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Get all active registrations (exclude pending payment and canceled ones)
    const registrations = await Registration.find({ 
      user_id,
      status: "registered",
      payment_status: { $in: ['paid', 'free'] }  // Only show completed registrations
    }).populate('event_id');
    
    console.log('Found registrations:', registrations.length);

    const validRegistrations = registrations.filter(reg => reg.event_id);

    const now = new Date();
    const upcoming = [];
    const past = [];
    const formattedRegistrations = [];

    validRegistrations.forEach(registration => {
      const event = registration.event_id;
      
      const registrationData = {
        _id: registration._id,
        registration_date: registration.createdAt,
        name: registration.name,
        email: registration.email,
        personalId: registration.personalId,
        status: registration.status,
        event: event  // Use 'event' instead of 'event_id' to match frontend expectations
      };
      
      formattedRegistrations.push(registrationData);
      
      if (event.end_date >= now) {
        upcoming.push(registrationData);
      } else {
        past.push(registrationData);
      }
    });

    console.log('Returning registrations:', formattedRegistrations.length);
    
    res.json({ 
      message: "Registered events retrieved successfully",
      registrations: formattedRegistrations,  // Add this for frontend compatibility
      upcoming, 
      past,
      total: validRegistrations.length
    });
    
  } catch (error) {
    console.error('Error in viewRegisteredEvents:', error);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

export const cancelRegistration = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { registrationId } = req.params;
    const user_id = req.user._id;

    console.log('Cancel registration request:', { registrationId, user_id });

    const registration = await Registration.findOne({
      _id: registrationId,
      user_id
    }).populate('event_id').session(session);

    console.log('Found registration:', registration);

    if (!registration) {
      console.log('Registration not found for cancellation');
      await session.abortTransaction();
      return res.status(404).json({ message: "Registration not found." });
    }

    // Check if already canceled
    if (registration.status === 'canceled') {
      await session.abortTransaction();
      return res.status(400).json({ message: "Registration is already canceled." });
    }

    const event = registration.event_id;
    if (!event) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Event not found." });
    }

    // Check if event has already started
    if (event.start_date <= new Date()) {
      console.log('Event has already started, cannot cancel');
      await session.abortTransaction();
      return res.status(400).json({ 
        message: "Cannot cancel registration for events that have already started." 
      });
    }

    // Check if event is at least 2 weeks away
    const twoWeeksInMs = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds
    const timeUntilEvent = new Date(event.start_date) - new Date();
    
    if (timeUntilEvent < twoWeeksInMs) {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: "Cancellation is only allowed if there are at least 2 weeks before the event." 
      });
    }

    // Process refund if payment was made
    let refundProcessed = false;
    let refundAmount = 0;

    if (registration.payment_status === 'paid' && registration.payment_amount > 0) {
      const user = await User.findById(user_id).session(session);

      if (!user) {
        await session.abortTransaction();
        return res.status(404).json({ message: "User not found." });
      }

      // Refund to wallet
      refundAmount = registration.payment_amount;
      
      // Update user's wallet balance
      user.wallet.balance += refundAmount;
      
      // Add refund transaction to wallet history
      user.wallet.transactions.push({
        type: 'refund',
        amount: refundAmount,
        description: `Refund for canceled registration: ${event.name}`,
        reference: registration._id.toString(),
        payment_method: registration.payment_method || 'wallet',
        timestamp: new Date()
      });

      await user.save({ session });
      refundProcessed = true;

      console.log(`Refunded ${refundAmount} to user's wallet. New balance: ${user.wallet.balance}`);
    }

    // Update registration status to canceled and set payment status to refunded if applicable
    registration.status = 'canceled';
    if (refundProcessed) {
      registration.payment_status = 'refunded';
    }
    await registration.save({ session });

    // No need to manually update available_spots - it's calculated dynamically
    // Try to promote next person from waitlist
    if (event.type === 'Workshop' || event.type === 'Trip') {
      try {
        await promoteNextInWaitlist(event._id, session);
        console.log('Auto-promotion attempted for waitlist');
      } catch (waitlistError) {
        console.error('Error promoting from waitlist:', waitlistError);
        // Don't fail the cancellation if waitlist promotion fails
      }
    }

    await session.commitTransaction();
    console.log('Registration canceled successfully');
    
    const responseMessage = refundProcessed 
      ? `Registration canceled successfully. ${refundAmount} has been refunded to your wallet.`
      : "Registration canceled successfully.";

    res.json({ 
      message: responseMessage,
      refund: refundProcessed ? {
        amount: refundAmount,
        currency: 'USD'
      } : null
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error canceling registration:', error);
    res.status(500).json({ message: "Server error.", error: error.message });
  } finally {
    session.endSession();
  }
};

export const getEventRegistrations = async (req, res) => {
  try {
    const { event_id } = req.params;
    
    const event = await Event.findById(event_id);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Check permissions (only event creator or EventsOffice)
    if (req.user.role !== 'EventsOffice' && 
        event.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized." });
    }

    const registrations = await Registration.find({
      event_id,
      status: "registered"
    }).populate('user_id', 'first_name last_name email');

    res.json({
      message: "Event registrations retrieved successfully",
      event: {
        id: event._id,
        name: event.name,
        type: event.type,
        start_date: event.start_date
      },
      registrations,
      summary: {
        total_registered: registrations.length,
        available_spots: event.available_spots
      }
    });

  } catch (error) {
    console.error('Error fetching event registrations:', error);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

// Get registrations for events that belong to the requester, or all registrations for EventsOffice/Admin
export const getRegistrationsForMyEvents = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // EventsOffice and Admin should see all registrations
    if (user.role === 'EventsOffice' || user.role === 'Admin') {
      const registrations = await Registration.find().populate('user_id', 'first_name last_name email role id_number').populate('event_id', 'name type start_date end_date location');
      const totals = {
        all: registrations.length,
        registered: registrations.filter(r => r.status === 'registered').length,
        pending: registrations.filter(r => r.payment_status === 'pending').length,
        canceled: registrations.filter(r => r.status === 'canceled').length
      };

      return res.json({ message: 'Registrations retrieved', registrations, totals });
    }

    // Otherwise return registrations for events created by this user
    const myEvents = await Event.find({ created_by: user._id }).select('_id');
    const myEventIds = myEvents.map(e => e._id);

    const registrations = await Registration.find({ event_id: { $in: myEventIds } }).populate('user_id', 'first_name last_name email role id_number').populate('event_id', 'name type start_date end_date location');

    const totals = {
      all: registrations.length,
      registered: registrations.filter(r => r.status === 'registered').length,
      pending: registrations.filter(r => r.payment_status === 'pending').length,
      canceled: registrations.filter(r => r.status === 'canceled').length
    };

    return res.json({ message: 'Registrations retrieved for your events', registrations, totals });
  } catch (err) {
    console.error('Error in getRegistrationsForMyEvents:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all registrations from database (Admin only - should be added to admin routes)
export const getAllRegistrations = async (req, res) => {
  try {
    console.log('Fetching all registrations from database...');
    
    // Fetch all registrations and populate user and event details
    const registrations = await Registration.find()
      .populate('user_id', 'first_name last_name email role id_number')
      .populate('event_id', 'name type location start_date end_date time capacity')
      .sort({ createdAt: -1 }); // Sort by newest first

    console.log(`Found ${registrations.length} total registrations in database`);

    // Calculate statistics
    const stats = {
      total: registrations.length,
      registered: registrations.filter(r => r.status === 'registered').length,
      canceled: registrations.filter(r => r.status === 'canceled').length
    };

    res.json({
      message: "All registrations retrieved successfully",
      registrations,
      stats,
      total: registrations.length
    });

  } catch (error) {
    console.error('Error fetching all registrations:', error);
    res.status(500).json({ 
      message: "Server error while fetching registrations.", 
      error: error.message 
    });
  }
};

// Export registrations for a specific event as an .xlsx file
export const exportEventRegistrationsXlsx = async (req, res) => {
  try {
    const { event_id } = req.params;

    const event = await Event.findById(event_id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Conferences should not be exported
    if (event.type === 'Conference') {
      return res.status(400).json({ message: 'Export not allowed for conference events' });
    }

    // Only EventsOffice or Admin or the event creator can export
    if (req.user.role !== 'EventsOffice' && req.user.role !== 'Admin' && event.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to export registrations for this event' });
    }

    const registrations = await Registration.find({ event_id, status: 'registered' }).populate('user_id', 'first_name last_name email');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendees');

    worksheet.columns = [
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Personal ID', key: 'personalId', width: 20 },
      { header: 'Role', key: 'role', width: 12 },
      { header: 'Payment Status', key: 'payment_status', width: 12 },
      { header: 'Registered At', key: 'registeredAt', width: 22 }
    ];

    // Add rows
    registrations.forEach(reg => {
      const name = reg.user_id ? `${reg.user_id.first_name || ''} ${reg.user_id.last_name || ''}`.trim() : reg.name;
      worksheet.addRow({
        name,
        email: reg.email,
        personalId: reg.personalId,
        role: reg.role,
        payment_status: reg.payment_status,
        registeredAt: reg.createdAt ? new Date(reg.createdAt).toLocaleString() : ''
      });
    });

    // Format header
    worksheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_attendees.xlsx"`);
    return res.send(buffer);
  } catch (err) {
    console.error('Error exporting registrations:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Cancel unpaid registration (when user closes payment modal)
export const cancelUnpaidRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const user_id = req.user._id;

    console.log('Cancel unpaid registration:', { registrationId, user_id });

    const registration = await Registration.findOne({
      _id: registrationId,
      user_id,
      payment_status: 'pending'
    });

    if (!registration) {
      console.log('Pending registration not found');
      return res.status(404).json({ message: "Registration not found or already processed." });
    }

    // Delete the pending registration
    await Registration.findByIdAndDelete(registrationId);

    console.log('Unpaid registration deleted successfully');
    res.json({ message: "Unpaid registration canceled successfully." });

  } catch (error) {
    console.error('Error canceling unpaid registration:', error);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};
