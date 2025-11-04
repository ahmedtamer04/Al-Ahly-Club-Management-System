import Registration from "../models/Registration.js";
import Event from "../models/Events.js";
import User from "../models/User.js";
import { generateCertificate, formatCertificateDate } from "../services/certificateService.js";
import { sendCertificateEmail } from "../services/emailService.js";

/**
 * Issue certificate for a completed workshop
 * POST /api/certificates/issue/:registrationId
 */
export const issueCertificate = async (req, res) => {
  try {
    const { registrationId } = req.params;

    // Get registration with populated event and user
    const registration = await Registration.findById(registrationId)
      .populate('event_id')
      .populate('user_id');

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // Verify this is a workshop
    if (registration.event_id.type !== 'Workshop') {
      return res.status(400).json({ 
        message: "Certificates are only issued for workshops" 
      });
    }

    // Verify workshop is completed
    if (registration.event_id.status !== 'completed') {
      return res.status(400).json({ 
        message: "Cannot issue certificate - workshop is not yet completed" 
      });
    }

    // Verify registration is paid/free (not pending or canceled)
    if (registration.payment_status === 'pending') {
      return res.status(400).json({ 
        message: "Cannot issue certificate - payment is pending" 
      });
    }

    if (registration.status === 'canceled') {
      return res.status(400).json({ 
        message: "Cannot issue certificate - registration was canceled" 
      });
    }

    // Verify user is Student, Staff, TA, or Professor
    const userRole = registration.user_id.role;
    const allowedRoles = ['Student', 'Staff', 'TA', 'Professor'];
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: "Certificates are only issued to Students, Staff, TAs, and Professors" 
      });
    }

    // Prepare certificate data
    const certificateData = {
      userName: `${registration.user_id.first_name} ${registration.user_id.last_name}`,
      workshopName: registration.event_id.name,
      workshopDate: formatCertificateDate(registration.event_id.start_date),
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

    res.json({
      success: true,
      message: "Certificate issued and sent via email successfully",
      certificateData: {
        userName: certificateData.userName,
        workshopName: certificateData.workshopName,
        certificateId: certificateData.certificateId,
        email: registration.user_id.email
      }
    });

  } catch (error) {
    console.error('Certificate issuance error:', error);
    res.status(500).json({ 
      message: "Failed to issue certificate", 
      error: error.message 
    });
  }
};

/**
 * Batch issue certificates for all participants of a completed workshop
 * POST /api/certificates/batch-issue/:eventId
 */
export const batchIssueCertificates = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Get the event
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Verify this is a workshop
    if (event.type !== 'Workshop') {
      return res.status(400).json({ 
        message: "Certificates are only issued for workshops" 
      });
    }

    // Verify workshop is completed
    if (event.status !== 'completed') {
      return res.status(400).json({ 
        message: "Cannot issue certificates - workshop is not yet completed" 
      });
    }

    // Get all valid registrations for this workshop
    const registrations = await Registration.find({
      event_id: eventId,
      status: 'registered',
      payment_status: { $in: ['paid', 'free'] }
    }).populate('user_id');

    if (registrations.length === 0) {
      return res.status(404).json({ 
        message: "No eligible participants found for this workshop" 
      });
    }

    // Filter for allowed roles
    const allowedRoles = ['Student', 'Staff', 'TA', 'Professor'];
    const eligibleRegistrations = registrations.filter(reg => 
      allowedRoles.includes(reg.user_id.role)
    );

    if (eligibleRegistrations.length === 0) {
      return res.status(404).json({ 
        message: "No eligible participants (Student/Staff/TA/Professor) found" 
      });
    }

    // Issue certificates for all eligible participants
    const results = {
      success: [],
      failed: []
    };

    for (const registration of eligibleRegistrations) {
      try {
        const certificateData = {
          userName: `${registration.user_id.first_name} ${registration.user_id.last_name}`,
          workshopName: event.name,
          workshopDate: formatCertificateDate(event.start_date),
          issueDate: formatCertificateDate(new Date()),
          certificateId: `CERT-${registration._id.toString().slice(-8).toUpperCase()}`
        };

        const pdfBuffer = await generateCertificate(certificateData);
        
        await sendCertificateEmail(
          registration.user_id.email,
          certificateData,
          pdfBuffer
        );

        results.success.push({
          userName: certificateData.userName,
          email: registration.user_id.email,
          certificateId: certificateData.certificateId
        });

      } catch (error) {
        console.error(`Failed to issue certificate for ${registration.user_id.email}:`, error);
        results.failed.push({
          userName: `${registration.user_id.first_name} ${registration.user_id.last_name}`,
          email: registration.user_id.email,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Certificates issued: ${results.success.length} successful, ${results.failed.length} failed`,
      results
    });

  } catch (error) {
    console.error('Batch certificate issuance error:', error);
    res.status(500).json({ 
      message: "Failed to issue certificates", 
      error: error.message 
    });
  }
};
