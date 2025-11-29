import Event from "../models/Events.js";
import Registration from "../models/Registration.js";
import User from "../models/User.js";
import { generateCertificate, formatCertificateDate } from "../services/certificateService.js";
import { sendCertificateEmail } from "../services/emailService.js";
import { 
  notifyEventsOfficeWorkshopSubmitted,
  notifyProfessorWorkshopAccepted,
  notifyProfessorWorkshopRejected,
  notifyProfessorEditsRequested,
  notifyUsersNewEvent
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

    // ✅ FIX: Combine date and time properly
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const regDeadline = new Date(registration_deadline);
    
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

    const { allowed_roles } = req.body;
    
    const workshop = await Event.create({
      type: "Workshop",
      name,
      location,
      short_description,
      start_date: startDate,
      end_date: endDate,
      time,
      created_by: req.user._id,
      status: "upcoming",
      allowed_roles: Array.isArray(allowed_roles) ? allowed_roles : [],
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
        registration_deadline: regDeadline,
        approval_status: "pending"
      }
    });

    // Notify EventsOffice about new workshop submission
    try {
      await notifyEventsOfficeWorkshopSubmitted(workshop, req.user);
    } catch (notifError) {
      console.error('Failed to send notification:', notifError);
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

      // ✅ ADD THIS: Notify all users about the new workshop event
      try {
        await notifyUsersNewEvent(workshop, ['Student', 'Staff', 'TA', 'Professor', 'EventsOffice']);
        console.log('✅ All users notified about new workshop:', workshop.name);
      } catch (notifError) {
        console.error('Failed to send new workshop notifications:', notifError);
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

/**
 * Accept a workshop (set approval status to accepted)
 * PATCH /api/workshop/:id/accept
 */
export const acceptWorkshop = async (req, res) => {
  try {
    const { id } = req.params;

    const workshop = await Workshop.findById(id);
    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found" });
    }

    if (workshop.approval_status !== "pending") {
      return res.status(400).json({ 
        message: `Workshop is already ${workshop.approval_status}` 
      });
    }

    workshop.approval_status = "accepted";
    workshop.reviewed_by = req.user.userId;
    workshop.reviewed_at = new Date();
    await workshop.save();

    const event = await Event.findOne({ workshop: workshop._id })
      .populate('workshop')
      .populate('created_by', 'first_name last_name email');

    if (event) {
      event.status = "upcoming";
      await event.save();
      
      // Notify all users about the newly approved workshop
      const populatedEvent = await Event.findById(event._id)
        .populate('workshop')
        .populate('created_by', 'first_name last_name email');
      
      notifyUsersNewEvent(populatedEvent).catch(err => 
        console.error('Failed to send workshop approval notifications:', err)
      );
    }

    await notifyProfessorWorkshopAccepted(workshop);

    res.status(200).json({
      message: "Workshop accepted successfully",
      workshop
    });
  } catch (error) {
    console.error("Error accepting workshop:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
