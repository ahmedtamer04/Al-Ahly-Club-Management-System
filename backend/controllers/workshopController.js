import Event from "../models/Events.js";

export const createWorkshop = async (req, res) => {
  try {
    const {
      name,
      location,
      short_description,
      start_date,
      end_date,
      time,
      full_agenda,
      faculty_responsible,
      professors_participating,
      required_budget,
      funding_source,
      extra_resources,
      capacity,
      registration_deadline
    } = req.body;

    // Validate required fields
    if (!name || !location || !short_description || !start_date || !end_date || !time ||
        !full_agenda || !faculty_responsible || !professors_participating || 
        !required_budget || !funding_source || !capacity || !registration_deadline) {
      return res.status(400).json({ 
        message: "Missing required fields" 
      });
    }

    const workshop = await Event.create({
      type: "Workshop", // ← REQUIRED: Specify event type
      name,
      location,
      short_description,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      time,
      created_by: req.user._id,
      status: "upcoming",
      workshop: { // ← REQUIRED: Workshop-specific fields
        full_agenda,
        faculty_responsible,
        professors_participating,
        required_budget: Number(required_budget),
        funding_source,
        extra_resources,
        capacity: Number(capacity),
        registration_deadline: new Date(registration_deadline)
      }
    });

    res.status(201).json({
      message: "Workshop created successfully",
      workshop
    });

  } catch (err) {
    console.error('Error creating workshop:', err);
    
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        message: "Validation failed", 
        errors 
      });
    }
    
    res.status(400).json({ message: err.message });
  }
};

export const editWorkshop = async (req, res) => {
  try {
    const workshop = await Event.findOne({ 
      _id: req.params.id, 
      type: "Workshop",
      created_by: req.user._id 
    });

    if (!workshop) {
      return res.status(404).json({ 
        message: 'Workshop not found or not authorized' 
      });
    }

    if (!workshop.canEdit()) {
      return res.status(400).json({ 
        message: "Cannot edit a workshop that has already started" 
      });
    }

    const updates = req.body;
    
    // Handle nested workshop field updates
    const workshopFields = [
      'full_agenda', 'faculty_responsible', 'professors_participating',
      'required_budget', 'funding_source', 'extra_resources', 
      'capacity', 'registration_deadline'
    ];

    workshopFields.forEach(field => {
      if (updates[field] !== undefined) {
        if (!updates.workshop) updates.workshop = {};
        updates.workshop[field] = updates[field];
        delete updates[field];
      }
    });

    const updatedWorkshop = await Event.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      message: "Workshop updated successfully",
      workshop: updatedWorkshop
    });

  } catch (err) {
    console.error('Error updating workshop:', err);
    res.status(400).json({ message: err.message });
  }
};

export const getMyWorkshops = async (req, res) => {
  try {
    const workshops = await Event.find({ 
      type: "Workshop",
      created_by: req.user._id 
    }).sort({ start_date: 1 });

    res.json({
      message: "Workshops retrieved successfully",
      workshops,
      total: workshops.length
    });

  } catch (err) {
    console.error('Error fetching workshops:', err);
    res.status(500).json({ message: err.message });
  }
};
