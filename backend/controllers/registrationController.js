import Registration from "../models/Registration.js";
import Event from "../models/Events.js";
import mongoose from "mongoose";

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

    // CHECK: Allow registration for all event types (removing restriction)
    console.log('Event type check - Type:', event.type);

    if (!event.registration_open) {
      return res.status(400).json({ message: "Registration is closed for this event." });
    }

    if ((event.type === 'Workshop' || event.type === 'Trip') && event.available_spots <= 0) {
      return res.status(400).json({ message: "Event is full." });
    }

    const registration = new Registration({
      event_id,
      user_id,
      name,
      email,
      personalId,
      role: normalizedRole  // Use the normalized role
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
    
    const populatedRegistration = await Registration.findById(registration._id).populate('event_id');
    
    res.status(201).json({ 
      message: "Registration successful.", 
      registration: populatedRegistration
    });
    
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "You are already registered for this event." });
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

    // Get all registrations (including cancelled ones)
    const registrations = await Registration.find({ 
      user_id
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
  try {
    const { registrationId } = req.params;
    const user_id = req.user._id;

    console.log('Cancel registration request:', { registrationId, user_id });

    const registration = await Registration.findOne({
      _id: registrationId,
      user_id,
      status: "registered"
    });

    console.log('Found registration:', registration);

    if (!registration) {
      console.log('Registration not found for cancellation');
      return res.status(404).json({ message: "Registration not found." });
    }

    // Check if event has started (get event from registration)
    const event = await Event.findById(registration.event_id);
    if (event && event.start_date <= new Date()) {
      console.log('Event has already started, cannot cancel');
      return res.status(400).json({ 
        message: "Cannot cancel registration for events that have already started." 
      });
    }

    console.log('Cancelling registration');
    registration.status = "canceled";
    await registration.save();

    console.log('Registration cancelled successfully');
    res.json({ message: "Registration canceled successfully." });

  } catch (error) {
    console.error('Error canceling registration:', error);
    res.status(500).json({ message: "Server error.", error: error.message });
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
