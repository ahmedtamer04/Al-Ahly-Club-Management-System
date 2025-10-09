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