import Event from "../models/Events.js";
import { notifyUsersNewEvent } from "../services/notificationService.js";

export const createConference = async (req, res) => {
  try {
    const { 
      name, 
      location,
      short_description,
      start_date, 
      end_date, 
      time,
      campus,
      professors_participating,
      full_agenda, 
      conference_website, 
      required_budget, 
      funding_source, 
      extra_required_sources 
    } = req.body;

    // Validate required fields
    if (!name || !location || !short_description || !start_date || !end_date || !time || 
        !campus || !professors_participating || !full_agenda || !conference_website || 
        !required_budget || !funding_source) {
      return res.status(400).json({ 
        message: "Missing required fields" 
      });
    }

    // ✅ FIX: Combine date and time properly
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
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

    if (startDate < new Date()) {
      return res.status(400).json({ message: "Start date must be in the future" });
    }

    const { allowed_roles } = req.body;
    
    const conference = await Event.create({
      type: "Conference",
      name,
      location,
      short_description,
      start_date: startDate,
      end_date: endDate,
      time,
      created_by: req.user._id,
      status: "upcoming",
      allowed_roles: Array.isArray(allowed_roles) ? allowed_roles : [],
      conference: { // ← REQUIRED: Conference-specific fields
        campus,
        professors_participating: Array.isArray(professors_participating) 
          ? professors_participating 
          : professors_participating.split(',').map(p => p.trim()).filter(p => p.length > 0),
        full_agenda,
        conference_website,
        required_budget: Number(required_budget),
        funding_source,
        extra_required_sources
      }
    });

    // 🔔 Notify all users about the new conference
    notifyUsersNewEvent(conference).catch(err => 
      console.error('Failed to send conference notifications:', err)
    );

    res.status(201).json({ 
      message: "Conference created successfully", 
      conference 
    });

  } catch (error) {
    console.error('Error creating conference:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        message: "Validation failed", 
        errors 
      });
    }
    
    res.status(500).json({ message: error.message });
  }
};

export const editConference = async (req, res) => {
  try {
    const { id } = req.params;

    // Find conference (filter by type)
    const conference = await Event.findOne({ _id: id, type: "Conference" });
    if (!conference) {
      return res.status(404).json({ message: "Conference not found" });
    }

    // Check if conference can be edited
    if (!conference.canEdit()) {
      return res.status(400).json({ 
        message: "Cannot edit a conference that has already started" 
      });
    }

    const updates = req.body;
    
    // Handle nested conference field updates
    const conferenceFields = [
      'campus', 'professors_participating', 'full_agenda', 
      'conference_website', 'required_budget', 'funding_source', 
      'extra_required_sources'
    ];

    conferenceFields.forEach(field => {
      if (updates[field] !== undefined) {
        if (!updates.conference) updates.conference = {};
        
        // Special handling for professors_participating - convert string to array
        if (field === 'professors_participating' && typeof updates[field] === 'string') {
          updates.conference[field] = updates[field].split(',').map(p => p.trim()).filter(p => p.length > 0);
        } else {
          updates.conference[field] = updates[field];
        }
        
        delete updates[field];
      }
    });

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

    const updatedConference = await Event.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({ 
      message: "Conference updated successfully", 
      conference: updatedConference 
    });

  } catch (error) {
    console.error('Error updating conference:', error);
    res.status(500).json({ message: error.message });
  }
};