import Event from "../models/Events.js";
import mongoose from "mongoose";
import { notifyUsersNewEvent } from "../services/notificationService.js";

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
      start_date,
      end_date,
      time,
      short_description,
      capacity,
      registration_deadline
    } = req.body;

    // Validate required fields
    if (!name || !location || price === undefined || !start_date || !end_date || !time || !short_description || !capacity || !registration_deadline) {
      return res.status(400).json({ 
        message: "Missing required fields" 
      });
    }

    // ✅ FIX: Combine date and time properly
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const regDeadline = new Date(registration_deadline);
    
    // Parse time (format: "HH:MM" or "HH:MM AM/PM")
    const timeParts = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (timeParts) {
      let hours = parseInt(timeParts[1]);
      const minutes = parseInt(timeParts[2]);
      const meridiem = timeParts[3];
      
      // Convert to 24-hour format if PM
      if (meridiem && meridiem.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12;
      } else if (meridiem && meridiem.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }
      
      startDate.setHours(hours, minutes, 0, 0);
      endDate.setHours(hours, minutes, 0, 0);
    }

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || isNaN(regDeadline.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const { allowed_roles } = req.body;
    
    // Create trip using Events model
    const trip = await Event.create({
      type: "Trip",
      name,
      location,
      short_description,
      start_date: startDate,
      end_date: endDate,
      time,
      created_by: req.user._id,
      status: "upcoming",
      allowed_roles: Array.isArray(allowed_roles) ? allowed_roles : [],
      trip: { // ← REQUIRED: Trip-specific fields
        price: Number(price),
        capacity: Number(capacity),
        registration_deadline: regDeadline
      }
    });

    // Notify all users about the new trip
    notifyUsersNewEvent(trip).catch(err => 
      console.error('Failed to send trip notifications:', err)
    );

    res.status(201).json({ 
      message: "Trip created successfully", 
      trip 
    });

  } catch (err) {
    console.error('Error creating trip:', err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        message: "Validation failed", 
        errors 
      });
    }
    
    res.status(500).json({ message: err.message });
  }
};

export const updateTrip = async (req, res) => {
  try {
    const tripId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(400).json({ message: "Invalid trip ID format" });
    }

    // Find trip (filter by type)
    const existing = await Event.findOne({ _id: tripId, type: "Trip" });
    
    if (!existing) {
      return res.status(404).json({ message: "Trip not found" });
    }

    // Check if trip can still be edited
    if (!existing.canEdit()) {
      return res.status(409).json({ 
        message: "Cannot edit a trip that has already started" 
      });
    }

    const updates = req.body;
    
    // Handle nested trip field updates
    if (updates.price !== undefined || updates.capacity !== undefined || updates.registration_deadline !== undefined) {
      if (!updates.trip) updates.trip = {};
      
      if (updates.price !== undefined) {
        updates.trip.price = Number(updates.price);
        delete updates.price;
      }
      if (updates.capacity !== undefined) {
        updates.trip.capacity = Number(updates.capacity);
        delete updates.capacity;
      }
      if (updates.registration_deadline !== undefined) {
        updates.trip.registration_deadline = new Date(updates.registration_deadline);
        delete updates.registration_deadline;
      }
    }

    // Handle date updates
    if (updates.start_date) {
      updates.start_date = new Date(updates.start_date);
    }
    if (updates.end_date) {
      updates.end_date = new Date(updates.end_date);
    }

    // Handle allowed_roles update
    if (updates.allowed_roles !== undefined) {
      updates.allowed_roles = Array.isArray(updates.allowed_roles) ? updates.allowed_roles : [];
    }

    const updated = await Event.findByIdAndUpdate(
      tripId, 
      updates, 
      { 
        new: true, 
        runValidators: true 
      }
    );

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
    const trip = await Event.findOne({ _id: req.params.id, type: "Trip" })
      .populate('created_by', 'first_name last_name email');

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    res.json({
      message: "Trip retrieved successfully",
      trip
    });
  } catch (err) {
    console.error('Error fetching trip:', err);
    res.status(500).json({ message: err.message });
  }
};

export const listTrips = async (req, res) => {
  try {
    const { q, from, to, status } = req.query;
    const filter = { type: "Trip" }; // ← Filter by type

    if (q) {
      filter.$text = { $search: q };
    }
    if (status) {
      filter.status = status;
    }
    if (from || to) {
      filter.start_date = {};
      if (from) filter.start_date.$gte = new Date(from);
      if (to) filter.start_date.$lte = new Date(to);
    }

    const { page, limit, skip } = parsePagination(req);
    const [data, total] = await Promise.all([
      Event.find(filter)
        .populate('created_by', 'first_name last_name email')
        .sort({ start_date: 1 })
        .skip(skip)
        .limit(limit),
      Event.countDocuments(filter)
    ]);

    res.json({
      message: "Trips retrieved successfully",
      trips: data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error listing trips:', err);
    res.status(500).json({ message: err.message });
  }
};


