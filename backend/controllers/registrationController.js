import Registration from "../models/Registration.js";

// Register for a workshop or trip

export const registerForEvent = async (req, res) => {
  try {
    const { event_id, user_id, name, email, personalId, role } = req.body;
    if (!event_id || !user_id || !name || !email || !personalId || !role) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (!["student", "staff", "TA", "professor"].includes(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }
    const registration = new Registration({
      event_id,
      user_id,
      name,
      email,
      personalId,
      role,
    });
    await registration.save();
    res.status(201).json({ message: "Registration successful.", registration });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "You are already registered for this event." });
    }
    res.status(500).json({ message: "Server error.", error });
  }
};

// View registered events (upcoming & past)
import Trip from "../models/Trip.js";
import GymSession from "../models/gymSession.js";
import Bazaar from "../models/Bazaar.js";

export const viewRegisteredEvents = async (req, res) => {
  try {
    const { user_id } = req.params;
    if (!user_id) {
      return res.status(400).json({ message: "User ID is required." });
    }
    // Find all registrations for the user
    const registrations = await Registration.find({ user_id, status: "registered" });
    // Separate event IDs by type
    const tripIds = registrations.filter(r => r.event_id && r.event_id.model === "Trip").map(r => r.event_id);
    const gymSessionIds = registrations.filter(r => r.event_id && r.event_id.model === "GymSession").map(r => r.event_id);
    const bazaarIds = registrations.filter(r => r.event_id && r.event_id.model === "Bazaar").map(r => r.event_id);

    // Fetch events
    const now = new Date();
    const upcoming = [];
    const past = [];

    // Trips
    const trips = await Trip.find({ _id: { $in: tripIds } });
    trips.forEach(trip => {
      if (trip.endDate >= now) upcoming.push(trip);
      else past.push(trip);
    });

    // Gym Sessions
    const gymSessions = await GymSession.find({ _id: { $in: gymSessionIds } });
    gymSessions.forEach(session => {
      if (session.date >= now) upcoming.push(session);
      else past.push(session);
    });

    // Bazaars
    const bazaars = await Bazaar.find({ _id: { $in: bazaarIds } });
    bazaars.forEach(bazaar => {
      if (bazaar.end_date >= now) upcoming.push(bazaar);
      else past.push(bazaar);
    });

    res.json({ upcoming, past });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error });
  }
};
