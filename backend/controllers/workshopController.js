import Event from "../models/Events.js";
import Registration from "../models/Registration.js";
import { generateCertificate, formatCertificateDate } from "../services/certificateService.js";
import { sendCertificateEmail } from "../services/emailService.js";

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
