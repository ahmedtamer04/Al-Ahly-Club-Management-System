import Event from "../models/Events.js";
import Registration from "../models/Registration.js";
import User from "../models/User.js";
import { generateCertificate, formatCertificateDate } from "../services/certificateService.js";
import { sendCertificateEmail } from "../services/emailService.js";
import { 
  notifyEventsOfficeWorkshopSubmitted,
  notifyProfessorWorkshopAccepted,
  notifyProfessorWorkshopRejected,
  notifyProfessorEditsRequested
} from "../services/notificationService.js";

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
        professors_participating: Array.isArray(professors_participating) 
          ? professors_participating 
          : professors_participating.split(',').map(p => p.trim()).filter(p => p.length > 0),
        required_budget: Number(required_budget),
        funding_source,
        extra_resources,
        capacity: Number(capacity),
        registration_deadline: new Date(registration_deadline),
        approval_status: "pending" // New workshops need approval
      }
    });

    // Notify EventsOffice about new workshop submission
    try {
      await notifyEventsOfficeWorkshopSubmitted(workshop, req.user);
    } catch (notifError) {
      console.error('Failed to send notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      message: "Workshop created successfully and submitted for review",
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
        
        // Special handling for professors_participating - convert string to array
        if (field === 'professors_participating' && typeof updates[field] === 'string') {
          updates.workshop[field] = updates[field].split(',').map(p => p.trim()).filter(p => p.length > 0);
        } else {
          updates.workshop[field] = updates[field];
        }
        
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

/**
 * Get pending workshops for EventsOffice review
 * GET /api/workshop/pending
 */
export const getPendingWorkshops = async (req, res) => {
  try {
    const pendingWorkshops = await Event.find({
      type: "Workshop",
      // Include both newly submitted and those that have requested revisions
      "workshop.approval_status": { $in: ["pending", "revision_requested"] }
    })
    .populate('created_by', 'first_name last_name email')
    .sort({ createdAt: -1 });

    res.json({
      message: "Pending workshops retrieved successfully",
      workshops: pendingWorkshops,
      total: pendingWorkshops.length
    });

  } catch (err) {
    console.error('Error fetching pending workshops:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Review a workshop (accept/reject/request edits)
 * PATCH /api/workshop/:id/review
 */
export const reviewWorkshop = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejection_reason, requested_edits } = req.body;

    // Validate action
    if (!['accept', 'reject', 'request_edits'].includes(action)) {
      return res.status(400).json({
        message: "Invalid action. Must be 'accept', 'reject', or 'request_edits'"
      });
    }

    const workshop = await Event.findOne({
      _id: id,
      type: "Workshop"
    }).populate('created_by', 'first_name last_name email');

    if (!workshop) {
      return res.status(404).json({
        message: "Workshop not found"
      });
    }

    if (workshop.workshop.approval_status !== 'pending' && workshop.workshop.approval_status !== 'revision_requested') {
      return res.status(400).json({
        message: `Cannot review workshop. Current status: ${workshop.workshop.approval_status}`
      });
    }

    // Update workshop based on action
    if (action === 'accept') {
      workshop.workshop.approval_status = 'accepted';
      workshop.workshop.reviewed_by = req.user._id;
      workshop.workshop.reviewed_at = new Date();
      workshop.workshop.requested_edits = undefined;
      workshop.workshop.rejection_reason = undefined;

      await workshop.save();

      // Notify professor about acceptance
      try {
        await notifyProfessorWorkshopAccepted(workshop, req.user);
      } catch (notifError) {
        console.error('Failed to send acceptance notification:', notifError);
      }

      res.json({
        message: "Workshop accepted and published successfully",
        workshop
      });

    } else if (action === 'reject') {
      if (!rejection_reason || rejection_reason.trim().length === 0) {
        return res.status(400).json({
          message: "Rejection reason is required"
        });
      }

      workshop.workshop.approval_status = 'rejected';
      workshop.workshop.rejection_reason = rejection_reason.trim();
      workshop.workshop.reviewed_by = req.user._id;
      workshop.workshop.reviewed_at = new Date();
      workshop.workshop.requested_edits = undefined;

      await workshop.save();

      // Notify professor about rejection
      try {
        await notifyProfessorWorkshopRejected(workshop, req.user, rejection_reason);
      } catch (notifError) {
        console.error('Failed to send rejection notification:', notifError);
      }

      res.json({
        message: "Workshop rejected",
        workshop
      });

    } else if (action === 'request_edits') {
      if (!requested_edits || requested_edits.trim().length === 0) {
        return res.status(400).json({
          message: "Requested edits description is required"
        });
      }

      workshop.workshop.approval_status = 'revision_requested';
      workshop.workshop.requested_edits = requested_edits.trim();
      workshop.workshop.reviewed_by = req.user._id;
      workshop.workshop.reviewed_at = new Date();
      workshop.workshop.rejection_reason = undefined;

      await workshop.save();

      // Notify professor about requested edits
      try {
        await notifyProfessorEditsRequested(workshop, req.user, requested_edits);
      } catch (notifError) {
        console.error('Failed to send edit request notification:', notifError);
      }

      res.json({
        message: "Edit request sent to professor",
        workshop
      });
    }

  } catch (err) {
    console.error('Error reviewing workshop:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get workshop participants list
 * GET /api/workshop/:id/participants
 */
export const getWorkshopParticipants = async (req, res) => {
  try {
    const { id } = req.params;

    const workshop = await Event.findOne({
      _id: id,
      type: "Workshop",
      created_by: req.user._id  // Ensure professor can only see their own workshops
    });

    if (!workshop) {
      return res.status(404).json({
        message: "Workshop not found or you don't have permission to view it"
      });
    }

    // Get all registered participants
    const registrations = await Registration.find({
      event_id: id,
      status: 'registered'
    })
    .populate('user_id', 'first_name last_name email role id_number')
    .sort({ createdAt: 1 });

    const capacity = workshop.workshop.capacity || 0;
    const registered = registrations.length;
    const remaining = Math.max(0, capacity - registered);

    res.json({
      message: "Workshop participants retrieved successfully",
      workshop: {
        _id: workshop._id,
        name: workshop.name,
        capacity: capacity,
        start_date: workshop.start_date,
        end_date: workshop.end_date,
        location: workshop.location
      },
      participants: registrations.map(reg => ({
        _id: reg._id,
        name: `${reg.user_id.first_name} ${reg.user_id.last_name}`,
        email: reg.user_id.email,
        role: reg.user_id.role,
        id_number: reg.user_id.id_number,
        registered_at: reg.createdAt,
        payment_status: reg.payment_status
      })),
      stats: {
        capacity: capacity,
        registered: registered,
        remaining: remaining,
        percentage_filled: capacity > 0 ? Math.round((registered / capacity) * 100) : 0
      }
    });

  } catch (err) {
    console.error('Error fetching workshop participants:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Mark workshop as completed and automatically send certificates to all participants
 * PATCH /api/workshop/:id/complete
 */
export const completeWorkshop = async (req, res) => {
  try {
    const workshop = await Event.findOne({ 
      _id: req.params.id, 
      type: "Workshop"
    });

    if (!workshop) {
      return res.status(404).json({ 
        message: 'Workshop not found' 
      });
    }

    // Optional: Check if workshop has ended (can be overridden with force parameter)
    const force = req.query.force === 'true' || req.body.force === true;
    const now = new Date();
    
    if (!force && workshop.end_date > now) {
      return res.status(400).json({ 
        message: "Cannot complete workshop - end date has not been reached yet. Use force=true to override.",
        end_date: workshop.end_date,
        current_date: now,
        hint: "Add ?force=true to the request to send certificates anyway"
      });
    }

    // Update workshop status to completed
    workshop.status = 'completed';
    await workshop.save();

    // Get all eligible registrations for certificate
    const registrations = await Registration.find({
      event_id: workshop._id,
      status: 'registered',
      payment_status: { $in: ['paid', 'free'] }
    }).populate('user_id');

    // Filter for allowed roles (Student, Staff, TA, Professor)
    const allowedRoles = ['Student', 'Staff', 'TA', 'Professor'];
    const eligibleRegistrations = registrations.filter(reg => 
      allowedRoles.includes(reg.user_id.role)
    );

    // Issue certificates to all eligible participants
    const certificateResults = {
      success: [],
      failed: []
    };

    for (const registration of eligibleRegistrations) {
      try {
        const certificateData = {
          userName: `${registration.user_id.first_name} ${registration.user_id.last_name}`,
          workshopName: workshop.name,
          workshopDate: formatCertificateDate(workshop.start_date),
          issueDate: formatCertificateDate(new Date()),
          certificateId: `CERT-${registration._id.toString().slice(-8).toUpperCase()}`
        };

        // Generate PDF certificate
        const pdfBuffer = await generateCertificate(certificateData);
        
        // Send certificate via email
        await sendCertificateEmail(
          registration.user_id.email,
          certificateData,
          pdfBuffer
        );

        certificateResults.success.push({
          userName: certificateData.userName,
          email: registration.user_id.email,
          certificateId: certificateData.certificateId
        });

        console.log(`✅ Certificate sent to ${registration.user_id.email}`);

      } catch (error) {
        console.error(`❌ Failed to send certificate to ${registration.user_id.email}:`, error);
        certificateResults.failed.push({
          userName: `${registration.user_id.first_name} ${registration.user_id.last_name}`,
          email: registration.user_id.email,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: force 
        ? "Workshop marked as completed (forced - end date not reached yet)"
        : "Workshop marked as completed",
      force_mode: force,
      workshop: {
        _id: workshop._id,
        name: workshop.name,
        status: workshop.status,
        end_date: workshop.end_date,
        current_date: now
      },
      certificates: {
        total: eligibleRegistrations.length,
        sent: certificateResults.success.length,
        failed: certificateResults.failed.length,
        details: certificateResults
      }
    });

  } catch (err) {
    console.error('Error completing workshop:', err);
    res.status(500).json({ message: err.message });
  }
};
