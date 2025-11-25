import VendorApplication from "../models/VendorApplication.js";
import User from "../models/User.js";
import { 
  sendVendorAcceptanceEmail, 
  sendVendorRejectionEmail, 
  sendVendorQRCodes 
} from "../services/emailService.js";
import QRCode from 'qrcode';
import mongoose from 'mongoose';

/**
 * REQ 1: Upload vendor company documents (tax card & logo)
 * POST /api/vendor/upload-documents
 */
export const uploadVendorDocuments = async (req, res) => {
  try {
    const vendor_id = req.user._id;
    
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ 
        message: "At least one file (tax_card or company_logo) is required" 
      });
    }

    const vendor = await User.findById(vendor_id);
    if (!vendor || vendor.role !== 'Vendor') {
      return res.status(403).json({ message: "Only vendors can upload documents" });
    }

    // Process uploaded files (assuming multer or similar is used)
    const uploadedDocs = {};
    
    if (req.files.tax_card) {
      // Simulate file storage (in real app: S3, GCS, etc.)
      const taxCardFile = req.files.tax_card;
      uploadedDocs.tax_card = {
        file_url: `/uploads/vendor/${vendor_id}/tax_card_${Date.now()}.pdf`,
        file_name: taxCardFile.name,
        uploaded_at: new Date()
      };
      vendor.vendor_info.tax_card_url = uploadedDocs.tax_card.file_url;
    }

    if (req.files.company_logo) {
      const logoFile = req.files.company_logo;
      uploadedDocs.company_logo = {
        file_url: `/uploads/vendor/${vendor_id}/logo_${Date.now()}.${logoFile.name.split('.').pop()}`,
        file_name: logoFile.name,
        uploaded_at: new Date()
      };
      vendor.vendor_info.company_logo_url = uploadedDocs.company_logo.file_url;
    }

    await vendor.save();

    res.status(200).json({
      message: "Vendor documents uploaded successfully",
      documents: uploadedDocs,
      vendor_verified: vendor.vendor_info.documents_verified
    });
  } catch (error) {
    console.error('Error uploading vendor documents:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * REQ 2: Upload attendee ID documents
 * POST /api/vendor/applications/:application_id/upload-attendee-ids
 */
export const uploadAttendeeIds = async (req, res) => {
  try {
    const { application_id } = req.params;
    const vendor_id = req.user._id;

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: "ID files are required" });
    }

    const application = await VendorApplication.findById(application_id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.vendor_user_id.toString() !== vendor_id.toString()) {
      return res.status(403).json({ message: "Unauthorized to upload IDs for this application" });
    }

    // Initialize attendee_id_uploads if not present
    if (!application.attendee_id_uploads) {
      application.attendee_id_uploads = [];
    }

    // Process each uploaded ID file
    const uploadedIds = [];
    const staffList = application.kind === 'bazaar' 
      ? application.application.bazaar_staff 
      : application.application.booth_staff;

    // Assuming form sends files as: id_0, id_1, id_2, etc. (indexed by staff position)
    Object.keys(req.files).forEach((fieldName, index) => {
      if (fieldName.startsWith('id_') && staffList[index]) {
        const idFile = req.files[fieldName];
        const staffMember = staffList[index];
        
        const uploadRecord = {
          staff_name: staffMember.name,
          staff_email: staffMember.email,
          id_file_url: `/uploads/vendor/${vendor_id}/id_${application_id}_${index}_${Date.now()}.pdf`,
          id_file_name: idFile.name,
          uploaded_at: new Date(),
          verification_status: 'pending'
        };

        // Remove if already exists (update)
        application.attendee_id_uploads = application.attendee_id_uploads.filter(
          record => record.staff_email !== staffMember.email
        );
        
        application.attendee_id_uploads.push(uploadRecord);
        uploadedIds.push(uploadRecord);
      }
    });

    await application.save();

    res.status(200).json({
      message: "Attendee ID documents uploaded successfully",
      uploaded_ids: uploadedIds,
      pending_verification_count: uploadedIds.length
    });
  } catch (error) {
    console.error('Error uploading attendee IDs:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * REQ 3: Accept vendor application with email notification
 * POST /api/vendor/admin/applications/:application_id/accept
 * Also calculates payment fee and 3-day deadline
 */
export const acceptVendorApplication = async (req, res) => {
  try {
    const { application_id } = req.params;
    const admin_id = req.user._id;

    const application = await VendorApplication.findById(application_id)
      .populate('vendor_user_id', 'first_name last_name email vendor_info');

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Calculate participation fee based on application type and size
    let participation_fee = 0;
    if (application.kind === 'bazaar') {
      // Bazaar: $200 (base) + booth size premium
      participation_fee = application.application.booth_size === '4x4' ? 400 : 250;
    } else if (application.kind === 'booth_event') {
      // Booth event: $100/week base + location premium
      const basePrice = 100;
      participation_fee = basePrice * application.duration_weeks;
      
      // Add location premium based on platform position (north/south are premium)
      if (application.platform_position.wall === 'north' || application.platform_position.wall === 'south') {
        participation_fee += 150;
      }
    }

    // Set payment deadline: 3 days from now
    const paymentDeadline = new Date();
    paymentDeadline.setDate(paymentDeadline.getDate() + 3);

    application.status = 'accepted';
    application.participation_fee = participation_fee;
    application.payment_deadline = paymentDeadline;
    application.approved_by = admin_id;
    application.approved_at = new Date();

    await application.save();

    // Send acceptance email with payment deadline
    const vendor = application.vendor_user_id;
    const acceptanceDetails = {
      userName: `${vendor.first_name} ${vendor.last_name}`,
      applicationType: application.kind === 'bazaar' ? 'Bazaar' : 'Booth Event',
      eventName: application.kind === 'bazaar' 
        ? application.bazaar_id?.name || 'Event'
        : application.event_id?.name || 'Event',
      location: application.platform_position?.wall || 'TBD',
      boothSize: application.application?.booth_size || 'Standard',
      duration: application.duration_weeks ? `${application.duration_weeks} weeks` : undefined,
      participationFee: participation_fee,
      paymentDeadline: paymentDeadline,
      applicationId: application._id
    };

    await sendVendorAcceptanceEmail(vendor.email, acceptanceDetails);

    res.status(200).json({
      message: "Application accepted and email sent to vendor",
      application: {
        _id: application._id,
        status: application.status,
        participation_fee: application.participation_fee,
        payment_deadline: application.payment_deadline
      }
    });
  } catch (error) {
    console.error('Error accepting vendor application:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * REQ 3: Reject vendor application with email notification
 * POST /api/vendor/admin/applications/:application_id/reject
 */
export const rejectVendorApplication = async (req, res) => {
  try {
    const { application_id } = req.params;
    const { rejection_reason } = req.body;
    const admin_id = req.user._id;

    if (!rejection_reason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const application = await VendorApplication.findById(application_id)
      .populate('vendor_user_id', 'first_name last_name email vendor_info');

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    application.status = 'rejected';
    application.rejection_reason = rejection_reason;
    application.approved_by = admin_id;
    application.approved_at = new Date();

    await application.save();

    // Send rejection email
    const vendor = application.vendor_user_id;
    const rejectionDetails = {
      userName: `${vendor.first_name} ${vendor.last_name}`,
      applicationType: application.kind === 'bazaar' ? 'Bazaar' : 'Booth Event',
      rejectionReason: rejection_reason
    };

    await sendVendorRejectionEmail(vendor.email, rejectionDetails);

    res.status(200).json({
      message: "Application rejected and email sent to vendor",
      application: {
        _id: application._id,
        status: application.status,
        rejection_reason: application.rejection_reason
      }
    });
  } catch (error) {
    console.error('Error rejecting vendor application:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * REQ 4: Process payment for vendor participation fee
 * POST /api/vendor/applications/:application_id/pay
 */
export const processPayment = async (req, res) => {
  try {
    const { application_id } = req.params;
    const { payment_method } = req.body; // 'wallet' or 'stripe'
    const vendor_id = req.user._id;

    const application = await VendorApplication.findById(application_id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.vendor_user_id.toString() !== vendor_id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (application.status !== 'accepted') {
      return res.status(400).json({ message: "Only accepted applications can be paid" });
    }

    if (new Date() > application.payment_deadline) {
      return res.status(400).json({ 
        message: "Payment deadline has passed. Please contact admin to request extension." 
      });
    }

    // Mark as paid
    application.payment_status = 'paid';
    application.payment_date = new Date();

    await application.save();

    // Log payment transaction
    const vendor = await User.findById(vendor_id);
    if (vendor.wallet && vendor.wallet.transactions) {
      vendor.wallet.transactions.push({
        type: 'payment',
        amount: application.participation_fee,
        description: `Payment for ${application.kind === 'bazaar' ? 'Bazaar' : 'Booth Event'} participation`,
        reference: application._id,
        payment_method: payment_method,
        timestamp: new Date()
      });
      await vendor.save();
    }

    res.status(200).json({
      message: "Payment processed successfully",
      application: {
        _id: application._id,
        payment_status: application.payment_status,
        payment_date: application.payment_date,
        participation_fee: application.participation_fee
      }
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * REQ 5: Generate and send QR codes to vendor for registered visitors
 * POST /api/vendor/applications/:application_id/send-qr-codes
 */
export const generateAndSendQRCodes = async (req, res) => {
  try {
    const { application_id } = req.params;
    const { visitors } = req.body; // Array of registered visitor objects

    const application = await VendorApplication.findById(application_id)
      .populate('vendor_user_id', 'first_name last_name email')
      .populate('bazaar_id', 'name');

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.payment_status !== 'paid') {
      return res.status(400).json({ 
        message: "QR codes can only be sent after payment is made" 
      });
    }

    // Prepare visitor data for QR code generation
    const visitorData = visitors.map(visitor => ({
      registration_id: visitor._id || visitor.id,
      name: visitor.name || `${visitor.first_name} ${visitor.last_name}`,
      email: visitor.email,
      vendor_application_id: application._id
    }));

    const vendor = application.vendor_user_id;
    const qrCodeData = {
      userName: `${vendor.first_name} ${vendor.last_name}`,
      applicationType: application.kind === 'bazaar' ? 'Bazaar' : 'Booth Event',
      eventName: application.bazaar_id?.name || 'Event',
      location: application.platform_position?.wall || 'TBD',
      visitors: visitorData
    };

    await sendVendorQRCodes(vendor.email, qrCodeData);

    res.status(200).json({
      message: "QR codes generated and sent to vendor email",
      total_qr_codes: visitorData.length
    });
  } catch (error) {
    console.error('Error generating QR codes:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * REQ 6: Cancel vendor application (only if payment not made)
 * DELETE /api/vendor/applications/:application_id
 */
export const cancelVendorApplication = async (req, res) => {
  try {
    const { application_id } = req.params;
    const vendor_id = req.user._id;

    const application = await VendorApplication.findById(application_id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.vendor_user_id.toString() !== vendor_id.toString()) {
      return res.status(403).json({ message: "Unauthorized to cancel this application" });
    }

    // Can only cancel if not paid
    if (application.payment_status === 'paid') {
      return res.status(400).json({ 
        message: "Cannot cancel after payment has been made. Please contact admin for refund requests." 
      });
    }

    application.status = 'cancelled';
    application.payment_status = 'refunded';
    await application.save();

    res.status(200).json({
      message: "Application cancelled successfully",
      application: {
        _id: application._id,
        status: application.status,
        payment_status: application.payment_status
      }
    });
  } catch (error) {
    console.error('Error cancelling application:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Helper: Get vendor application status and payment info
 * GET /api/vendor/applications/:application_id/status
 */
export const getApplicationStatus = async (req, res) => {
  try {
    const { application_id } = req.params;

    const application = await VendorApplication.findById(application_id)
      .populate('vendor_user_id', 'first_name last_name email')
      .populate('bazaar_id', 'name start_date');

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const now = new Date();
    const is_payment_overdue = application.payment_deadline && now > application.payment_deadline;

    res.status(200).json({
      message: "Application status retrieved",
      application: {
        _id: application._id,
        kind: application.kind,
        status: application.status,
        payment_status: application.payment_status,
        participation_fee: application.participation_fee,
        payment_deadline: application.payment_deadline,
        is_payment_overdue: is_payment_overdue,
        days_until_deadline: application.payment_deadline 
          ? Math.ceil((application.payment_deadline - now) / (1000 * 60 * 60 * 24))
          : null
      }
    });
  } catch (error) {
    console.error('Error fetching application status:', error);
    res.status(500).json({ message: error.message });
  }
};
