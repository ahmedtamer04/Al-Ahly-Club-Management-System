import GymSession from "../models/gymSession.js";
import GymSessionRegistration from "../models/GymSessionRegistration.js";
import { sendGymSessionCancellationEmail, sendGymSessionEditEmail } from "../services/emailService.js";

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

    // Get current session to compare changes
    const currentSession = await GymSession.findById(id);
    if (!currentSession) {
      return res.status(404).json({ message: "Gym session not found" });
    }

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

    // Check if date or time changed
    const dateChanged = date && new Date(date).getTime() !== new Date(currentSession.date).getTime();
    const timeChanged = time && time !== currentSession.time;

    // Send email notifications to registered users if date or time changed
    if (dateChanged || timeChanged) {
      const registrations = await GymSessionRegistration.find({
        gym_session_id: id,
        status: 'registered'
      }).populate('user_id', 'email first_name last_name role');

      const emailPromises = registrations.map(reg => {
        // Use populated user email if available, otherwise fall back to registration email
        const userEmail = reg.user_id?.email || reg.email;
        // Use populated user name if available, otherwise fall back to registration name
        const userName = reg.user_id 
          ? `${reg.user_id.first_name || ''} ${reg.user_id.last_name || ''}`.trim() || reg.name
          : reg.name;

        if (!userEmail) {
          console.error(`No email found for registration ${reg._id}`);
          return Promise.resolve();
        }

        return sendGymSessionEditEmail(userEmail, {
          userName: userName,
          sessionType: updatedSession.type,
          oldDate: currentSession.date,
          oldTime: currentSession.time,
          newDate: updatedSession.date,
          newTime: updatedSession.time,
          sessionDuration: updatedSession.duration
        }).catch(err => {
          console.error(`Failed to send edit email to ${userEmail} (${reg.user_id?.role || 'unknown role'}):`, err);
        });
      });

      await Promise.all(emailPromises);
      console.log(`✅ Sent ${registrations.length} gym session edit notification email(s)`);
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

    // Send email notifications to all registered users (Student, Staff, TA, Professor)
    const registrations = await GymSessionRegistration.find({
      gym_session_id: id,
      status: 'registered'
    }).populate('user_id', 'email first_name last_name role');

    const emailPromises = registrations.map(reg => {
      // Use populated user email if available, otherwise fall back to registration email
      const userEmail = reg.user_id?.email || reg.email;
      // Use populated user name if available, otherwise fall back to registration name
      const userName = reg.user_id 
        ? `${reg.user_id.first_name || ''} ${reg.user_id.last_name || ''}`.trim() || reg.name
        : reg.name;

      if (!userEmail) {
        console.error(`No email found for registration ${reg._id}`);
        return Promise.resolve();
      }

      return sendGymSessionCancellationEmail(userEmail, {
        userName: userName,
        sessionType: cancelledSession.type,
        sessionDate: cancelledSession.date,
        sessionTime: cancelledSession.time,
        sessionDuration: cancelledSession.duration
      }).catch(err => {
        console.error(`Failed to send cancellation email to ${userEmail} (${reg.user_id?.role || 'unknown role'}):`, err);
      });
    });

    await Promise.all(emailPromises);
    console.log(`✅ Sent ${registrations.length} gym session cancellation notification email(s)`);

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
