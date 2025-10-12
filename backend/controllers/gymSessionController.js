import GymSession from "../models/gymSession.js";

//  CREATE a gym session
export const createGymSession = async (req, res) => {
  try {
    const { date, time, duration, type, maxParticipants } = req.body;

    if (!date || !time || !duration || !type || !maxParticipants) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Prevent creating gym sessions in the past
    const sessionDate = new Date(date);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Start of today for fair comparison
    
    if (isNaN(sessionDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }
    
    if (sessionDate < currentDate) {
      return res.status(400).json({ message: "Cannot create a gym session with a date in the past" });
    }

    const session = new GymSession({ date, time, duration, type, maxParticipants });
    await session.save();

    res.status(201).json({ message: " Gym session created successfully", session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  EDIT (update) a gym session
export const editGymSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time, duration } = req.body;

    // Validate date if it's being updated
    if (date) {
      const sessionDate = new Date(date);
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Start of today for fair comparison
      
      if (isNaN(sessionDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      if (sessionDate < currentDate) {
        return res.status(400).json({ message: "Cannot update gym session to a date in the past" });
      }
    }

    const updatedSession = await GymSession.findByIdAndUpdate(
      id,
      { date, time, duration },
      { new: true }
    );

    if (!updatedSession) {
      return res.status(404).json({ message: "Gym session not found" });
    }

    res.status(200).json({ message: " Gym session updated successfully", updatedSession });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  CANCEL a gym session
export const cancelGymSession = async (req, res) => {
  try {
    const { id } = req.params;

    const cancelledSession = await GymSession.findByIdAndUpdate(
      id,
      { status: "cancelled" },
      { new: true }
    );

    if (!cancelledSession) {
      return res.status(404).json({ message: "Gym session not found" });
    }

    res.status(200).json({ message: " Gym session cancelled", cancelledSession });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  VIEW Gym Schedule by month and/or type
export const viewGymSchedule = async (req, res) => {
  try {
    const { month, year, type } = req.query;

    // Build filter dynamically
    const filter = { status: "scheduled" };

    if (type) {
      filter.type = type;
    }

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const sessions = await GymSession.find(filter).sort({ date: 1, time: 1 });

    if (sessions.length === 0) {
      return res.status(404).json({ message: "No gym sessions found for this filter" });
    }

    res.status(200).json({
      message: "Gym schedule retrieved successfully",
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
