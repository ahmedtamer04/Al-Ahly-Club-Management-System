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
    const { 
      attendees, 
      booth_size, 
      duration_weeks, 
      platform_position, 
      preferred_start_date, 
      notes,
      business_name,
      business_type,
      business_description,
      products_offered,
      contact_phone,
      contact_email
    } = req.body;

    // Validate required fields
    if (!attendees || !booth_size || !duration_weeks || !platform_position || !preferred_start_date) {
      return res.status(400).json({
        message: "Attendees, booth size, duration, platform position, and start date are required"
      });
    }

    // Validate booth size
    if (!["2x2", "4x4"].includes(booth_size)) {
      return res.status(400).json({ 
        message: "Booth size must be either 2x2 or 4x4" 
      });
    }

    // Validate duration
    if (!Number.isInteger(duration_weeks) || duration_weeks < 1 || duration_weeks > 4) {
      return res.status(400).json({ 
        message: "Duration must be between 1 and 4 weeks" 
      });
    }

    // Validate attendees array
    if (!Array.isArray(attendees) || attendees.length === 0 || attendees.length > 5) {
      return res.status(400).json({ 
        message: "Attendees must be an array with 1 to 5 members" 
      });
    }

    // Validate each attendee has name and email
    for (const attendee of attendees) {
      if (!attendee.name || !attendee.email) {
        return res.status(400).json({ 
          message: "Each attendee must have both name and email" 
        });
      }
      // Basic email validation
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(attendee.email)) {
        return res.status(400).json({ 
          message: `Invalid email format for attendee: ${attendee.name}` 
        });
      }
    }

    // Validate platform position
    if (!platform_position.wall || !platform_position.slot) {
      return res.status(400).json({ 
        message: "Platform position must include wall and slot" 
      });
    }

    if (!["north", "south", "east", "west"].includes(platform_position.wall)) {
      return res.status(400).json({ 
        message: "Platform wall must be one of: north, south, east, west" 
      });
    }

    if (!Number.isInteger(platform_position.slot) || platform_position.slot < 1 || platform_position.slot > 6) {
      return res.status(400).json({ 
        message: "Platform slot must be between 1 and 6" 
      });
    }

    // Validate preferred start date
    const startDate = new Date(preferred_start_date);
    if (startDate <= new Date()) {
      return res.status(400).json({ 
        message: "Preferred start date must be in the future" 
      });
    }

    // Check if position is already taken for the requested period
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (duration_weeks * 7));

    const conflictingBooking = await VendorApplication.findOne({
      kind: "booth_event",
      status: "accepted",
      'platform_position.wall': platform_position.wall,
      'platform_position.slot': platform_position.slot,
      preferred_start_date: { $lte: endDate },
      $expr: {
        $gte: [
          {
            $add: [
              "$preferred_start_date",
              { $multiply: ["$duration_weeks", 7 * 24 * 60 * 60 * 1000] }
            ]
          },
          startDate
        ]
      }
    });

    if (conflictingBooking) {
      return res.status(400).json({ 
        message: "This booth position is already booked for the selected period" 
      });
    }

    // Create booth event application
    const application = new VendorApplication({
      vendor_user_id: req.user._id,
      kind: "booth_event",
      business_name: business_name,
      business_type: business_type,
      business_description: business_description,
      products_offered: products_offered,
      contact_phone: contact_phone,
      contact_email: contact_email,
      application: {
        booth_staff: attendees,
        booth_size: booth_size,
        setup_duration_weeks: duration_weeks,
        notes: notes
      },
      platform_position: platform_position,
      duration_weeks: duration_weeks,
      preferred_start_date: startDate
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
        duration_weeks: application.duration_weeks,
        platform_position: application.platform_position,
        staff_count: application.application.booth_staff.length,
        preferred_start_date: application.preferred_start_date,
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
        payment_status: app.payment_status,
        // Business information (for booth events)
        business_name: app.business_name,
        business_type: app.business_type,
        business_description: app.business_description,
        products_offered: app.products_offered,
        contact_phone: app.contact_phone,
        contact_email: app.contact_email,
        // Booth details
        booth_size: app.application?.booth_size,
        setup_duration_weeks: app.application?.setup_duration_weeks,
        booth_location: app.application?.booth_location,
        // Platform position (for booth events)
        platform_position: app.platform_position,
        duration_weeks: app.duration_weeks,
        preferred_start_date: app.preferred_start_date,
        // Staff/attendees
        bazaar_staff: app.application?.bazaar_staff,
        booth_staff: app.application?.booth_staff,
        notes: app.application?.notes,
        // Status info
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

// Get booth availability for platform map
export const getBoothAvailability = async (req, res) => {
  try {
    const { start_date, duration_weeks } = req.query;

    if (!start_date || !duration_weeks) {
      return res.status(400).json({ 
        message: "Start date and duration are required" 
      });
    }

    const startDate = new Date(start_date);
    const durationWeeks = parseInt(duration_weeks);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (durationWeeks * 7));

    // Find all accepted booth applications that overlap with the requested period
    const occupiedBooths = await VendorApplication.find({
      kind: "booth_event",
      status: "accepted",
      // Check for date overlap
      preferred_start_date: { $lte: endDate },
      // Calculate end date from start date + duration
      $expr: {
        $gte: [
          {
            $add: [
              "$preferred_start_date",
              { $multiply: ["$duration_weeks", 7 * 24 * 60 * 60 * 1000] }
            ]
          },
          startDate
        ]
      }
    }).select('platform_position');

    // Extract occupied positions
    const occupied = occupiedBooths
      .filter(booth => booth.platform_position && booth.platform_position.side && booth.platform_position.slot)
      .map(booth => ({
        side: booth.platform_position.side,
        slot: booth.platform_position.slot
      }));

    res.json({
      message: "Booth availability retrieved successfully",
      occupied_positions: occupied,
      total_occupied: occupied.length
    });
  } catch (error) {
    console.error('Error fetching booth availability:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all vendor applications (Admin only - should be added to admin routes)
export const getAllVendorApplications = async (req, res) => {
  try {
    console.log('Fetching all vendor applications from database...');
    
    const { status, kind, page = 1, limit = 50 } = req.query;
    
    // Build filter object
    let filter = {};
    
    if (status && ['pending', 'accepted', 'rejected', 'cancelled'].includes(status)) {
      filter.status = status;
    }
    
    if (kind && ['bazaar', 'booth_event'].includes(kind)) {
      filter.kind = kind;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch all vendor applications with populated vendor and bazaar details
    const applications = await VendorApplication.find(filter)
      .populate('vendor_user_id', 'first_name last_name email vendor_info role contact_phone')
      .populate('bazaar_id', 'name type location start_date end_date time status')
      .populate('approved_by', 'first_name last_name email role')
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalCount = await VendorApplication.countDocuments(filter);

    console.log(`Found ${applications.length} vendor applications (${totalCount} total)`);

    // Format the applications with full details
    const formattedApplications = applications.map(app => {
      const vendor = app.vendor_user_id ? {
        _id: app.vendor_user_id._id,
        name: `${app.vendor_user_id.first_name || 'Unknown'} ${app.vendor_user_id.last_name || 'Vendor'}`,
        email: app.vendor_user_id.email || 'N/A',
        company_name: app.vendor_user_id.vendor_info?.company_name || 'N/A',
        role: app.vendor_user_id.role || 'Vendor',
        contact_phone: app.vendor_user_id.contact_phone || 'N/A'
      } : {
        _id: null,
        name: 'Unknown Vendor',
        email: 'N/A',
        company_name: 'N/A',
        role: 'Vendor',
        contact_phone: 'N/A'
      };

      let daysUntilStart = null;
      if (app.bazaar_id) {
        daysUntilStart = Math.ceil((app.bazaar_id.start_date - new Date()) / (1000 * 60 * 60 * 24));
      } else if (app.preferred_start_date) {
        daysUntilStart = Math.ceil((app.preferred_start_date - new Date()) / (1000 * 60 * 60 * 24));
      }

      return {
        _id: app._id,
        vendor,
        kind: app.kind,
        status: app.status,
        payment_status: app.payment_status,
        // Business information (for booth events)
        business_name: app.business_name,
        business_type: app.business_type,
        business_description: app.business_description,
        products_offered: app.products_offered,
        contact_phone: app.contact_phone,
        contact_email: app.contact_email,
        // Booth details
        booth_size: app.application?.booth_size,
        setup_duration_weeks: app.application?.setup_duration_weeks,
        booth_location: app.application?.booth_location,
        // Platform position (for booth events)
        platform_position: app.platform_position,
        duration_weeks: app.duration_weeks,
        preferred_start_date: app.preferred_start_date,
        // Staff/attendees
        staff: app.application?.bazaar_staff || app.application?.booth_staff || [],
        staff_count: (app.application?.bazaar_staff || app.application?.booth_staff || []).length,
        notes: app.application?.notes,
        // Bazaar details (if applicable)
        bazaar: app.bazaar_id ? {
          _id: app.bazaar_id._id,
          name: app.bazaar_id.name,
          type: app.bazaar_id.type,
          start_date: app.bazaar_id.start_date,
          end_date: app.bazaar_id.end_date,
          location: app.bazaar_id.location,
          time: app.bazaar_id.time,
          status: app.bazaar_id.status,
          days_until_start: daysUntilStart
        } : null,
        // Status info
        rejection_reason: app.rejection_reason,
        approved_by: app.approved_by ? {
          name: `${app.approved_by.first_name} ${app.approved_by.last_name}`,
          email: app.approved_by.email,
          role: app.approved_by.role
        } : null,
        approved_at: app.approved_at,
        applied_at: app.createdAt,
        updated_at: app.updatedAt,
        days_until_start: daysUntilStart
      };
    });

    // Calculate statistics
    const stats = {
      total: totalCount,
      pending: await VendorApplication.countDocuments({ ...filter, status: 'pending' }),
      accepted: await VendorApplication.countDocuments({ ...filter, status: 'accepted' }),
      rejected: await VendorApplication.countDocuments({ ...filter, status: 'rejected' }),
      cancelled: await VendorApplication.countDocuments({ ...filter, status: 'cancelled' }),
      bazaar_applications: await VendorApplication.countDocuments({ ...filter, kind: 'bazaar' }),
      booth_applications: await VendorApplication.countDocuments({ ...filter, kind: 'booth_event' })
    };

    res.json({
      message: "All vendor applications retrieved successfully",
      applications: formattedApplications,
      stats,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(totalCount / parseInt(limit)),
        total_count: totalCount,
        limit: parseInt(limit)
      },
      filters_applied: {
        status: status || 'all',
        kind: kind || 'all'
      }
    });

  } catch (error) {
    console.error('Error fetching all vendor applications:', error);
    res.status(500).json({ 
      message: "Server error while fetching vendor applications.", 
      error: error.message 
    });
  }
};