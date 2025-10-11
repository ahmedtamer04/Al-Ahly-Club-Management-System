import User from "../models/User.js";
import bcrypt from "bcryptjs";

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

    // Only allow deletion of Admin or EventsOffice users
    if (userToDelete.role !== 'Admin' && userToDelete.role !== 'EventsOffice') {
      return res.status(400).json({ 
        message: "Can only delete Admin or EventsOffice users" 
      });
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
    console.error('Error deleting admin user:', err);
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

// Get all pending users (Staff, TA, Professor)
export const getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({ 
      status: "pending",
      role: { $in: ["Staff", "TA", "Professor"] }
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

    // INSTANT ACTIVATION - NO EMAIL NEEDED
    user.role_admin_verified = true;
    user.is_verified = true;          // ← Set to true immediately
    user.status = "active";           // ← Set to active immediately
    await user.save();

    res.json({ 
      message: `${user.role} user approved and activated successfully`,
      user: {
        id: user._id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: user.role,
        status: user.status,           // Will be "active"
        is_verified: user.is_verified, // Will be true
        role_admin_verified: user.role_admin_verified // Will be true
      }
    });

  } catch (err) {
    console.error('Error approving user:', err);
    res.status(500).json({ message: err.message });
  }
};

// Email verification endpoint
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      email_verification_token: token,
      email_verification_expires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        message: "Invalid or expired verification token. Please contact admin to resend verification email." 
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

    if (!["block", "unblock"].includes(action)) {
      return res.status(400).json({ message: "Invalid action. Use 'block' or 'unblock'" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent blocking other admins
    if (user.role === "Admin") {
      return res.status(403).json({ message: "Cannot block admin users" });
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
    const users = await User.find()
      .select('-password_hash -email_verification_token')
      .sort({ createdAt: -1 });

    res.json({
      message: "Users retrieved successfully",
      users: users.map(user => ({
        id: user._id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: user.role,
        status: user.status,
        id_number: user.id_number,
        is_verified: user.is_verified,
        role_admin_verified: user.role_admin_verified,
        created_at: user.createdAt,
        updated_at: user.updatedAt
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