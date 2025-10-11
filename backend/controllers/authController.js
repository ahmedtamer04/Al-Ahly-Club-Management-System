import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const signupUser = async (req, res) => {
  try {
    const { first_name, last_name, email, id_number, password, role, company_name } = req.body;

    //check if it was a vendor signup so we pass email constraint
    if (role=="Vendor") {
      if(!email || !password || !company_name) {
          return res.status(400).json({ message: "All fields are required" });
      }
      const userExists = await User.findOne({ email });
      if (userExists) return res.status(400).json({ message: "User already exists" });
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      // Create user vendor
      const user = await User.create({
        first_name: company_name,
        last_name: "Vendor",
        email,
        id_number: Math.floor(Math.random() * 1000000).toString(), // Generate random 6-digit number
        password_hash: hash,
        role: role,
        vendor_info: {
          company_name
        }
      });
      return res.status(201).json({ message: "Vendor account created", user });

    }



    //validate if it was AAdmin/ Events Office signup
    if (role=="Admin" || role=="EventsOffice") {
      return res.status(400).json({ message: "Cannot signup as Admin or Events Office" });
    }
    // Validate email domain for non vendors
    if (!email.endsWith('@guc.edu.eg')) {
      return res.status(400).json({ 
        message: "Email must be a valid GUC email address ending with @guc.edu.eg" 
      });
    }
    //check if user already exists
    const userExists = await User.findOne({ email });
    const idExists = await User.findOne({ id_number });
    if (idExists) return res.status(400).json({ message: "ID number already registered" });
    if (userExists) return res.status(400).json({ message: "User Email already exists" });
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    if(role=="Staff" || role=="TA" || role=="Professor") {
      const user = await User.create({
      first_name,
      last_name,
      email,
      id_number,
      status: "pending", // Staff/TA/Professor need admin approval
      password_hash: hash,
      role
    });
    return res.status(201).json({ message: "Staff/TA/Professor account pending for approval", user });
  }

    // Create user
    const user = await User.create({
      first_name,
      last_name,
      email,
      id_number,
      password_hash: hash,
      role
    });

    res.status(201).json({ message: "User created", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Check user status
    if (user.status === "blocked") {
      return res.status(403).json({ message: "You are blocked" });
    }
    
    if (user.status === "pending") {
      return res.status(403).json({ message: "Waiting for approval" });
    }
    
    if (user.status !== "active") {
      return res.status(403).json({ message: "Account is not active" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, user });
    } catch (err) {
    res.status(500).json({ message: err.message });
    }
  };

  export const logoutUser = async (req, res) => {
    try {
    res.json({ message: "Logged out successfully" });
    } catch (err) {
    res.status(500).json({ message: err.message });
    }
  };

// Add this to authController.js (TEMPORARY - remove after creating admin)
export const createFirstAdmin = async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash("admin123", salt);

    const admin = await User.create({
      first_name: "Super",
      last_name: "Admin", 
      email: "superadmin@guc.edu.eg",
      id_number: "SUPER-ADMIN",
      password_hash: hash,
      role: "Admin",
      status: "active",
      is_verified: true,
      role_admin_verified: true
    });

    // Remove password from response
    const adminResponse = { ...admin.toObject() };
    delete adminResponse.password_hash;

    res.status(201).json({ message: "First admin created", admin: adminResponse });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
