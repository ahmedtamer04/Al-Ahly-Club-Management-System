import Event from "../models/Events.js";

export const createBazaar = async (req, res) => {
  try {
    const {
      name,
      location,
      short_description,
      start_date,
      end_date,
      time,
      registration_deadline
    } = req.body;

    // Validate required fields
    if (!name || !location || !short_description || !start_date || !end_date || !time || !registration_deadline) {
      return res.status(400).json({ 
        message: "Missing required fields: name, location, short_description, start_date, end_date, time, registration_deadline" 
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

    // Create the bazaar using Events model
    const bazaar = await Event.create({
      type: "Bazaar", // ← REQUIRED: Specify event type
      name,
      location,
      short_description,
      start_date: startDate,
      end_date: endDate,
      time,
      created_by: req.user._id,
      status: "upcoming",
      bazaar: { // ← REQUIRED: Bazaar-specific fields
        registration_deadline: regDeadline,
        vendors_participating: []
      }
    });

    res.status(201).json({ 
      message: "Bazaar created successfully", 
      bazaar
    });

  } catch (err) {
    console.error('Error creating bazaar:', err);
    
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
    
    // Find the bazaar (filter by type)
    const bazaar = await Event.findOne({ _id: id, type: "Bazaar" });
    if (!bazaar) {
      return res.status(404).json({ message: "Bazaar not found" });
    }

    // Check if bazaar can be edited
    if (!bazaar.canEdit()) {
      return res.status(400).json({ 
        message: "Cannot edit a bazaar that has already started" 
      });
    }

    const updates = req.body;
    
    // Handle date updates
    if (updates.start_date) {
      updates.start_date = new Date(updates.start_date);
    }
    if (updates.end_date) {
      updates.end_date = new Date(updates.end_date);
    }
    if (updates.registration_deadline) {
      // Update nested field correctly
      if (!updates.bazaar) updates.bazaar = {};
      updates.bazaar.registration_deadline = new Date(updates.registration_deadline);
    }

    const updatedBazaar = await Event.findByIdAndUpdate(
      id, 
      updates, 
      { 
        new: true, 
        runValidators: true
      }
    );

    res.json({ 
      message: "Bazaar updated successfully", 
      bazaar: updatedBazaar
    });

  } catch (err) {
    console.error('Error updating bazaar:', err);
    res.status(500).json({ message: err.message });
  }
};

export const getAllBazaars = async (req, res) => {
  try {
    const { status, upcoming } = req.query;
    
    let filter = { type: "Bazaar" }; // ← Filter by type
    
    if (status) {
      filter.status = status;
    }
    
    if (upcoming === 'true') {
      filter.start_date = { $gte: new Date() };
    }

    const bazaars = await Event.find(filter)
      .populate('created_by', 'first_name last_name email role')
      .populate('bazaar.vendors_participating.vendor_id', 'first_name last_name email vendor_info')
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

    const bazaar = await Event.findById(id)
      .populate('created_by', 'first_name last_name email role')
      .populate('bazaar.vendors_participating.vendor_id', 'first_name last_name email vendor_info');

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

    const bazaar = await Event.findById(id);
    if (!bazaar) {
      return res.status(404).json({ message: "Bazaar not found" });
    }

    // Check if bazaar can be deleted (hasn't started yet)
    if (!bazaar.canEdit()) {
      return res.status(400).json({ 
        message: "Cannot delete a bazaar that has already started" 
      });
    }

    await Event.findByIdAndDelete(id);

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
