import Trip from "../models/Trip.js";

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
    const id = req.params.id;
    const updates = (({
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
      lastEditReason
    }) => ({
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
      lastEditReason
    }))(req.body);

    // Remove undefined fields
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

    const existing = await Trip.findById(id);
    if (!existing) return res.status(404).json({ message: "Trip not found" });

    if (Date.now() >= new Date(existing.startDate).getTime()) {
      return res.status(409).json({ message: "Cannot edit a trip that has already started" });
    }

    // If dates being changed, re-validate relationships will run in schema validate
    updates.lastEditedBy = req.user._id;

    // Use findByIdAndUpdate with runValidators for mongoose validation and unique index handling
    const updated = await Trip.findByIdAndUpdate(id, updates, { new: true, runValidators: true, context: "query" });
    return res.status(200).json(updated);
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ message: "Trip with same name and startDate already exists" });
    }
    if (err?.errors) {
      return res.status(422).json({ message: "Validation error", errors: err.errors });
    }
    return res.status(500).json({ message: err.message });
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


