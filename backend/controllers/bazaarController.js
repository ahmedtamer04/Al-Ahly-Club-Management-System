import Event from "../models/Event.js";

// Helper to combine date and time strings into a Date object
const combineDateTime = (dateStr, timeStr) => {
  if (!dateStr) return null;
  // If timeStr missing, assume midnight
  const t = timeStr ? timeStr : "00:00";
  const combined = new Date(`${dateStr} ${t}`);
  return isNaN(combined.getTime()) ? null : combined;
};

export const createBazaar = async (req, res) => {
  try {
    const {
      name,
      start_date,
      start_time,
      end_date,
      end_time,
      location,
      description,
      registration_deadline_date,
      registration_deadline_time,
      registration_deadline // allow clients to send full ISO datetime too
    } = req.body;

    if (!name || !start_date || !start_time || !end_date || !end_time || !location) {
      return res.status(400).json({ message: "Missing required fields. Required: name, start_date, start_time, end_date, end_time, location" });
    }

    const starts_at = combineDateTime(start_date, start_time);
    const ends_at = combineDateTime(end_date, end_time);

    let regDeadline = null;
    if (registration_deadline) regDeadline = new Date(registration_deadline);
    else regDeadline = combineDateTime(registration_deadline_date, registration_deadline_time);

    if (!starts_at || !ends_at) return res.status(400).json({ message: "Invalid start or end date/time" });
    if (starts_at >= ends_at) return res.status(400).json({ message: "Start date/time must be before end date/time" });
    if (regDeadline && regDeadline >= starts_at) return res.status(400).json({ message: "Registration deadline must be before bazaar start time" });

    const event = await Event.create({
      type: "bazaar",
      title: name,
      description: description || "",
      location,
      starts_at,
      ends_at,
      created_by: req.user ? req.user._id : undefined,
      meta: { registration_deadline: regDeadline }
    });

    res.status(201).json({ message: "Bazaar created successfully", bazaar: event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Edit bazaar details only if it hasn't started yet
export const editBazaar = async (req, res) => {
  try {
    const { id } = req.params;
    const bazaar = await Event.findById(id);
    if (!bazaar) return res.status(404).json({ message: "Bazaar not found" });
    if (bazaar.type !== "bazaar") return res.status(400).json({ message: "Event is not a bazaar" });

    const now = new Date();
    if (now >= bazaar.starts_at) {
      return res.status(400).json({ message: "Cannot edit a bazaar that has already started" });
    }

    const {
      name,
      start_date,
      start_time,
      end_date,
      end_time,
      location,
      description,
      registration_deadline_date,
      registration_deadline_time,
      registration_deadline // optional full ISO string
    } = req.body;

    const updates = {};
    if (name) updates.title = name;
    if (location) updates.location = location;
    if (description !== undefined) updates.description = description;

    // Compute new datetimes if any provided
    let newStarts = null;
    let newEnds = null;
    if (start_date || start_time) {
      const sd = start_date || bazaar.starts_at.toISOString().split('T')[0];
      const st = start_time || bazaar.starts_at.toTimeString().split(' ')[0];
      newStarts = combineDateTime(sd, st);
      if (!newStarts) return res.status(400).json({ message: "Invalid new start date/time" });
      updates.starts_at = newStarts;
    }
    if (end_date || end_time) {
      const ed = end_date || bazaar.ends_at.toISOString().split('T')[0];
      const et = end_time || bazaar.ends_at.toTimeString().split(' ')[0];
      newEnds = combineDateTime(ed, et);
      if (!newEnds) return res.status(400).json({ message: "Invalid new end date/time" });
      updates.ends_at = newEnds;
    }

    // If both new start and end provided (or mixed), validate ordering
    const finalStart = updates.starts_at || bazaar.starts_at;
    const finalEnd = updates.ends_at || bazaar.ends_at;
    if (finalStart >= finalEnd) return res.status(400).json({ message: "Start must be before end" });

    // Registration deadline
    let regDeadline = null;
    if (registration_deadline) regDeadline = new Date(registration_deadline);
    else if (registration_deadline_date || registration_deadline_time) {
      const rd = registration_deadline_date || (bazaar.meta && bazaar.meta.registration_deadline ? new Date(bazaar.meta.registration_deadline).toISOString().split('T')[0] : null);
      const rt = registration_deadline_time || (bazaar.meta && bazaar.meta.registration_deadline ? new Date(bazaar.meta.registration_deadline).toTimeString().split(' ')[0] : null);
      regDeadline = combineDateTime(rd, rt);
    }
    if (regDeadline) {
      if (regDeadline >= finalStart) return res.status(400).json({ message: "Registration deadline must be before bazaar start time" });
      updates.meta = { ...(bazaar.meta || {}), registration_deadline: regDeadline };
    }

    const updated = await Event.findByIdAndUpdate(id, updates, { new: true });
    res.json({ message: "Bazaar updated successfully", bazaar: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
