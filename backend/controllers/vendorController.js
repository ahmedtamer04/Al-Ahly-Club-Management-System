import Event from "../models/Events.js";
import VendorApplication from "../models/VendorApplication.js";
import VendorLoyaltyProgram from "../models/VendorLoyaltyProgram.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import Stripe from "stripe";
import { sendVendorPaymentReceipt, sendVendorAcceptanceEmail, sendVendorQRCodes } from "../services/emailService.js";

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
      payment_status: app.payment_status,
      participation_fee: app.participation_fee,
      payment_deadline: app.payment_deadline,
      payment_date: app.payment_date,
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
        payment_status: app.payment_status,
        participation_fee: app.participation_fee,
        payment_deadline: app.payment_deadline,
        payment_date: app.payment_date,
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
        participation_fee: app.participation_fee,
        payment_deadline: app.payment_deadline,
        payment_date: app.payment_date,
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

// Pay vendor application fee with wallet
export const payVendorApplicationWithWallet = async (req, res) => {
  try {
    const { application_id } = req.body;

    if (!application_id) {
      return res.status(400).json({ message: "Application ID is required" });
    }

    const application = await VendorApplication.findById(application_id)
      .populate('vendor_user_id', 'first_name last_name email wallet')
      .populate('bazaar_id', 'name location start_date');

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.vendor_user_id._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (application.status !== 'accepted') {
      return res.status(400).json({ message: "Application must be accepted before payment" });
    }

    if (application.payment_status === 'paid') {
      return res.status(400).json({ message: "Payment already completed" });
    }

    if (!application.participation_fee || application.participation_fee <= 0) {
      return res.status(400).json({ message: "No participation fee set for this application" });
    }

    // Check payment deadline
    if (application.payment_deadline && new Date() > application.payment_deadline) {
      return res.status(400).json({ 
        message: "Payment deadline has passed. Please contact support." 
      });
    }

    const user = application.vendor_user_id;
    const amount = application.participation_fee;

    // Check wallet balance
    const currentBalance = user.wallet?.balance || 0;
    if (currentBalance < amount) {
      return res.status(400).json({ 
        message: "Insufficient wallet balance",
        required: amount,
        available: currentBalance
      });
    }

    // Deduct from wallet
    if (!user.wallet) {
      user.wallet = { balance: 0, currency: 'USD', transactions: [] };
    }
    user.wallet.balance -= amount;
    user.wallet.transactions.push({
      type: 'payment',
      amount: -amount,
      description: `Vendor participation fee - ${application.kind === 'bazaar' ? application.bazaar_id?.name : 'Booth Event'}`,
      reference: application_id,
      payment_method: 'wallet',
      timestamp: new Date()
    });
    await user.save();

    // Create payment record
    const payment = await Payment.create({
      user_id: req.user._id,
      vendor_application_id: application_id,
      event_id: application.bazaar_id?._id,
      amount: amount,
      payment_method: 'wallet',
      payment_status: 'completed',
      description: `Vendor participation fee - ${application.kind === 'bazaar' ? application.bazaar_id?.name : 'Booth Event'}`,
      paid_at: new Date()
    });

    // Update application payment status
    application.payment_status = 'paid';
    application.payment_date = new Date();
    await application.save();

    // Send payment receipt email (non-blocking)
    const eventName = application.kind === 'bazaar' 
      ? application.bazaar_id?.name || 'Bazaar'
      : 'Booth Event';
    
    const locationInfo = application.kind === 'bazaar'
      ? application.bazaar_id?.location || 'TBA'
      : `${application.platform_position?.wall?.toUpperCase() || ''} Wall - Slot ${application.platform_position?.slot || 'TBA'}`;
    
    const durationInfo = application.kind === 'booth_event'
      ? `${application.duration_weeks} week(s)`
      : null;

    sendVendorPaymentReceipt(user.email, {
      userName: `${user.first_name} ${user.last_name}`,
      applicationType: application.kind === 'bazaar' ? 'Bazaar' : 'Booth Event',
      eventName: eventName,
      location: locationInfo,
      boothSize: application.application?.booth_size || 'N/A',
      duration: durationInfo,
      amount: amount,
      paymentMethod: 'wallet',
      transactionId: payment._id.toString(),
      paymentDate: payment.paid_at,
      applicationId: application_id
    }).catch(err => {
      console.error('Failed to send payment receipt email:', err);
    });

    res.json({
      success: true,
      message: "Payment successful",
      payment: payment,
      new_balance: user.wallet.balance,
      application: {
        _id: application._id,
        payment_status: application.payment_status,
        payment_date: application.payment_date
      }
    });
  } catch (error) {
    console.error('Error processing vendor payment:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create Stripe payment intent for vendor application
export const createVendorStripePayment = async (req, res) => {
  try {
    const { application_id } = req.body;

    if (!application_id) {
      return res.status(400).json({ message: "Application ID is required" });
    }

    const application = await VendorApplication.findById(application_id)
      .populate('vendor_user_id', 'first_name last_name email')
      .populate('bazaar_id', 'name location');

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.vendor_user_id._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (application.status !== 'accepted') {
      return res.status(400).json({ message: "Application must be accepted before payment" });
    }

    if (application.payment_status === 'paid') {
      return res.status(400).json({ message: "Payment already completed" });
    }

    if (!application.participation_fee || application.participation_fee <= 0) {
      return res.status(400).json({ message: "No participation fee set for this application" });
    }

    // Check payment deadline
    if (application.payment_deadline && new Date() > application.payment_deadline) {
      return res.status(400).json({ 
        message: "Payment deadline has passed. Please contact support." 
      });
    }

    const amount = application.participation_fee;

    // Initialize Stripe
    let stripe = null;
    if (process.env.STRIPE_SECRET_KEY) {
      stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }

    if (!stripe) {
      return res.status(500).json({ 
        message: "Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables." 
      });
    }

    const eventName = application.kind === 'bazaar' 
      ? application.bazaar_id?.name || 'Bazaar'
      : 'Booth Event';

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency: 'usd',
      metadata: {
        application_id: application_id,
        user_id: req.user._id.toString(),
        application_type: application.kind,
        event_name: eventName
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Create pending payment record
    const payment = await Payment.create({
      user_id: req.user._id,
      vendor_application_id: application_id,
      event_id: application.bazaar_id?._id,
      amount: amount,
      payment_method: 'stripe',
      payment_status: 'pending',
      description: `Vendor participation fee - ${eventName}`,
      stripe_payment_intent_id: paymentIntent.id,
      stripe_client_secret: paymentIntent.client_secret
    });

    res.json({
      success: true,
      message: "Payment intent created",
      client_secret: paymentIntent.client_secret,
      payment_id: payment._id,
      amount: amount
    });
  } catch (error) {
    console.error('Stripe payment error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Confirm Stripe payment for vendor application
export const confirmVendorStripePayment = async (req, res) => {
  try {
    const { payment_id, payment_intent_id } = req.body;

    if (!payment_id) {
      return res.status(400).json({ message: "Payment ID is required" });
    }

    const payment = await Payment.findById(payment_id)
      .populate('vendor_application_id');

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (!payment.vendor_application_id) {
      return res.status(400).json({ message: "Payment is not linked to a vendor application" });
    }

    const application = payment.vendor_application_id;

    // Verify payment with Stripe
    let stripe = null;
    if (process.env.STRIPE_SECRET_KEY) {
      stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }

    if (stripe && payment_intent_id) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
        
        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({ 
            message: "Payment not completed. Status: " + paymentIntent.status 
          });
        }
      } catch (stripeError) {
        console.error('Stripe verification error:', stripeError);
        return res.status(500).json({ 
          message: "Failed to verify payment with Stripe",
          error: stripeError.message 
        });
      }
    }

    // Mark payment as completed
    payment.payment_status = 'completed';
    payment.paid_at = new Date();
    await payment.save();

    // Update application payment status
    application.payment_status = 'paid';
    application.payment_date = new Date();
    await application.save();

    // Get user for email
    const user = await User.findById(req.user._id);
    
    // Populate application details
    await application.populate('bazaar_id', 'name location');
    await application.populate('vendor_user_id', 'first_name last_name email');

    // Send payment receipt email (non-blocking)
    const eventName = application.kind === 'bazaar' 
      ? application.bazaar_id?.name || 'Bazaar'
      : 'Booth Event';
    
    const locationInfo = application.kind === 'bazaar'
      ? application.bazaar_id?.location || 'TBA'
      : `${application.platform_position?.wall?.toUpperCase() || ''} Wall - Slot ${application.platform_position?.slot || 'TBA'}`;
    
    const durationInfo = application.kind === 'booth_event'
      ? `${application.duration_weeks} week(s)`
      : null;

    sendVendorPaymentReceipt(user.email, {
      userName: `${user.first_name} ${user.last_name}`,
      applicationType: application.kind === 'bazaar' ? 'Bazaar' : 'Booth Event',
      eventName: eventName,
      location: locationInfo,
      boothSize: application.application?.booth_size || 'N/A',
      duration: durationInfo,
      amount: payment.amount,
      paymentMethod: 'stripe',
      transactionId: payment_intent_id || payment._id.toString(),
      paymentDate: payment.paid_at,
      applicationId: application._id.toString()
    }).catch(err => {
      console.error('Failed to send payment receipt email:', err);
    });

    res.json({
      success: true,
      message: "Payment confirmed successfully",
      payment: payment,
      application: {
        _id: application._id,
        payment_status: application.payment_status,
        payment_date: application.payment_date
      }
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get payment info for accepted applications (works for both bazaar and booth_event)
export const getVendorPaymentInfo = async (req, res) => {
  try {
    const { application_id } = req.params;

    const application = await VendorApplication.findById(application_id)
      .populate('bazaar_id', 'name location start_date')
      .populate('vendor_user_id', 'first_name last_name email');

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.vendor_user_id._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (application.status !== 'accepted') {
      return res.status(400).json({ message: "Application must be accepted to view payment info" });
    }

    // Ensure participation_fee and payment_deadline are set (should be set during approval, but double-check)
    if (!application.participation_fee || application.participation_fee <= 0) {
      // If fee not set, calculate it based on booth size (for both bazaar and booth_event)
      const feeMap = {
        '2x2': 150,
        '4x4': 400
      };
      application.participation_fee = feeMap[application.application?.booth_size] || 150;
    }

    if (!application.payment_deadline) {
      // Set payment deadline: 3 days from approval date or current date
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 3);
      application.payment_deadline = deadline;
      await application.save();
    }

    // Get payment if exists
    const payment = await Payment.findOne({ vendor_application_id: application_id })
      .sort({ createdAt: -1 });

    const locationInfo = application.kind === 'bazaar'
      ? application.bazaar_id?.location || 'TBA'
      : `${application.platform_position?.wall?.toUpperCase() || ''} Wall - Slot ${application.platform_position?.slot || 'TBA'}`;
    
    const durationInfo = application.kind === 'booth_event'
      ? `${application.duration_weeks} week(s)`
      : null;

    const eventName = application.kind === 'bazaar' 
      ? application.bazaar_id?.name || 'Bazaar'
      : 'Booth Event';

    res.json({
      application: {
        _id: application._id,
        kind: application.kind,
        status: application.status,
        payment_status: application.payment_status,
        participation_fee: application.participation_fee,
        payment_deadline: application.payment_deadline,
        payment_date: application.payment_date,
        event_name: eventName,
        location: locationInfo,
        booth_size: application.application?.booth_size,
        duration: durationInfo
      },
      payment: payment ? {
        _id: payment._id,
        amount: payment.amount,
        payment_method: payment.payment_method,
        payment_status: payment.payment_status,
        paid_at: payment.paid_at
      } : null,
      days_until_deadline: application.payment_deadline 
        ? Math.ceil((application.payment_deadline - new Date()) / (1000 * 60 * 60 * 24))
        : null,
      is_deadline_passed: application.payment_deadline 
        ? new Date() > application.payment_deadline
        : false
    });
  } catch (error) {
    console.error('Error fetching payment info:', error);
    res.status(500).json({ message: error.message });
  }
};

// Send QR codes for registered visitors (works for both bazaar and booth_event applications)
// Can be called manually by vendor after payment is completed
export const sendQRCodesToVendor = async (req, res) => {
  try {
    const { application_id } = req.params;

    const application = await VendorApplication.findById(application_id)
      .populate('vendor_user_id', 'first_name last_name email')
      .populate('bazaar_id', 'name location');

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.status !== 'accepted') {
      return res.status(400).json({ message: "Application must be accepted to send QR codes" });
    }

    // Get event ID (either from bazaar_id or find created booth event)
    // Works for both bazaar and booth_event applications
    let eventId = application.bazaar_id?._id;
    
    if (!eventId && application.kind === 'booth_event') {
      // Find the created booth event for booth_event applications
      const boothEvent = await Event.findOne({
        type: 'Booth',
        'booth.vendors.vendor_id': application.vendor_user_id._id
      }).sort({ createdAt: -1 });
      
      if (boothEvent) {
        eventId = boothEvent._id;
      }
    }

    if (!eventId) {
      return res.status(400).json({ 
        message: "No associated event found for this application. Please ensure the event exists." 
      });
    }

    // Get all registrations for this event
    const registrations = await Registration.find({
      event_id: eventId,
      status: 'registered'
    }).populate('user_id', 'first_name last_name email');

    if (registrations.length === 0) {
      return res.status(400).json({ 
        message: "No registered visitors found for this event",
        visitors_count: 0
      });
    }

    // Prepare visitor data for QR codes
    const visitors = registrations.map(reg => ({
      registration_id: reg._id.toString(),
      name: reg.name || `${reg.user_id?.first_name || ''} ${reg.user_id?.last_name || ''}`.trim(),
      email: reg.email || reg.user_id?.email || '',
      vendor_application_id: application_id
    }));

    const eventName = application.kind === 'bazaar' 
      ? application.bazaar_id?.name || 'Bazaar'
      : 'Booth Event';
    
    const locationInfo = application.kind === 'bazaar'
      ? application.bazaar_id?.location || 'TBA'
      : `${application.platform_position?.wall?.toUpperCase() || ''} Wall - Slot ${application.platform_position?.slot || 'TBA'}`;

    // Send QR codes email (non-blocking)
    sendVendorQRCodes(application.vendor_user_id.email, {
      userName: `${application.vendor_user_id.first_name} ${application.vendor_user_id.last_name}`,
      applicationType: application.kind === 'bazaar' ? 'Bazaar' : 'Booth Event',
      eventName: eventName,
      location: locationInfo,
      visitors: visitors
    }).catch(err => {
      console.error('Failed to send QR codes email:', err);
    });

    res.json({
      success: true,
      message: `QR codes sent to vendor for ${visitors.length} registered visitor(s)`,
      visitors_count: visitors.length,
      event_name: eventName
    });
  } catch (error) {
    console.error('Error sending QR codes:', error);
    res.status(500).json({ message: error.message });
  }
};

// Apply to GUC Loyalty Program
export const applyToLoyaltyProgram = async (req, res) => {
  try {
    const { discount_rate, promo_code, terms_and_conditions } = req.body;

    // Validate required fields
    if (!discount_rate || !promo_code || !terms_and_conditions) {
      return res.status(400).json({ 
        message: "Discount rate, promo code, and terms & conditions are required" 
      });
    }

    // Validate discount rate
    if (typeof discount_rate !== 'number' || discount_rate < 0 || discount_rate > 100) {
      return res.status(400).json({ 
        message: "Discount rate must be a number between 0 and 100" 
      });
    }

    // Validate promo code format
    const promoCodeRegex = /^[A-Z0-9]{4,20}$/;
    if (!promoCodeRegex.test(promo_code.toUpperCase())) {
      return res.status(400).json({ 
        message: "Promo code must be 4-20 alphanumeric characters" 
      });
    }

    // Validate terms and conditions length
    if (terms_and_conditions.trim().length === 0 || terms_and_conditions.length > 2000) {
      return res.status(400).json({ 
        message: "Terms and conditions must be between 1 and 2000 characters" 
      });
    }

    // Check if vendor already has a loyalty program application
    const existingApplication = await VendorLoyaltyProgram.findOne({
      vendor_user_id: req.user._id
    });

    if (existingApplication) {
      if (existingApplication.status === 'pending') {
        return res.status(400).json({ 
          message: "You already have a pending loyalty program application",
          application: {
            _id: existingApplication._id,
            status: existingApplication.status,
            applied_at: existingApplication.applied_at
          }
        });
      }
      
      if (existingApplication.status === 'active') {
        return res.status(400).json({ 
          message: "You are already participating in the GUC Loyalty Program",
          application: {
            _id: existingApplication._id,
            status: existingApplication.status,
            promo_code: existingApplication.promo_code,
            discount_rate: existingApplication.discount_rate
          }
        });
      }
    }

    // Check if promo code is already taken
    const promoCodeExists = await VendorLoyaltyProgram.findOne({
      promo_code: promo_code.toUpperCase(),
      status: { $in: ['pending', 'active'] }
    });

    if (promoCodeExists) {
      return res.status(400).json({ 
        message: "This promo code is already taken. Please choose a different one." 
      });
    }

    // Create new loyalty program application
    const loyaltyApplication = new VendorLoyaltyProgram({
      vendor_user_id: req.user._id,
      discount_rate: discount_rate,
      promo_code: promo_code.toUpperCase(),
      terms_and_conditions: terms_and_conditions.trim(),
      status: 'pending'
    });

    await loyaltyApplication.save();

    await loyaltyApplication.populate('vendor_user_id', 'first_name last_name email vendor_info');

    res.status(201).json({
      message: "Loyalty program application submitted successfully",
      application: {
        _id: loyaltyApplication._id,
        status: loyaltyApplication.status,
        discount_rate: loyaltyApplication.discount_rate,
        promo_code: loyaltyApplication.promo_code,
        applied_at: loyaltyApplication.applied_at
      }
    });
  } catch (error) {
    console.error('Error applying to loyalty program:', error);
    
    if (error.code === 11000) {
      if (error.keyPattern?.vendor_user_id) {
        return res.status(409).json({ 
          message: "You already have a loyalty program application" 
        });
      }
      if (error.keyPattern?.promo_code) {
        return res.status(409).json({ 
          message: "This promo code is already taken. Please choose a different one." 
        });
      }
    }

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

// Get vendor's loyalty program status
export const getLoyaltyProgramStatus = async (req, res) => {
  try {
    const loyaltyProgram = await VendorLoyaltyProgram.findOne({
      vendor_user_id: req.user._id
    })
    .populate('approved_by', 'first_name last_name email role');

    if (!loyaltyProgram) {
      return res.json({
        message: "No loyalty program application found",
        has_application: false,
        application: null
      });
    }

    res.json({
      message: "Loyalty program status retrieved successfully",
      has_application: true,
      application: {
        _id: loyaltyProgram._id,
        status: loyaltyProgram.status,
        discount_rate: loyaltyProgram.discount_rate,
        promo_code: loyaltyProgram.promo_code,
        terms_and_conditions: loyaltyProgram.terms_and_conditions,
        applied_at: loyaltyProgram.applied_at,
        approved_at: loyaltyProgram.approved_at,
        cancelled_at: loyaltyProgram.cancelled_at,
        cancellation_reason: loyaltyProgram.cancellation_reason,
        approved_by: loyaltyProgram.approved_by ? {
          name: `${loyaltyProgram.approved_by.first_name} ${loyaltyProgram.approved_by.last_name}`,
          email: loyaltyProgram.approved_by.email,
          role: loyaltyProgram.approved_by.role
        } : null,
        created_at: loyaltyProgram.createdAt,
        updated_at: loyaltyProgram.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching loyalty program status:', error);
    res.status(500).json({ message: error.message });
  }
};

// Cancel loyalty program participation (works for both pending and active statuses)
export const cancelLoyaltyProgram = async (req, res) => {
  try {
    const { cancellation_reason } = req.body;

    const loyaltyProgram = await VendorLoyaltyProgram.findOne({
      vendor_user_id: req.user._id,
      status: { $in: ['active', 'pending'] } // Allow cancellation for both active and pending
    });

    if (!loyaltyProgram) {
      return res.status(404).json({ 
        message: "No active or pending loyalty program application found. Only active or pending applications can be cancelled." 
      });
    }

    // Store the original status before cancellation
    const originalStatus = loyaltyProgram.status;

    // Cancel the participation (works for both pending and active)
    await loyaltyProgram.cancel(cancellation_reason);

    const actionMessage = originalStatus === 'pending' 
      ? "Loyalty program application withdrawn successfully"
      : "Loyalty program participation cancelled successfully";

    res.json({
      message: actionMessage,
      application: {
        _id: loyaltyProgram._id,
        status: loyaltyProgram.status,
        cancelled_at: loyaltyProgram.cancelled_at,
        cancellation_reason: loyaltyProgram.cancellation_reason
      }
    });
  } catch (error) {
    console.error('Error cancelling loyalty program:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all active loyalty program vendors (Public - for Students, Staff, TA, Professor, EventsOffice, Admin)
export const getAllLoyaltyProgramVendors = async (req, res) => {
  try {
    const loyaltyPrograms = await VendorLoyaltyProgram.find({
      status: 'active'
    })
    .populate('vendor_user_id', 'first_name last_name email vendor_info')
    .sort({ approved_at: -1 }); // Sort by most recently approved first

    const vendors = loyaltyPrograms.map(lp => ({
      _id: lp._id,
      vendor: {
        _id: lp.vendor_user_id._id,
        name: lp.vendor_user_id.vendor_info?.company_name || 
              `${lp.vendor_user_id.first_name} ${lp.vendor_user_id.last_name}`,
        email: lp.vendor_user_id.email,
        company_name: lp.vendor_user_id.vendor_info?.company_name || null
      },
      discount_rate: lp.discount_rate,
      promo_code: lp.promo_code,
      terms_and_conditions: lp.terms_and_conditions,
      approved_at: lp.approved_at,
      created_at: lp.createdAt
    }));

    res.json({
      success: true,
      message: "Loyalty program vendors retrieved successfully",
      count: vendors.length,
      vendors: vendors
    });
  } catch (error) {
    console.error('Error fetching loyalty program vendors:', error);
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