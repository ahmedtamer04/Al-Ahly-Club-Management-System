import Registration from "../models/Registration.js";
import Event from "../models/Events.js";
import mongoose from "mongoose";

// Register for a workshop or trip
export const registerForEvent = async (req, res) => {
  try {
    const { event_id, name, email, personalId, role } = req.body;
    const user_id = req.user._id;
    
    if (!event_id || !name || !email || !personalId || !role) {
      return res.status(400).json({ message: "All fields are required." });
    }
    
    // Normalize role for validation (accept 'Staff' or 'staff', 'TA' or 'ta')
    const roleLower = role ? role.toString().toLowerCase() : '';
    if (!["student", "staff", "ta", "professor"].includes(roleLower)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    const event = await Event.findById(event_id);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // CHECK: Only Workshop and Trip can be registered
    if (event.type !== 'Workshop' && event.type !== 'Trip') {
      return res.status(400).json({ 
        message: "Only Workshops and Trips are available for registration." 
      });
    }

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
      role
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
    const user_id = req.user._id;
    
    if (!user_id) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const registrations = await Registration.find({ 
      user_id, 
      status: "registered" 
    }).populate('event_id');

    const validRegistrations = registrations.filter(reg => reg.event_id);

    const now = new Date();
    const upcoming = [];
    const past = [];

    validRegistrations.forEach(registration => {
      const event = registration.event_id;
      
      const registrationData = {
        _id: registration._id,
        registration_date: registration.createdAt,
        name: registration.name,
        email: registration.email,
        personalId: registration.personalId,
        status: registration.status,
        event_id: event
      };
      
      if (event.end_date >= now) {
        upcoming.push(registrationData);
      } else {
        past.push(registrationData);
      }
    });

    res.json({ 
      message: "Registered events retrieved successfully",
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
    const { event_id } = req.params;
    const user_id = req.user._id;

    const registration = await Registration.findOne({
      event_id,
      user_id,
      status: "registered"
    });

    if (!registration) {
      return res.status(404).json({ message: "Registration not found." });
    }

    // Check if event has started
    const event = await Event.findById(event_id);
    if (event && event.start_date <= new Date()) {
      return res.status(400).json({ 
        message: "Cannot cancel registration for events that have already started." 
      });
    }

    registration.status = "canceled";
    await registration.save();

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
