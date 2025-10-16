import Event from "../models/Events.js";
import VendorApplication from "../models/VendorApplication.js";

// Get upcoming bazaars
export const getUpcomingBazaars = async (req, res) => {
  try {
    const currentDate = new Date();
    
    const upcomingBazaars = await Event.find({
      type: "Bazaar",
      start_date: { $gte: currentDate },
      status: { $in: ["upcoming", "active"] }
    })
    .populate('created_by', 'first_name last_name email')
    .sort({ start_date: 1 })
    .select('-workshop -booth -conference -trip -bazaar.vendors_participating'); // Exclude irrelevant subdocuments and sensitive data

    const bazaarsWithRegistrationStatus = upcomingBazaars.map(bazaar => ({
      ...bazaar.toObject(),
      registration_open: bazaar.bazaar?.registration_deadline 
        ? bazaar.bazaar.registration_deadline > currentDate && bazaar.start_date > currentDate
        : false,
      days_until_start: Math.ceil((bazaar.start_date - currentDate) / (1000 * 60 * 60 * 24))
    }));

    res.json({
      message: "Upcoming bazaars retrieved successfully",
      bazaars: bazaarsWithRegistrationStatus,
      total: bazaarsWithRegistrationStatus.length
    });
  } catch (error) {
    console.error('Error fetching upcoming bazaars:', error);
    res.status(500).json({ message: error.message });
  }
};

// Apply to bazaar (complete application with booth details)
export const applyToBazaar = async (req, res) => {
  try {
    const { bazaar_id, bazaar_staff, booth_size } = req.body;

    // Validate required fields
    if (!bazaar_id || !bazaar_staff || !booth_size) {
      return res.status(400).json({ 
        message: "Bazaar ID, staff details, and booth size are required" 
      });
    }

    // Validate booth size
    if (!["2x2", "4x4"].includes(booth_size)) {
      return res.status(400).json({ 
        message: "Booth size must be either 2x2 or 4x4" 
      });
    }

    // Validate staff array
    if (!Array.isArray(bazaar_staff) || bazaar_staff.length === 0 || bazaar_staff.length > 5) {
      return res.status(400).json({ 
        message: "Staff must be an array with 1 to 5 members" 
      });
    }

    // Validate each staff member has name and email
    for (const staff of bazaar_staff) {
      if (!staff.name || !staff.email) {
        return res.status(400).json({ 
          message: "Each staff member must have both name and email" 
        });
      }
      // Basic email validation
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(staff.email)) {
        return res.status(400).json({ 
          message: `Invalid email format for staff member: ${staff.name}` 
        });
      }
    }

    // Check if bazaar exists and is upcoming
    const bazaar = await Event.findOne({ 
      _id: bazaar_id, 
      type: "Bazaar" 
    });

    if (!bazaar) {
      return res.status(404).json({ message: "Bazaar not found" });
    }

    // Check registration deadline
    if (bazaar.bazaar?.registration_deadline && bazaar.bazaar.registration_deadline <= new Date()) {
      return res.status(400).json({ message: "Registration deadline has passed" });
    }

    // Check if bazaar is in the past
    if (bazaar.start_date <= new Date()) {
      return res.status(400).json({ message: "Cannot apply to past bazaars" });
    }

    // Check if already applied
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

    // Create new bazaar application with booth details
    const application = new VendorApplication({
      vendor_user_id: req.user._id,
      bazaar_id: bazaar_id,
      kind: "bazaar",
      application: {
        bazaar_staff: bazaar_staff,
        booth_size: booth_size
      }
    });

    await application.save();
    
    await application.populate([
      { path: 'vendor_user_id', select: 'first_name last_name email vendor_info' },
      { path: 'bazaar_id', select: 'name start_date end_date location' }
    ]);

    res.status(201).json({
      message: "Bazaar application submitted successfully",
      application: {
        _id: application._id,
        status: application.status,
        kind: application.kind,
        booth_size: application.application.booth_size,
        staff_count: application.application.bazaar_staff.length,
        bazaar: application.bazaar_id,
        created_at: application.createdAt
      }
    });
  } catch (error) {
    console.error('Error applying to bazaar:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: "You have already applied to this bazaar" 
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        message: "Validation failed", 
        errors 
      });
    }
    
    res.status(400).json({ message: error.message });
  }
};

// Apply to booth event (1-4 weeks setup, independent of bazaars)
export const applyToBoothEvent = async (req, res) => {
  try {
    const { booth_staff, booth_size, setup_duration_weeks, booth_location, preferred_start_date, notes } = req.body;

    // Validate required fields
    if (!booth_staff || !booth_size || !setup_duration_weeks || !booth_location) {
      return res.status(400).json({
        message: "Staff details, booth size, duration, and location are required"
      });
    }

    // Validate booth size
    if (!["2x2", "4x4"].includes(booth_size)) {
      return res.status(400).json({ 
        message: "Booth size must be either 2x2 or 4x4" 
      });
    }

    // Validate setup duration
    if (!Number.isInteger(setup_duration_weeks) || setup_duration_weeks < 1 || setup_duration_weeks > 4) {
      return res.status(400).json({ 
        message: "Setup duration must be between 1 and 4 weeks" 
      });
    }

    // Validate staff array
    if (!Array.isArray(booth_staff) || booth_staff.length === 0 || booth_staff.length > 5) {
      return res.status(400).json({ 
        message: "Staff must be an array with 1 to 5 members" 
      });
    }

    // Validate each staff member has name and email
    for (const staff of booth_staff) {
      if (!staff.name || !staff.email) {
        return res.status(400).json({ 
          message: "Each staff member must have both name and email" 
        });
      }
      // Basic email validation
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(staff.email)) {
        return res.status(400).json({ 
          message: `Invalid email format for staff member: ${staff.name}` 
        });
      }
    }

    // Validate booth location
    if (!booth_location.zone || !["A", "B", "C", "D"].includes(booth_location.zone)) {
      return res.status(400).json({ 
        message: "Booth location must include a valid zone (A, B, C, or D)" 
      });
    }

    // Validate preferred start date if provided
    if (preferred_start_date) {
      const startDate = new Date(preferred_start_date);
      if (startDate <= new Date()) {
        return res.status(400).json({ 
          message: "Preferred start date must be in the future" 
        });
      }
    }

    // Create booth event application
    const application = new VendorApplication({
      vendor_user_id: req.user._id,
      kind: "booth_event",
      application: {
        booth_staff: booth_staff,
        booth_size: booth_size,
        setup_duration_weeks: setup_duration_weeks,
        booth_location: booth_location,
        preferred_start_date: preferred_start_date,
        notes: notes
      }
    });

    await application.save();

    await application.populate('vendor_user_id', 'first_name last_name email vendor_info');

    res.status(201).json({
      message: "Booth event application submitted successfully",
      application: {
        _id: application._id,
        status: application.status,
        kind: application.kind,
        booth_size: application.application.booth_size,
        setup_duration: `${application.application.setup_duration_weeks} week(s)`,
        location_zone: application.application.booth_location.zone,
        staff_count: application.application.booth_staff.length,
        preferred_start_date: application.application.preferred_start_date,
        notes: application.application.notes,
        vendor: {
          _id: application.vendor_user_id._id,
          name: `${application.vendor_user_id.first_name} ${application.vendor_user_id.last_name}`,
          email: application.vendor_user_id.email,
          vendor_info: application.vendor_user_id.vendor_info
        },
        created_at: application.createdAt
      }
    });

  } catch (err) {
    console.error('Error applying to booth event:', err);
    
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

// Get accepted applications
export const getAcceptedApplications = async (req, res) => {
  try {
    const acceptedApplications = await VendorApplication.find({
      vendor_user_id: req.user._id,
      status: "accepted"
    })
    .populate('bazaar_id', 'name start_date end_date time location status type')
    .sort({ 'bazaar_id.start_date': 1 });

    // Filter for upcoming events only
    const upcomingAccepted = acceptedApplications.filter(app => 
      app.bazaar_id && app.bazaar_id.start_date >= new Date()
    );

    const formattedApplications = upcomingAccepted.map(app => ({
      _id: app._id,
      kind: app.kind,
      status: app.status,
      booth_size: app.application?.booth_size,
      setup_duration_weeks: app.application?.setup_duration_weeks,
      booth_location: app.application?.booth_location,
      bazaar_staff: app.application?.bazaar_staff,
      booth_staff: app.application?.booth_staff,
      approved_at: app.approved_at,
      approved_by: app.approved_by,
      bazaar: {
        _id: app.bazaar_id._id,
        name: app.bazaar_id.name,
        type: app.bazaar_id.type,
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
  } catch (error) {
    console.error('Error fetching accepted applications:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get pending and rejected applications
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
    .populate('bazaar_id', 'name start_date end_date time location status type bazaar')
    .sort({ createdAt: -1 });

    const formattedApplications = applications.map(app => {
      let canEdit = false;
      let registrationStillOpen = false;
      let daysUntilStart = null;

      if (app.bazaar_id) {
        daysUntilStart = Math.ceil((app.bazaar_id.start_date - new Date()) / (1000 * 60 * 60 * 24));
        
        // Check if application can be edited (pending and event hasn't started)
        if (app.status === "pending" && app.bazaar_id.start_date > new Date()) {
          canEdit = true;
        }

        // Check if registration is still open (for bazaars)
        if (app.bazaar_id.type === "Bazaar" && app.bazaar_id.bazaar?.registration_deadline) {
          registrationStillOpen = app.bazaar_id.bazaar.registration_deadline > new Date();
        }
      }

      return {
        _id: app._id,
        kind: app.kind,
        status: app.status,
        booth_size: app.application?.booth_size,
        setup_duration_weeks: app.application?.setup_duration_weeks,
        booth_location: app.application?.booth_location,
        bazaar_staff: app.application?.bazaar_staff,
        booth_staff: app.application?.booth_staff,
        rejection_reason: app.rejection_reason,
        applied_at: app.createdAt,
        can_edit: canEdit,
        bazaar: app.bazaar_id ? {
          _id: app.bazaar_id._id,
          name: app.bazaar_id.name,
          type: app.bazaar_id.type,
          start_date: app.bazaar_id.start_date,
          end_date: app.bazaar_id.end_date,
          time: app.bazaar_id.time,
          location: app.bazaar_id.location,
          status: app.bazaar_id.status,
          registration_deadline: app.bazaar_id.bazaar?.registration_deadline,
          registration_still_open: registrationStillOpen,
          days_until_start: daysUntilStart
        } : null
      };
    });

    const pending = formattedApplications.filter(app => app.status === "pending");
    const rejected = formattedApplications.filter(app => app.status === "rejected");

    res.json({
      message: `${status || 'Pending and rejected'} applications retrieved successfully`,
      applications: formattedApplications,
      pending,
      rejected,
      totals: {
        pending: pending.length,
        rejected: rejected.length,
        total: formattedApplications.length
      }
    });
  } catch (error) {
    console.error('Error fetching pending/rejected applications:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all my applications
export const getMyApplications = async (req, res) => {
  try {
    const applications = await VendorApplication.find({
      vendor_user_id: req.user._id
    })
    .populate('bazaar_id', 'name start_date end_date location status type bazaar')
    .sort({ createdAt: -1 });

    const formattedApplications = applications.map(app => {
      let daysUntilStart = null;
      let registrationStillOpen = false;

      if (app.bazaar_id) {
        daysUntilStart = Math.ceil((app.bazaar_id.start_date - new Date()) / (1000 * 60 * 60 * 24));
        
        // Check if registration is still open (for bazaars)
        if (app.bazaar_id.type === "Bazaar" && app.bazaar_id.bazaar?.registration_deadline) {
          registrationStillOpen = app.bazaar_id.bazaar.registration_deadline > new Date();
        }
      }

      return {
        _id: app._id,
        kind: app.kind,
        status: app.status,
        booth_size: app.application?.booth_size,
        setup_duration_weeks: app.application?.setup_duration_weeks,
        booth_location: app.application?.booth_location,
        bazaar_staff: app.application?.bazaar_staff,
        booth_staff: app.application?.booth_staff,
        rejection_reason: app.rejection_reason,
        applied_at: app.createdAt,
        approved_at: app.approved_at,
        bazaar: app.bazaar_id ? {
          _id: app.bazaar_id._id,
          name: app.bazaar_id.name,
          type: app.bazaar_id.type,
          start_date: app.bazaar_id.start_date,
          end_date: app.bazaar_id.end_date,
          location: app.bazaar_id.location,
          status: app.bazaar_id.status,
          registration_deadline: app.bazaar_id.bazaar?.registration_deadline,
          registration_still_open: registrationStillOpen,
          days_until_start: daysUntilStart
        } : null
      };
    });

    // Group by status
    const byStatus = {
      pending: formattedApplications.filter(app => app.status === "pending"),
      accepted: formattedApplications.filter(app => app.status === "accepted"),
      rejected: formattedApplications.filter(app => app.status === "rejected")
    };

    res.json({
      message: "All applications retrieved successfully",
      applications: formattedApplications,
      by_status: byStatus,
      totals: {
        total: formattedApplications.length,
        pending: byStatus.pending.length,
        accepted: byStatus.accepted.length,
        rejected: byStatus.rejected.length
      }
    });
  } catch (error) {
    console.error('Error fetching my applications:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get specific application
export const getApplicationById = async (req, res) => {
  try {
    const application = await VendorApplication.findOne({
      _id: req.params.applicationId,
      vendor_user_id: req.user._id
    })
    .populate('bazaar_id')
    .populate('approved_by', 'first_name last_name email role');

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json({
      message: "Application details retrieved successfully",
      application
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ message: error.message });
  }
};

// Cancel application
export const cancelApplication = async (req, res) => {
  try {
    const application = await VendorApplication.findOne({
      _id: req.params.applicationId,
      vendor_user_id: req.user._id
    });

    if (!application) {
      return res.status(404).json({ 
        message: "Application not found" 
      });
    }

    // Check if application is pending
    if (application.status !== "pending") {
      return res.status(400).json({ 
        message: `Cannot cancel ${application.status} application. Only pending applications can be cancelled.` 
      });
    }

    // Check if payment has been made
    if (application.payment_status === "paid") {
      return res.status(400).json({ 
        message: "Cannot cancel application after payment has been made. Please contact support for refund requests." 
      });
    }

    application.status = "cancelled";
    await application.save();

    res.json({
      message: "Application cancelled successfully",
      application: {
        _id: application._id,
        status: application.status,
        kind: application.kind,
        cancelled_at: new Date()
      }
    });
  } catch (error) {
    console.error('Error cancelling application:', error);
    res.status(500).json({ message: error.message });
  }
};