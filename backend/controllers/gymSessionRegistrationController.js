import GymSession from "../models/gymSession.js";
import GymSessionRegistration from "../models/GymSessionRegistration.js";
import User from "../models/User.js";

// Register for a gym session
export const registerForGymSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Check if session exists
    const session = await GymSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Gym session not found" });
    }

    if (session.status === 'cancelled') {
      return res.status(400).json({ 
        message: "Cannot register for a cancelled gym session" 
      });
    }

    // Check if session date is in the past
    const sessionDate = new Date(session.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (sessionDate < today) {
      return res.status(400).json({ 
        message: "Cannot register for past gym sessions" 
      });
    }

    // Check if user already registered
    const existingRegistration = await GymSessionRegistration.findOne({
      gym_session_id: sessionId,
      user_id: req.user._id,
      status: 'registered'
    });

    if (existingRegistration) {
      return res.status(409).json({ 
        message: "You are already registered for this gym session" 
      });
    }

    // Check capacity
    const currentRegistrations = await GymSessionRegistration.countDocuments({
      gym_session_id: sessionId,
      status: 'registered'
    });

    if (currentRegistrations >= session.maxParticipants) {
      return res.status(400).json({ 
        message: "This gym session is full" 
      });
    }

    // Get user info
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create registration
    const registration = new GymSessionRegistration({
      gym_session_id: sessionId,
      user_id: req.user._id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      status: 'registered'
    });

    await registration.save();
    await registration.populate('gym_session_id', 'date time duration type maxParticipants status');

    res.status(201).json({
      message: "Successfully registered for gym session",
      registration: {
        _id: registration._id,
        session: {
          _id: registration.gym_session_id._id,
          date: registration.gym_session_id.date,
          time: registration.gym_session_id.time,
          duration: registration.gym_session_id.duration,
          type: registration.gym_session_id.type
        },
        name: registration.name,
        email: registration.email,
        status: registration.status,
        registered_at: registration.createdAt
      }
    });
  } catch (error) {
    console.error('Error registering for gym session:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: "You are already registered for this gym session" 
      });
    }
    
    res.status(500).json({ 
      message: "Failed to register for session",
      error: error.message,
      details: error.name
    });
  }
};

// Get user's gym session registrations
export const getMyGymSessionRegistrations = async (req, res) => {
  try {
    const registrations = await GymSessionRegistration.find({
      user_id: req.user._id,
      status: 'registered'
    })
    .populate('gym_session_id', 'date time duration type maxParticipants status')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Gym session registrations retrieved successfully",
      count: registrations.length,
      registrations: registrations.map(reg => ({
        _id: reg._id,
        session: {
          _id: reg.gym_session_id._id,
          date: reg.gym_session_id.date,
          time: reg.gym_session_id.time,
          duration: reg.gym_session_id.duration,
          type: reg.gym_session_id.type,
          maxParticipants: reg.gym_session_id.maxParticipants,
          status: reg.gym_session_id.status
        },
        name: reg.name,
        email: reg.email,
        status: reg.status,
        registered_at: reg.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching gym session registrations:', error);
    res.status(500).json({ message: error.message });
  }
};

// Cancel gym session registration
export const cancelGymSessionRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await GymSessionRegistration.findOne({
      _id: registrationId,
      user_id: req.user._id,
      status: 'registered'
    });

    if (!registration) {
      return res.status(404).json({ 
        message: "Registration not found or already cancelled" 
      });
    }

    registration.status = 'cancelled';
    registration.cancelled_at = new Date();
    await registration.save();

    res.json({
      message: "Gym session registration cancelled successfully",
      registration: {
        _id: registration._id,
        status: registration.status,
        cancelled_at: registration.cancelled_at
      }
    });
  } catch (error) {
    console.error('Error cancelling gym session registration:', error);
    res.status(500).json({ message: error.message });
  }
};

