import Trip from "../models/Trip.js";
import mongoose from "mongoose";

const parsePagination = (req) => {
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "10", 10)));
  return { page, limit, skip: (page - 1) * limit };
};

export const createTrip = async (req, res) => {
  try {
    const {
      name,
      location,
      price,
      startDate,
      endDate,
      time,
      shortDescription,
      capacity,
      registrationDeadline,
      status
    } = req.body;

    // Reject trips that start in the past
    if (!startDate || new Date(startDate) < new Date()) {
      return res.status(400).json({ message: "startDate must be in the future" });
    }

    const created = await Trip.create({
      name,
      location,
      price,
      startDate,
      endDate,
      time,
      shortDescription,
      capacity,
      registrationDeadline,
      status,
      createdBy: req.user._id
    });
    return res.status(201).json(created);
  } catch (err) {
    // Handle unique conflict (name + startDate)
    if (err && err.code === 11000) {
      return res.status(409).json({ message: "Trip with same name and startDate already exists" });
    }
    if (err?.errors) {
      return res.status(422).json({ message: "Validation error", errors: err.errors });
    }
    return res.status(500).json({ message: err.message });
  }
};

export const updateTrip = async (req, res) => {
  try {
    // Change from req.params._id to req.params.id
    const tripId = req.params.id;  // ← Fix this line
    
    console.log("Trip ID received:", tripId); // Debug log
    
    if (!tripId) {
      return res.status(400).json({ message: "Trip ID is required" });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(400).json({ message: "Invalid trip ID format" });
    }

    const existing = await Trip.findById(tripId);
    console.log("Trip found:", existing ? "Yes" : "No"); // Debug log
    
    if (!existing) {
      return res.status(404).json({ message: "Trip not found" });
    }

    // Check if trip can still be edited
    if (Date.now() >= new Date(existing.startDate).getTime()) {
      return res.status(409).json({ 
        message: "Cannot edit a trip that has already started" 
      });
    }

    // Rest of your existing update logic...
    const updates = req.body;
    if (req.user && req.user._id) {
      updates.lastEditedBy = req.user._id;
    }

    Object.assign(existing, updates);
    const updated = await existing.save();

    res.json({
      message: "Trip updated successfully",
      trip: updated
    });

  } catch (err) {
    console.error('Update trip error:', err);
    res.status(500).json({ message: err.message });
  }
};

export const getTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    return res.status(200).json(trip);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const listTrips = async (req, res) => {
  try {
    const { q, from, to, status } = req.query;
    const filter = {};

    if (q) {
      filter.$text = { $search: q };
    }
    if (status) {
      filter.status = status;
    }
    if (from || to) {
      filter.startDate = {};
      if (from) filter.startDate.$gte = new Date(from);
      if (to) filter.startDate.$lte = new Date(to);
    }

    const { page, limit, skip } = parsePagination(req);
    const [data, total] = await Promise.all([
      Trip.find(filter).sort({ startDate: 1 }).skip(skip).limit(limit),
      Trip.countDocuments(filter)
    ]);

    return res.status(200).json({ data, page, limit, total });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


