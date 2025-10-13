import Event from "../models/Events.js";
import VendorApplication from "../models/VendorApplication.js";

// Get upcoming bazaars
export const getUpcomingBazaars = async (req, res) => {
  try {
    const bazaars = await Event.find({
      type: "Bazaar",
      status: "upcoming",
      start_date: { $gte: new Date() }
    }).sort({ start_date: 1 });

    res.json({
      message: "Upcoming bazaars retrieved successfully",
      bazaars,
      total: bazaars.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get upcoming booths
export const getUpcomingBooths = async (req, res) => {
  try {
    const booths = await Event.find({
      type: "Booth",
      status: "upcoming", 
      start_date: { $gte: new Date() }
    }).sort({ start_date: 1 });

    res.json({
      message: "Upcoming booths retrieved successfully",
      booths,
      total: booths.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Apply to bazaar
export const applyToBazaar = async (req, res) => {
  try {
    const { event_id, application } = req.body;
    
    // Validate event exists and is a bazaar
    const event = await Event.findOne({ _id: event_id, type: "Bazaar" });
    if (!event) {
      return res.status(404).json({ message: "Bazaar event not found" });
    }

    // Create application
    const vendorApp = await VendorApplication.create({
      vendor_user_id: req.user._id,
      event_id,
      kind: "bazaar",
      event_type: "Bazaar",
      application
    });

    res.status(201).json({
      message: "Bazaar application submitted successfully",
      application: vendorApp
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: "You have already applied to this bazaar" 
      });
    }
    res.status(400).json({ message: error.message });
  }
};

// Apply for booth
export const applyForBooth = async (req, res) => {
  try {
    const { event_id, application } = req.body;
    
    // Validate event exists and is a booth
    const event = await Event.findOne({ _id: event_id, type: "Booth" });
    if (!event) {
      return res.status(404).json({ message: "Booth event not found" });
    }

    // Create application
    const vendorApp = await VendorApplication.create({
      vendor_user_id: req.user._id,
      event_id,
      kind: "booth",
      event_type: "Booth", 
      application
    });

    res.status(201).json({
      message: "Booth application submitted successfully",
      application: vendorApp
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: "You have already applied to this booth" 
      });
    }
    res.status(400).json({ message: error.message });
  }
};

// Get accepted applications
export const getAcceptedApplications = async (req, res) => {
  try {
    const applications = await VendorApplication.findByVendor(
      req.user._id, 
      "accepted"
    );

    res.json({
      message: "Accepted applications retrieved successfully",
      applications,
      total: applications.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get pending and rejected applications
export const getPendingAndRejectedApplications = async (req, res) => {
  try {
    const applications = await VendorApplication.find({
      vendor_user_id: req.user._id,
      status: { $in: ["pending", "rejected"] }
    }).populate('event_id').sort({ createdAt: -1 });

    const pending = applications.filter(app => app.status === "pending");
    const rejected = applications.filter(app => app.status === "rejected");

    res.json({
      message: "Applications retrieved successfully",
      pending,
      rejected,
      totals: {
        pending: pending.length,
        rejected: rejected.length,
        total: applications.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all my applications
export const getMyApplications = async (req, res) => {
  try {
    const applications = await VendorApplication.findByVendor(req.user._id);

    res.json({
      message: "All applications retrieved successfully",
      applications,
      total: applications.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get specific application
export const getApplicationById = async (req, res) => {
  try {
    const application = await VendorApplication.findOne({
      _id: req.params.applicationId,
      vendor_user_id: req.user._id
    }).populate('event_id').populate('approved_by', 'first_name last_name');

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json({
      message: "Application details retrieved successfully",
      application
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel application
export const cancelApplication = async (req, res) => {
  try {
    const application = await VendorApplication.findOne({
      _id: req.params.applicationId,
      vendor_user_id: req.user._id,
      status: "pending"
    });

    if (!application) {
      return res.status(404).json({ 
        message: "Pending application not found" 
      });
    }

    application.status = "cancelled";
    await application.save();

    res.json({
      message: "Application cancelled successfully"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};