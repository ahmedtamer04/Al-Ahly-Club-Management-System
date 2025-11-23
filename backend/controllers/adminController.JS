import User from "../models/User.js";
import VendorApplication from "../models/VendorApplication.js";
import VendorLoyaltyProgram from "../models/VendorLoyaltyProgram.js";
import Comment from "../models/Comment.js";
import Registration from "../models/Registration.js";
import Event from "../models/Events.js";
import bcrypt from "bcryptjs";
import { generateVerificationToken, sendVerificationEmail, sendVendorAcceptanceEmail, sendNewLoyaltyPartnerNotification } from "../services/emailService.js";

// Create Admin or EventsOffice user
export const createAdminUser = async (req, res) => {
  try {
    const { first_name, last_name, email, password, role } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email || !password || !role) {
      return res.status(400).json({ 
        message: "All fields are required: first_name, last_name, email, password, role" 
      });
    }

    // Only allow Admin or EventsOffice roles
    if (role !== 'Admin' && role !== 'EventsOffice') {
      return res.status(400).json({ 
        message: "Role must be either 'Admin' or 'EventsOffice'" 
      });
    }

    // Validate GUC email domain
    if (!email.endsWith('@guc.edu.eg')) {
      return res.status(400).json({ 
        message: "Email must be a valid GUC email address ending with @guc.edu.eg" 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate unique ID for admin/events office
    const idNumber = role === 'Admin' ? `ADM-${Date.now()}` : `EO-${Date.now()}`;

    // Create user
    const newUser = await User.create({
      first_name,
      last_name,
      email,
      id_number: idNumber,
      password_hash: passwordHash,
      role,
      status: "active",
      is_verified: true,
      role_admin_verified: true
    });

    // Remove password from response
    const userResponse = { ...newUser.toObject() };
    delete userResponse.password_hash;

    res.status(201).json({ 
      message: `${role} user created successfully`,
      user: userResponse 
    });

  } catch (err) {
    console.error('Error creating admin user:', err);
    res.status(500).json({ message: err.message });
  }
};

// Delete Admin or EventsOffice user
export const deleteAdminUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user to be deleted
    const userToDelete = await User.findById(userId);
    
    if (!userToDelete) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent self-deletion (optional security measure)
    if (req.user && req.user._id.toString() === userId) {
      return res.status(400).json({ 
        message: "Cannot delete your own account" 
      });
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({ 
      message: `${userToDelete.role} user '${userToDelete.first_name} ${userToDelete.last_name}' deleted successfully`,
      deletedUser: {
        id: userToDelete._id,
        name: `${userToDelete.first_name} ${userToDelete.last_name}`,
        email: userToDelete.email,
        role: userToDelete.role
      }
    });

  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get all Admin and EventsOffice users (helper function)
export const getAdminUsers = async (req, res) => {
  try {
    const adminUsers = await User.find({ 
      role: { $in: ['Admin', 'EventsOffice'] }
    }).select('-password_hash');

    res.json({
      message: "Admin and EventsOffice users retrieved successfully",
      users: adminUsers,
      total: adminUsers.length
    });

  } catch (err) {
    console.error('Error fetching admin users:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get user by ID (helper function)
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password_hash');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User retrieved successfully",
      user
    });

  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get all pending users (Staff, TA, Professor) - waiting for admin approval
export const getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({ 
      status: "pending",
      role: { $in: ["Staff", "TA", "Professor"] },
      role_admin_verified: false // Only show users who haven't been approved yet
    }).select('-password_hash -email_verification_token');

    res.json({
      message: "Pending users retrieved successfully",
      users: pendingUsers,
      total: pendingUsers.length
    });

  } catch (err) {
    console.error('Error fetching pending users:', err);
    res.status(500).json({ message: err.message });
  }
};

// Admin approves user and sends verification email
export const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.status !== "pending") {
      return res.status(400).json({ message: "User is not pending approval" });
    }

    if (!["Staff", "TA", "Professor"].includes(user.role)) {
      return res.status(400).json({ message: "Only Staff, TA, and Professor users need approval" });
    }

    // Check if email verification should be skipped in development
    const isDevelopment = process.env.NODE_ENV === 'development' || process.env.DEVELOPMENT_MODE === 'true';
    const skipEmailVerification = process.env.SKIP_EMAIL_VERIFICATION === 'true' && isDevelopment;
    
    if (skipEmailVerification) {
      console.log('⚠️ DEVELOPMENT MODE: Skipping email verification for approved user');
      console.log('✅ User auto-verified and activated for testing');
      
      user.role_admin_verified = true;
      user.is_verified = true; // Auto-verified in dev mode
      user.status = "active"; // Auto-active in dev mode
      await user.save();
      
      return res.json({ 
        message: `${user.role} user approved and activated. (Email verification skipped in development mode)`,
        devMode: true,
        user: {
          id: user._id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          role: user.role,
          status: user.status,
          is_verified: user.is_verified,
          role_admin_verified: user.role_admin_verified
        }
      });
    }
    
    // Normal flow with email verification
    // Generate verification token
    const verificationToken = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Update user with admin approval and verification token
    user.role_admin_verified = true;
    user.is_verified = false; // Will be set to true after email verification
    user.status = "pending"; // Remains pending until email verified
    user.email_verification_token = verificationToken;
    user.email_verification_expires = expiresAt;
    await user.save();
    
    // Send verification email
    try {
      await sendVerificationEmail(
        user.email,
        verificationToken,
        user.role,
        `${user.first_name} ${user.last_name}`,
        false // isStudent = false
      );
      
      res.json({ 
        message: `${user.role} user approved. Verification email sent to ${user.email}`,
        user: {
          id: user._id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          role: user.role,
          status: user.status,
          is_verified: user.is_verified,
          role_admin_verified: user.role_admin_verified
        }
      });
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Rollback the approval if email fails
      user.role_admin_verified = false;
      user.status = "pending";
      user.email_verification_token = undefined;
      user.email_verification_expires = undefined;
      await user.save();
      
      return res.status(500).json({ 
        message: "Failed to send verification email. Approval cancelled." 
      });
    }

  } catch (err) {
    console.error('Error approving user:', err);
    res.status(500).json({ message: err.message });
  }
};

// Email verification endpoint
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    console.log('=== EMAIL VERIFICATION DEBUG ===');
    console.log('Token received:', token);
    console.log('Token length:', token?.length);

    const user = await User.findOne({
      email_verification_token: token,
      email_verification_expires: { $gt: Date.now() }
    });
    
    console.log('User found:', user ? 'Yes' : 'No');
    if (!user) {
      // Check if token exists but expired
      const expiredUser = await User.findOne({ email_verification_token: token });
      console.log('Expired token found:', expiredUser ? 'Yes' : 'No');
      if (expiredUser) {
        console.log('Token expired at:', expiredUser.email_verification_expires);
        console.log('Current time:', new Date());
      }
      
      // Check if user already verified (token was cleared after verification)
      // We can't find them by token, but maybe they're already active
      console.log('Checking if this might be a used/already-verified token...');
    }
    console.log('===============================');

    if (!user) {
      return res.status(400).json({ 
        message: "Invalid or expired verification token. If you already verified your email, you can log in directly. Otherwise, please contact admin to resend verification email." 
      });
    }

    // Complete user registration
    user.is_verified = true;
    user.status = "active";
    user.email_verification_token = undefined;
    user.email_verification_expires = undefined;
    await user.save();

    res.json({ 
      message: "Email verified successfully! Your registration is now complete and your account is active.",
      user: {
        id: user._id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });

  } catch (err) {
    console.error('Error verifying email:', err);
    res.status(500).json({ message: err.message });
  }
};

// Delete inappropriate comment
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Mark comment as deleted and store who deleted it
    comment.status = "deleted";
    comment.deleted_by = req.user._id;
    await comment.save();

    res.json({ 
      message: "Comment deleted successfully",
      comment: {
        id: comment._id,
        event_id: comment.event_id,
        deleted_by: req.user._id,
        deleted_at: new Date()
      }
    });

  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ message: err.message });
  }
};

// Block/Unblock user
export const toggleUserBlock = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action } = req.body; // action should be either "block" or "unblock"

    console.log('toggleUserBlock called with:', { userId, action });

    // Validate userId parameter
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.error('Invalid userId received:', userId);
      return res.status(400).json({ message: "Invalid user ID provided" });
    }

    // Validate action parameter
    if (!["block", "unblock"].includes(action)) {
      return res.status(400).json({ message: "Invalid action. Use 'block' or 'unblock'" });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found with ID:', userId);
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent blocking yourself
    if (req.user && req.user._id.toString() === userId.toString()) {
      return res.status(403).json({ message: "You cannot block your own account" });
    }

    // Update user status
    user.status = action === "block" ? "blocked" : "active";
    await user.save();

    res.json({
      message: `User ${action}ed successfully`,
      user: {
        id: user._id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });

  } catch (err) {
    console.error('Error toggling user block status:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get all users with details
export const getAllUsers = async (req, res) => {
  try {
    // Exclude Staff/TA/Professor who are pending admin approval
    // Include: Students (auto-approved), Vendors, Admins, EventsOffice, and approved Staff/TA/Professor
    const users = await User.find({
      $or: [
        { role_admin_verified: true }, // Approved users
        { role_admin_verified: null }, // Roles that don't need approval (Vendor, Admin, EventsOffice)
        { role: "Student" } // Students are auto-approved
      ]
    })
      .select('-password_hash -email_verification_token')
      .sort({ createdAt: -1 });

    res.json({
      message: "Users retrieved successfully",
      users: users.map(user => ({
        _id: user._id,  // MongoDB ID field
        id: user._id,   // Alias for compatibility
        first_name: user.first_name,
        last_name: user.last_name,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: user.role,
        status: user.status,
        id_number: user.id_number,
        is_verified: user.is_verified,
        role_admin_verified: user.role_admin_verified,
        createdAt: user.createdAt,  // For frontend compatibility
        created_at: user.createdAt, // Legacy snake_case
        updatedAt: user.updatedAt,  // For frontend compatibility
        updated_at: user.updatedAt  // Legacy snake_case
      })),
      total: users.length
    });

  } catch (err) {
    console.error('Error fetching all users:', err);
    res.status(500).json({ message: err.message });
  }
};

// Resend verification email (if needed)
export const resendVerificationEmail = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.role_admin_verified) {
      return res.status(400).json({ message: "User is not approved by admin yet" });
    }

    if (user.is_verified) {
      return res.status(400).json({ message: "User is already verified" });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.email_verification_token = verificationToken;
    user.email_verification_expires = expiresAt;
    await user.save();

    // Send verification email
    await sendVerificationEmail(
      user.email, 
      verificationToken, 
      user.role, 
      `${user.first_name} ${user.last_name}`
    );

    res.json({ 
      message: `Verification email resent to ${user.email}` 
    });

  } catch (err) {
    console.error('Error resending verification email:', err);
    res.status(500).json({ message: err.message });
  }
};

// ================================
// VENDOR APPLICATION MANAGEMENT
// ================================

// 1. View all vendor participation requests
export const getAllVendorRequests = async (req, res) => {
  try {
    const { status, bazaar_id, kind, page = 1, limit = 20 } = req.query;
    
    // Build filter object
    let filter = {};
    
    if (status && ['pending', 'accepted', 'rejected'].includes(status)) {
      filter.status = status;
    }
    
    if (bazaar_id) {
      filter.bazaar_id = bazaar_id;
    }
    
    if (kind && ['bazaar', 'booth_event'].includes(kind)) {
      filter.kind = kind;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get vendor applications with populated data
    const applications = await VendorApplication.find(filter)
      .populate({
        path: 'vendor_user_id',
        select: 'first_name last_name email vendor_info role'
      })
      .populate({
        path: 'bazaar_id',
        select: 'name start_date end_date location time status registration_deadline'
      })
      .populate({
        path: 'approved_by',
        select: 'first_name last_name email role'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalCount = await VendorApplication.countDocuments(filter);

    // Format the response
    const formattedApplications = applications.map(app => {
      // Safely handle vendor_user_id population
      const vendor = app.vendor_user_id ? {
        _id: app.vendor_user_id._id,
        name: `${app.vendor_user_id.first_name || 'Unknown'} ${app.vendor_user_id.last_name || 'Vendor'}`,
        email: app.vendor_user_id.email || 'N/A',
        company_name: app.vendor_user_id.vendor_info?.company_name || 'N/A'
      } : {
        _id: null,
        name: 'Unknown Vendor',
        email: 'N/A',
        company_name: 'N/A'
      };

      return {
        _id: app._id,
        vendor: vendor,
        kind: app.kind, // Add kind at top level for easier access
        bazaar: app.bazaar_id ? {
          _id: app.bazaar_id._id,
          name: app.bazaar_id.name,
          start_date: app.bazaar_id.start_date,
          end_date: app.bazaar_id.end_date,
          location: app.bazaar_id.location,
          time: app.bazaar_id.time,
          status: app.bazaar_id.status,
          registration_deadline: app.bazaar_id.registration_deadline
        } : null,
        duration_weeks: app.duration_weeks, // Add duration_weeks at top level
        platform_position: app.platform_position, // Add platform_position at top level
        application: {
          kind: app.kind,
          staff: app.application.staff,
          booth_size: app.application.booth_size,
          setup_duration_weeks: app.application.setup_duration_weeks,
          booth_location: app.application.booth_location,
          notes: app.application.notes
        },
        status: app.status,
        rejection_reason: app.rejection_reason,
        approved_by: app.approved_by ? {
          name: `${app.approved_by.first_name} ${app.approved_by.last_name}`,
          email: app.approved_by.email,
          role: app.approved_by.role
        } : null,
        approved_at: app.approved_at,
        submitted_at: app.createdAt,
        updated_at: app.updatedAt,
        applied_at: app.createdAt // Add alias for consistency
      };
    });

    res.json({
      message: "Vendor applications retrieved successfully",
      applications: formattedApplications,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(totalCount / parseInt(limit)),
        total_count: totalCount,
        limit: parseInt(limit)
      },
      filters_applied: {
        status: status || 'all',
        bazaar_id: bazaar_id || 'all',
        kind: kind || 'all'
      }
    });

  } catch (err) {
    console.error('Error fetching vendor applications:', err);
    res.status(500).json({ message: err.message });
  }
};

// 2. View vendor request details by ID
export const getVendorRequestById = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await VendorApplication.findById(applicationId)
      .populate({
        path: 'vendor_user_id',
        select: 'first_name last_name email vendor_info role id_number'
      })
      .populate({
        path: 'bazaar_id'
      })
      .populate({
        path: 'approved_by',
        select: 'first_name last_name email role'
      });

    if (!application) {
      return res.status(404).json({ message: "Vendor application not found" });
    }

    // Safely handle vendor_user_id population
    const vendor = application.vendor_user_id ? {
      _id: application.vendor_user_id._id,
      name: `${application.vendor_user_id.first_name || 'Unknown'} ${application.vendor_user_id.last_name || 'Vendor'}`,
      email: application.vendor_user_id.email || 'N/A',
      id_number: application.vendor_user_id.id_number || 'N/A',
      company_name: application.vendor_user_id.vendor_info?.company_name || 'N/A',
      role: application.vendor_user_id.role || 'Vendor'
    } : {
      _id: null,
      name: 'Unknown Vendor',
      email: 'N/A',
      id_number: 'N/A',
      company_name: 'N/A',
      role: 'Vendor'
    };

    const formattedApplication = {
      _id: application._id,
      vendor: vendor,
      kind: application.kind, // Add kind at top level
      bazaar: application.bazaar_id,
      duration_weeks: application.duration_weeks, // Add duration_weeks at top level
      platform_position: application.platform_position, // Add platform_position at top level
      booth_size: application.application?.booth_size, // Add booth_size at top level for easier access
      staff: application.kind === 'bazaar' ? application.application?.bazaar_staff : application.application?.booth_staff, // Flatten staff based on kind
      application: {
        kind: application.kind,
        staff: application.kind === 'bazaar' ? application.application?.bazaar_staff : application.application?.booth_staff,
        booth_size: application.application?.booth_size,
        setup_duration_weeks: application.application?.setup_duration_weeks,
        booth_location: application.application?.booth_location,
        notes: application.application?.notes
      },
      status: application.status,
      rejection_reason: application.rejection_reason,
      approved_by: application.approved_by ? {
        name: `${application.approved_by.first_name} ${application.approved_by.last_name}`,
        email: application.approved_by.email,
        role: application.approved_by.role
      } : null,
      approved_at: application.approved_at,
      applied_at: application.createdAt, // Add alias
      submitted_at: application.createdAt,
      updated_at: application.updatedAt
    };

    res.json({
      message: "Vendor application details retrieved successfully",
      application: formattedApplication
    });

  } catch (err) {
    console.error('Error fetching vendor application details:', err);
    res.status(500).json({ message: err.message });
  }
};

// 3. Accept vendor participation request
export const acceptVendorRequest = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await VendorApplication.findById(applicationId)
      .populate('vendor_user_id', 'first_name last_name email')
      .populate('bazaar_id', 'name start_date location');

    if (!application) {
      return res.status(404).json({ message: "Vendor application not found" });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ 
        message: `Cannot accept application. Current status: ${application.status}` 
      });
    }

    // Use the model's approve method (this sets payment_deadline and participation_fee)
    await application.approve(req.user._id);

    // Reload application to get updated fields
    await application.populate('vendor_user_id', 'first_name last_name email');
    await application.populate('bazaar_id', 'name location');

    // Send acceptance email with payment information (non-blocking)
    const eventName = application.kind === 'bazaar' 
      ? application.bazaar_id?.name || 'Bazaar'
      : 'Booth Event';
    
    const locationInfo = application.kind === 'bazaar'
      ? application.bazaar_id?.location || 'TBA'
      : `${application.platform_position?.wall?.toUpperCase() || ''} Wall - Slot ${application.platform_position?.slot || 'TBA'}`;
    
    const durationInfo = application.kind === 'booth_event'
      ? `${application.duration_weeks} week(s)`
      : null;

    sendVendorAcceptanceEmail(application.vendor_user_id.email, {
      userName: `${application.vendor_user_id.first_name} ${application.vendor_user_id.last_name}`,
      applicationType: application.kind === 'bazaar' ? 'Bazaar' : 'Booth Event',
      eventName: eventName,
      location: locationInfo,
      boothSize: application.application?.booth_size || 'N/A',
      duration: durationInfo,
      participationFee: application.participation_fee,
      paymentDeadline: application.payment_deadline,
      applicationId: application._id.toString()
    }).catch(err => {
      console.error('Failed to send acceptance email:', err);
    });

    // If this is a booth_event application, create an Event entry
    let createdEvent = null;
    if (application.kind === 'booth_event') {
      // Calculate end date based on duration
      const startDate = application.preferred_start_date || new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + (application.duration_weeks * 7));

      // Prepare vendor information
      const vendorData = {
        vendor_id: application.vendor_user_id._id,
        vendor_name: `${application.vendor_user_id.first_name} ${application.vendor_user_id.last_name}`,
        company_name: application.business_name || '',
        contact_info: {
          phone: application.contact_phone || '',
          email: application.contact_email || application.vendor_user_id.email
        },
        booth_assignment: `${application.platform_position.wall}-${application.platform_position.slot} (${application.application.booth_size})`,
        setup_time: `${application.duration_weeks} week(s)`,
        assigned_date: new Date()
      };

      // Create the Event
      createdEvent = await Event.create({
        name: application.business_name || `${application.vendor_user_id.first_name}'s Booth`,
        type: 'Booth',
        location: application.application.booth_location?.description || 
                  `Zone ${application.application.booth_location?.zone || 'N/A'} - ${application.platform_position.wall} Wall, Slot ${application.platform_position.slot}`,
        short_description: application.business_description || 
                          `${application.business_type || 'Business'} booth offering ${application.products_offered || 'various products'}`,
        start_date: startDate,
        end_date: endDate,
        time: 'All Day',
        status: 'upcoming',
        created_by: req.user._id,
        booth: {
          vendors: [vendorData]
        }
      });
    }

    res.json({
      message: "Vendor application accepted successfully",
      application: {
        _id: application._id,
        vendor_name: `${application.vendor_user_id.first_name} ${application.vendor_user_id.last_name}`,
        vendor_email: application.vendor_user_id.email,
        bazaar_name: application.bazaar_id?.name || 'N/A',
        status: application.status,
        approved_by: `${req.user.first_name} ${req.user.last_name}`,
        approved_at: application.approved_at,
        event_created: createdEvent ? true : false,
        event_id: createdEvent?._id
      }
    });

  } catch (err) {
    console.error('Error accepting vendor application:', err);
    res.status(500).json({ message: err.message });
  }
};

// 4. Reject vendor participation request
export const rejectVendorRequest = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { rejection_reason } = req.body;

    if (!rejection_reason || rejection_reason.trim().length === 0) {
      return res.status(400).json({ 
        message: "Rejection reason is required" 
      });
    }

    const application = await VendorApplication.findById(applicationId)
      .populate('vendor_user_id', 'first_name last_name email')
      .populate('bazaar_id', 'name start_date location');

    if (!application) {
      return res.status(404).json({ message: "Vendor application not found" });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ 
        message: `Cannot reject application. Current status: ${application.status}` 
      });
    }

    // Use the model's reject method
    await application.reject(rejection_reason.trim(), req.user._id);

    res.json({
      message: "Vendor application rejected successfully",
      application: {
        _id: application._id,
        vendor_name: `${application.vendor_user_id.first_name} ${application.vendor_user_id.last_name}`,
        vendor_email: application.vendor_user_id.email,
        bazaar_name: application.bazaar_id.name,
        status: application.status,
        rejection_reason: application.rejection_reason,
        rejected_by: `${req.user.first_name} ${req.user.last_name}`,
        rejected_at: application.approved_at
      }
    });

  } catch (err) {
    console.error('Error rejecting vendor application:', err);
    res.status(500).json({ message: err.message });
  }
};

// 5. Get vendor requests statistics
export const getVendorRequestsStats = async (req, res) => {
  try {
    const { bazaar_id } = req.query;
    
    let matchFilter = {};
    if (bazaar_id) {
      matchFilter.bazaar_id = bazaar_id;
    }

    const stats = await VendorApplication.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          total_requests: { $sum: 1 },
          pending_requests: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
          },
          accepted_requests: {
            $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] }
          },
          rejected_requests: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] }
          }
        }
      }
    ]);

    const kindStats = await VendorApplication.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$kind",
          count: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
          },
          accepted: {
            $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] }
          }
        }
      }
    ]);

    const result = {
      overall: stats[0] || {
        total_requests: 0,
        pending_requests: 0,
        accepted_requests: 0,
        rejected_requests: 0
      },
      by_type: kindStats.reduce((acc, item) => {
        acc[item._id] = {
          total: item.count,
          pending: item.pending,
          accepted: item.accepted,
          rejected: item.rejected
        };
        return acc;
      }, {})
    };

    res.json({
      message: "Vendor application statistics retrieved successfully",
      statistics: result,
      filters_applied: {
        bazaar_id: bazaar_id || 'all'
      }
    });

  } catch (err) {
    console.error('Error fetching vendor application statistics:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get all registrations with event details (Admin only)
export const getAllRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find()
      .populate('event_id', 'name type start_date end_date location')
      .populate('user_id', 'first_name last_name email role')
      .sort({ createdAt: -1 });

    res.json({
      message: "All registrations retrieved successfully",
      registrations,
      total: registrations.length
    });

  } catch (err) {
    console.error('Error fetching all registrations:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get registration count for a specific event (Admin only)
export const getEventRegistrationCount = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const count = await Registration.countDocuments({ 
      event_id: eventId,
      status: { $ne: 'canceled' } // Don't count canceled registrations
    });

    res.json({
      message: "Registration count retrieved successfully",
      eventId,
      count
    });

  } catch (err) {
    console.error('Error fetching registration count:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get registration counts for all events (Admin only)
export const getAllEventRegistrationCounts = async (req, res) => {
  try {
    const counts = await Registration.aggregate([
      {
        $match: { status: { $ne: 'canceled' } } // Don't count canceled registrations
      },
      {
        $group: {
          _id: '$event_id',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert to object format
    const countsObj = {};
    counts.forEach(item => {
      countsObj[item._id] = item.count;
    });

    res.json({
      message: "All registration counts retrieved successfully",
      counts: countsObj
    });

  } catch (err) {
    console.error('Error fetching all registration counts:', err);
    res.status(500).json({ message: err.message });
  }
};

// ================================
// LOYALTY PROGRAM MANAGEMENT
// ================================

// Get all loyalty program applications
export const getAllLoyaltyProgramApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    
    // Build filter object
    let filter = {};
    
    if (status && ['pending', 'active', 'cancelled', 'rejected'].includes(status)) {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch all loyalty program applications with populated vendor details
    const applications = await VendorLoyaltyProgram.find(filter)
      .populate('vendor_user_id', 'first_name last_name email vendor_info role')
      .populate('approved_by', 'first_name last_name email role')
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalCount = await VendorLoyaltyProgram.countDocuments(filter);

    // Format the applications
    const formattedApplications = applications.map(app => {
      const vendor = app.vendor_user_id ? {
        _id: app.vendor_user_id._id,
        name: `${app.vendor_user_id.first_name || 'Unknown'} ${app.vendor_user_id.last_name || 'Vendor'}`,
        email: app.vendor_user_id.email || 'N/A',
        company_name: app.vendor_user_id.vendor_info?.company_name || 'N/A',
        role: app.vendor_user_id.role || 'Vendor'
      } : {
        _id: null,
        name: 'Unknown Vendor',
        email: 'N/A',
        company_name: 'N/A',
        role: 'Vendor'
      };

      return {
        _id: app._id,
        vendor,
        status: app.status,
        discount_rate: app.discount_rate,
        promo_code: app.promo_code,
        terms_and_conditions: app.terms_and_conditions,
        applied_at: app.applied_at,
        approved_at: app.approved_at,
        cancelled_at: app.cancelled_at,
        cancellation_reason: app.cancellation_reason,
        approved_by: app.approved_by ? {
          name: `${app.approved_by.first_name} ${app.approved_by.last_name}`,
          email: app.approved_by.email,
          role: app.approved_by.role
        } : null,
        created_at: app.createdAt,
        updated_at: app.updatedAt
      };
    });

    // Calculate statistics
    const stats = {
      total: totalCount,
      pending: await VendorLoyaltyProgram.countDocuments({ ...filter, status: 'pending' }),
      active: await VendorLoyaltyProgram.countDocuments({ ...filter, status: 'active' }),
      cancelled: await VendorLoyaltyProgram.countDocuments({ ...filter, status: 'cancelled' }),
      rejected: await VendorLoyaltyProgram.countDocuments({ ...filter, status: 'rejected' })
    };

    res.json({
      message: "Loyalty program applications retrieved successfully",
      applications: formattedApplications,
      stats,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(totalCount / parseInt(limit)),
        total_count: totalCount,
        limit: parseInt(limit)
      },
      filters_applied: {
        status: status || 'all'
      }
    });

  } catch (error) {
    console.error('Error fetching loyalty program applications:', error);
    res.status(500).json({ 
      message: "Server error while fetching loyalty program applications.", 
      error: error.message 
    });
  }
};

// Get loyalty program application by ID
export const getLoyaltyProgramApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await VendorLoyaltyProgram.findById(applicationId)
      .populate('vendor_user_id', 'first_name last_name email vendor_info role')
      .populate('approved_by', 'first_name last_name email role');

    if (!application) {
      return res.status(404).json({ message: "Loyalty program application not found" });
    }

    const formattedApplication = {
      _id: application._id,
      vendor: {
        _id: application.vendor_user_id._id,
        name: `${application.vendor_user_id.first_name} ${application.vendor_user_id.last_name}`,
        email: application.vendor_user_id.email,
        company_name: application.vendor_user_id.vendor_info?.company_name || 'N/A',
        role: application.vendor_user_id.role
      },
      status: application.status,
      discount_rate: application.discount_rate,
      promo_code: application.promo_code,
      terms_and_conditions: application.terms_and_conditions,
      applied_at: application.applied_at,
      approved_at: application.approved_at,
      cancelled_at: application.cancelled_at,
      cancellation_reason: application.cancellation_reason,
      approved_by: application.approved_by ? {
        name: `${application.approved_by.first_name} ${application.approved_by.last_name}`,
        email: application.approved_by.email,
        role: application.approved_by.role
      } : null,
      created_at: application.createdAt,
      updated_at: application.updatedAt
    };

    res.json({
      message: "Loyalty program application details retrieved successfully",
      application: formattedApplication
    });

  } catch (err) {
    console.error('Error fetching loyalty program application details:', err);
    res.status(500).json({ message: err.message });
  }
};

// Accept loyalty program application
export const acceptLoyaltyProgramApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await VendorLoyaltyProgram.findById(applicationId)
      .populate('vendor_user_id', 'first_name last_name email');

    if (!application) {
      return res.status(404).json({ message: "Loyalty program application not found" });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ 
        message: `Cannot accept application. Current status: ${application.status}` 
      });
    }

    // Use the model's approve method
    await application.approve(req.user._id);

    // Reload application to get updated fields
    await application.populate('vendor_user_id', 'first_name last_name email vendor_info');
    await application.populate('approved_by', 'first_name last_name email role');

    // Send notification emails to all Students/Staff/TA/Professor (non-blocking)
    // Get all active users with these roles
    const eligibleUsers = await User.find({
      role: { $in: ['Student', 'Staff', 'TA', 'Professor'] },
      status: 'active',
      is_verified: true // Only send to verified users
    }).select('email first_name last_name');

    const vendorName = application.vendor_user_id.vendor_info?.company_name || 
                      `${application.vendor_user_id.first_name} ${application.vendor_user_id.last_name}`;
    const companyName = application.vendor_user_id.vendor_info?.company_name || null;

    // Send emails in parallel (non-blocking)
    const emailPromises = eligibleUsers.map(user => 
      sendNewLoyaltyPartnerNotification(user.email, {
        userName: `${user.first_name} ${user.last_name}`,
        vendorName: vendorName,
        companyName: companyName,
        discountRate: application.discount_rate,
        promoCode: application.promo_code,
        termsAndConditions: application.terms_and_conditions
      }).catch(err => {
        console.error(`Failed to send notification to ${user.email}:`, err);
      })
    );

    // Don't wait for emails to complete
    Promise.all(emailPromises).then(() => {
      console.log(`✅ Sent ${eligibleUsers.length} loyalty program notifications`);
    }).catch(err => {
      console.error('Error sending loyalty program notifications:', err);
    });

    res.json({
      message: "Loyalty program application accepted successfully",
      application: {
        _id: application._id,
        vendor_name: vendorName,
        vendor_email: application.vendor_user_id.email,
        status: application.status,
        discount_rate: application.discount_rate,
        promo_code: application.promo_code,
        approved_by: `${req.user.first_name} ${req.user.last_name}`,
        approved_at: application.approved_at,
        notifications_sent: eligibleUsers.length
      }
    });

  } catch (err) {
    console.error('Error accepting loyalty program application:', err);
    res.status(500).json({ message: err.message });
  }
};

// Reject loyalty program application
export const rejectLoyaltyProgramApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { rejection_reason } = req.body;

    if (!rejection_reason || rejection_reason.trim().length === 0) {
      return res.status(400).json({ 
        message: "Rejection reason is required" 
      });
    }

    const application = await VendorLoyaltyProgram.findById(applicationId)
      .populate('vendor_user_id', 'first_name last_name email');

    if (!application) {
      return res.status(404).json({ message: "Loyalty program application not found" });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ 
        message: `Cannot reject application. Current status: ${application.status}` 
      });
    }

    // Update application status to rejected
    application.status = 'rejected';
    application.approved_by = req.user._id;
    application.approved_at = new Date();
    // Store rejection reason in cancellation_reason field (reusing existing field)
    application.cancellation_reason = rejection_reason.trim();
    await application.save();

    res.json({
      message: "Loyalty program application rejected successfully",
      application: {
        _id: application._id,
        vendor_name: `${application.vendor_user_id.first_name} ${application.vendor_user_id.last_name}`,
        vendor_email: application.vendor_user_id.email,
        status: application.status,
        rejection_reason: application.cancellation_reason,
        rejected_by: `${req.user.first_name} ${req.user.last_name}`,
        rejected_at: application.approved_at
      }
    });

  } catch (err) {
    console.error('Error rejecting loyalty program application:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get loyalty program statistics
export const getLoyaltyProgramStats = async (req, res) => {
  try {
    const stats = {
      total: await VendorLoyaltyProgram.countDocuments({}),
      pending: await VendorLoyaltyProgram.countDocuments({ status: 'pending' }),
      active: await VendorLoyaltyProgram.countDocuments({ status: 'active' }),
      cancelled: await VendorLoyaltyProgram.countDocuments({ status: 'cancelled' }),
      rejected: await VendorLoyaltyProgram.countDocuments({ status: 'rejected' })
    };

    res.json({
      message: "Loyalty program statistics retrieved successfully",
      statistics: {
        overall: stats
      }
    });

  } catch (err) {
    console.error('Error fetching loyalty program stats:', err);
    res.status(500).json({ message: err.message });
  }
};