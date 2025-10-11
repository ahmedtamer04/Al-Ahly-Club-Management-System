import Bazaar from "../models/Bazaar.js";

export const createBazaar = async (req, res) => {
  try {
    const {
      name,
      start_date,
      end_date,
      time,
      location,
      short_description,
      registration_deadline
    } = req.body;

    // Validate required fields
    if (!name || !start_date || !end_date || !time || !location || !short_description || !registration_deadline) {
      return res.status(400).json({ 
        message: "Missing required fields. Required: name, start_date, end_date, time, location, short_description, registration_deadline" 
      });
    }

    // Convert string dates to Date objects
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const regDeadline = new Date(registration_deadline);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || isNaN(regDeadline.getTime())) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD format" });
    }

    // Business logic validations are handled by the model's pre-save middleware
    // But we can add extra checks here if needed
    if (startDate > endDate) {
      return res.status(400).json({ message: "Start date must be before end date" });
    }

    if (regDeadline >= startDate) {
      return res.status(400).json({ message: "Registration deadline must be before start date" });
    }

    // Create the bazaar
    const bazaar = await Bazaar.create({
      name,
      start_date: startDate,
      end_date: endDate,
      time,
      location,
      short_description,
      registration_deadline: regDeadline,
      created_by: req.user._id,
      status: "upcoming"
    });

    res.status(201).json({ 
      message: "Bazaar created successfully", 
      bazaar: {
        _id: bazaar._id,
        name: bazaar.name,
        start_date: bazaar.start_date,
        end_date: bazaar.end_date,
        time: bazaar.time,
        location: bazaar.location,
        short_description: bazaar.short_description,
        registration_deadline: bazaar.registration_deadline,
        status: bazaar.status,
        created_by: bazaar.created_by,
        createdAt: bazaar.createdAt,
        updatedAt: bazaar.updatedAt
      }
    });

  } catch (err) {
    console.error('Error creating bazaar:', err);
    
    // Handle validation errors
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

export const editBazaar = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the bazaar
    const bazaar = await Bazaar.findById(id);
    if (!bazaar) {
      return res.status(404).json({ message: "Bazaar not found" });
    }

    // Check if bazaar can be edited (hasn't started yet)
    if (!bazaar.canEdit()) {
      return res.status(400).json({ 
        message: "Cannot edit a bazaar that has already started" 
      });
    }

    const {
      name,
      start_date,
      end_date,
      time,
      location,
      short_description,
      registration_deadline
    } = req.body;

    // Prepare updates object
    const updates = {};
    
    if (name !== undefined) updates.name = name;
    if (time !== undefined) updates.time = time;
    if (location !== undefined) updates.location = location;
    if (short_description !== undefined) updates.short_description = short_description;

    // Handle date updates
    if (start_date !== undefined) {
      const newStartDate = new Date(start_date);
      if (isNaN(newStartDate.getTime())) {
        return res.status(400).json({ message: "Invalid start_date format" });
      }
      updates.start_date = newStartDate;
    }

    if (end_date !== undefined) {
      const newEndDate = new Date(end_date);
      if (isNaN(newEndDate.getTime())) {
        return res.status(400).json({ message: "Invalid end_date format" });
      }
      updates.end_date = newEndDate;
    }

    if (registration_deadline !== undefined) {
      const newRegDeadline = new Date(registration_deadline);
      if (isNaN(newRegDeadline.getTime())) {
        return res.status(400).json({ message: "Invalid registration_deadline format" });
      }
      updates.registration_deadline = newRegDeadline;
    }

    // Additional validation for date relationships
    const finalStartDate = updates.start_date || bazaar.start_date;
    const finalEndDate = updates.end_date || bazaar.end_date;
    const finalRegDeadline = updates.registration_deadline || bazaar.registration_deadline;

    if (finalStartDate > finalEndDate) {
      return res.status(400).json({ message: "Start date must be before end date" });
    }

    if (finalRegDeadline >= finalStartDate) {
      return res.status(400).json({ message: "Registration deadline must be before start date" });
    }

    // Update the bazaar
    const updatedBazaar = await Bazaar.findByIdAndUpdate(
      id, 
      updates, 
      { 
        new: true, 
        runValidators: true,
        context: 'query'
      }
    );

    res.json({ 
      message: "Bazaar updated successfully", 
      bazaar: {
        _id: updatedBazaar._id,
        name: updatedBazaar.name,
        start_date: updatedBazaar.start_date,
        end_date: updatedBazaar.end_date,
        time: updatedBazaar.time,
        location: updatedBazaar.location,
        short_description: updatedBazaar.short_description,
        registration_deadline: updatedBazaar.registration_deadline,
        status: updatedBazaar.status,
        created_by: updatedBazaar.created_by,
        createdAt: updatedBazaar.createdAt,
        updatedAt: updatedBazaar.updatedAt
      }
    });

  } catch (err) {
    console.error('Error updating bazaar:', err);
    
    // Handle validation errors
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

// Additional helpful methods you might want to add

export const getAllBazaars = async (req, res) => {
  try {
    const { status, upcoming } = req.query;
    
    let filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (upcoming === 'true') {
      filter.start_date = { $gte: new Date() };
    }

    const bazaars = await Bazaar.find(filter)
      .populate('created_by', 'first_name last_name email role')
      .sort({ start_date: 1 });

    res.json({
      message: "Bazaars retrieved successfully",
      bazaars,
      total: bazaars.length
    });

  } catch (err) {
    console.error('Error fetching bazaars:', err);
    res.status(500).json({ message: err.message });
  }
};

export const getBazaarById = async (req, res) => {
  try {
    const { id } = req.params;

    const bazaar = await Bazaar.findById(id)
      .populate('created_by', 'first_name last_name email role');

    if (!bazaar) {
      return res.status(404).json({ message: "Bazaar not found" });
    }

    res.json({
      message: "Bazaar retrieved successfully",
      bazaar
    });

  } catch (err) {
    console.error('Error fetching bazaar:', err);
    res.status(500).json({ message: err.message });
  }
};

export const deleteBazaar = async (req, res) => {
  try {
    const { id } = req.params;

    const bazaar = await Bazaar.findById(id);
    if (!bazaar) {
      return res.status(404).json({ message: "Bazaar not found" });
    }

    // Check if bazaar can be deleted (hasn't started yet)
    if (!bazaar.canEdit()) {
      return res.status(400).json({ 
        message: "Cannot delete a bazaar that has already started" 
      });
    }

    await Bazaar.findByIdAndDelete(id);

    res.json({
      message: "Bazaar deleted successfully",
      deletedBazaar: {
        id: bazaar._id,
        name: bazaar.name,
        start_date: bazaar.start_date
      }
    });

  } catch (err) {
    console.error('Error deleting bazaar:', err);
    res.status(500).json({ message: err.message });
  }
};
