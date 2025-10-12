import Bazaar from "../models/Bazaar.js";
import VendorApplication from "../models/VendorApplication.js";

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

    // Prevent creating bazaars in the past
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Start of today for fair comparison
    if (startDate < currentDate) {
      return res.status(400).json({ message: "Cannot create a bazaar with a start date in the past" });
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

    // Prevent editing bazaar to start in the past
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Start of today for fair comparison
    if (finalStartDate < currentDate) {
      return res.status(400).json({ message: "Cannot update bazaar to start in the past" });
    }

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

// ================================
// VENDOR-SPECIFIC FUNCTIONS
// ================================

// 1. View List of upcoming Bazaars
export const getUpcomingBazaars = async (req, res) => {
  try {
    const currentDate = new Date();
    
    const upcomingBazaars = await Bazaar.find({
      start_date: { $gte: currentDate },
      status: { $in: ["upcoming", "active"] }
    })
    .populate('created_by', 'first_name last_name email')
    .sort({ start_date: 1 })
    .select('-registered_vendors'); // Exclude sensitive vendor data

    const bazaarsWithRegistrationStatus = upcomingBazaars.map(bazaar => ({
      ...bazaar.toObject(),
      registration_open: bazaar.registration_deadline > currentDate && !bazaar.is_past,
      days_until_start: Math.ceil((bazaar.start_date - currentDate) / (1000 * 60 * 60 * 24))
    }));

    res.json({
      message: "Upcoming bazaars retrieved successfully",
      bazaars: bazaarsWithRegistrationStatus,
      total: bazaarsWithRegistrationStatus.length
    });

  } catch (err) {
    console.error('Error fetching upcoming bazaars:', err);
    res.status(500).json({ message: err.message });
  }
};

// 2. Apply to join Bazaar
export const applyToBazaar = async (req, res) => {
  try {
    const { bazaar_id, staff, booth_size } = req.body;

    // Validate required fields
    if (!bazaar_id || !staff || !booth_size) {
      return res.status(400).json({
        message: "Missing required fields: bazaar_id, staff, booth_size"
      });
    }

    // Check if bazaar exists and registration is open
    const bazaar = await Bazaar.findById(bazaar_id);
    if (!bazaar) {
      return res.status(404).json({ message: "Bazaar not found" });
    }

    if (bazaar.registration_deadline <= new Date()) {
      return res.status(400).json({ message: "Registration deadline has passed" });
    }

    if (bazaar.is_past) {
      return res.status(400).json({ message: "Cannot apply to past bazaars" });
    }

    // Check if vendor already applied to this bazaar
    const existingApplication = await VendorApplication.findOne({
      vendor_user_id: req.user._id,
      bazaar_id: bazaar_id,
      kind: "bazaar"
    });

    if (existingApplication) {
      return res.status(400).json({ 
        message: "You have already applied to this bazaar",
        application_status: existingApplication.status
      });
    }

    // Create application
    const application = await VendorApplication.create({
      vendor_user_id: req.user._id,
      bazaar_id: bazaar_id,
      kind: "bazaar",
      application: {
        staff: staff,
        booth_size: booth_size
      }
    });

    await application.populate([
      { path: 'vendor_user_id', select: 'first_name last_name email vendor_info' },
      { path: 'bazaar_id', select: 'name start_date end_date location' }
    ]);

    res.status(201).json({
      message: "Bazaar application submitted successfully",
      application: application
    });

  } catch (err) {
    console.error('Error applying to bazaar:', err);
    
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

// 3. Apply for a booth in platform
export const applyForBoothPlatform = async (req, res) => {
  try {
    const { bazaar_id, staff, booth_size, setup_duration_weeks, booth_location } = req.body;

    // Validate required fields
    if (!bazaar_id || !staff || !booth_size || !setup_duration_weeks || !booth_location) {
      return res.status(400).json({
        message: "Missing required fields: bazaar_id, staff, booth_size, setup_duration_weeks, booth_location"
      });
    }

    // Check if bazaar exists and registration is open
    const bazaar = await Bazaar.findById(bazaar_id);
    if (!bazaar) {
      return res.status(404).json({ message: "Bazaar not found" });
    }

    if (bazaar.registration_deadline <= new Date()) {
      return res.status(400).json({ message: "Registration deadline has passed" });
    }

    if (bazaar.is_past) {
      return res.status(400).json({ message: "Cannot apply to past bazaars" });
    }

    // Check if vendor already applied for booth platform to this bazaar
    const existingApplication = await VendorApplication.findOne({
      vendor_user_id: req.user._id,
      bazaar_id: bazaar_id,
      kind: "booth_platform"
    });

    if (existingApplication) {
      return res.status(400).json({ 
        message: "You have already applied for booth platform to this bazaar",
        application_status: existingApplication.status
      });
    }

    // Create booth platform application
    const application = await VendorApplication.create({
      vendor_user_id: req.user._id,
      bazaar_id: bazaar_id,
      kind: "booth_platform",
      application: {
        staff: staff,
        booth_size: booth_size,
        setup_duration_weeks: setup_duration_weeks,
        booth_location: booth_location
      }
    });

    await application.populate([
      { path: 'vendor_user_id', select: 'first_name last_name email vendor_info' },
      { path: 'bazaar_id', select: 'name start_date end_date location' }
    ]);

    res.status(201).json({
      message: "Booth platform application submitted successfully",
      application: application
    });

  } catch (err) {
    console.error('Error applying for booth platform:', err);
    
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

// 4. View all upcoming booths/bazaars (ACCEPTED ONLY)
export const getAcceptedApplications = async (req, res) => {
  try {
    const acceptedApplications = await VendorApplication.find({
      vendor_user_id: req.user._id,
      status: "accepted"
    })
    .populate('bazaar_id', 'name start_date end_date time location status')
    .sort({ 'bazaar_id.start_date': 1 });

    // Filter for upcoming bazaars only
    const upcomingAccepted = acceptedApplications.filter(app => 
      app.bazaar_id && app.bazaar_id.start_date >= new Date()
    );

    const formattedApplications = upcomingAccepted.map(app => ({
      _id: app._id,
      kind: app.kind,
      booth_size: app.application.booth_size,
      setup_duration_weeks: app.application.setup_duration_weeks,
      booth_location: app.application.booth_location,
      approved_at: app.approved_at,
      bazaar: {
        _id: app.bazaar_id._id,
        name: app.bazaar_id.name,
        start_date: app.bazaar_id.start_date,
        end_date: app.bazaar_id.end_date,
        time: app.bazaar_id.time,
        location: app.bazaar_id.location,
        status: app.bazaar_id.status,
        days_until_start: Math.ceil((app.bazaar_id.start_date - new Date()) / (1000 * 60 * 60 * 24))
      }
    }));

    res.json({
      message: "Accepted applications retrieved successfully",
      applications: formattedApplications,
      total: formattedApplications.length
    });

  } catch (err) {
    console.error('Error fetching accepted applications:', err);
    res.status(500).json({ message: err.message });
  }
};

// 5. View all requests booths/bazaars (REJECTED/PENDING)
export const getPendingAndRejectedApplications = async (req, res) => {
  try {
    const { status } = req.query; // 'pending', 'rejected', or both if not specified
    
    let statusFilter = { $in: ["pending", "rejected"] };
    if (status && ["pending", "rejected"].includes(status)) {
      statusFilter = status;
    }

    const applications = await VendorApplication.find({
      vendor_user_id: req.user._id,
      status: statusFilter
    })
    .populate('bazaar_id', 'name start_date end_date time location status registration_deadline')
    .sort({ createdAt: -1 });

    const formattedApplications = applications.map(app => ({
      _id: app._id,
      kind: app.kind,
      status: app.status,
      booth_size: app.application.booth_size,
      setup_duration_weeks: app.application.setup_duration_weeks,
      booth_location: app.application.booth_location,
      rejection_reason: app.rejection_reason,
      applied_at: app.createdAt,
      can_edit: app.canEdit(),
      bazaar: app.bazaar_id ? {
        _id: app.bazaar_id._id,
        name: app.bazaar_id.name,
        start_date: app.bazaar_id.start_date,
        end_date: app.bazaar_id.end_date,
        time: app.bazaar_id.time,
        location: app.bazaar_id.location,
        status: app.bazaar_id.status,
        registration_deadline: app.bazaar_id.registration_deadline,
        registration_still_open: app.bazaar_id.registration_deadline > new Date(),
        days_until_start: Math.ceil((app.bazaar_id.start_date - new Date()) / (1000 * 60 * 60 * 24))
      } : null
    }));

    res.json({
      message: `${status || 'Pending and rejected'} applications retrieved successfully`,
      applications: formattedApplications,
      total: formattedApplications.length
    });

  } catch (err) {
    console.error('Error fetching pending/rejected applications:', err);
    res.status(500).json({ message: err.message });
  }
};

// Bonus: Get vendor's application details by ID
export const getApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await VendorApplication.findOne({
      _id: applicationId,
      vendor_user_id: req.user._id // Ensure vendor can only see their own applications
    })
    .populate('bazaar_id')
    .populate('approved_by', 'first_name last_name email role');

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json({
      message: "Application retrieved successfully",
      application: application
    });

  } catch (err) {
    console.error('Error fetching application:', err);
    res.status(500).json({ message: err.message });
  }
};
