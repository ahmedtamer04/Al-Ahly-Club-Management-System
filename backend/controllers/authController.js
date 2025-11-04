import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateVerificationToken, sendVerificationEmail } from "../services/emailService.js";

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
      // Create user vendor (auto-approved)
      const user = await User.create({
        first_name: company_name,
        last_name: "Vendor",
        email,
        id_number: Math.floor(Math.random() * 1000000).toString(), // Generate random 6-digit number
        password_hash: hash,
        role: role,
        status: "active", // Vendors are auto-approved
        role_admin_verified: true, // Vendors don't need admin verification
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
    // Validate email domain for non vendors (development mode bypass)
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                          process.env.DEVELOPMENT_MODE === 'true' ||
                          process.env.DEVELOPMENT_MODE === true;
    
    console.log('=== EMAIL VALIDATION DEBUG ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DEVELOPMENT_MODE:', process.env.DEVELOPMENT_MODE);
    console.log('isDevelopment:', isDevelopment);
    console.log('Email:', email);
    console.log('Email ends with @guc.edu.eg:', email.endsWith('@guc.edu.eg'));
    console.log('============================');
    
    if (!isDevelopment && !email.endsWith('@guc.edu.eg')) {
      return res.status(400).json({ 
        message: "Email must be a valid GUC email address ending with @guc.edu.eg" 
      });
    }
    
    // Log if using non-GUC email in development
    if (isDevelopment && !email.endsWith('@guc.edu.eg')) {
      console.log(`✅ DEVELOPMENT MODE ACTIVE: Allowing non-GUC email: ${email}`);
    }
    //check if user already exists
    const userExists = await User.findOne({ email });
    const idExists = await User.findOne({ id_number });
    if (idExists) return res.status(400).json({ message: "ID number already registered" });
    if (userExists) return res.status(400).json({ message: "User Email already exists" });
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    // Staff, TA, and Professor require admin approval
    if(role === "Staff" || role === "TA" || role === "Professor") {
      console.log("=== CREATING STAFF/TA/PROFESSOR USER ===");
      console.log("Setting status to: pending");
      console.log("Setting role_admin_verified to: false");
      
      const user = await User.create({
        first_name,
        last_name,
        email,
        id_number,
        status: "pending", // Requires admin approval
        password_hash: hash,
        role,
        role_admin_verified: false // Must be verified by admin
      });
      
      console.log("User created with status:", user.status);
      console.log("User created with role_admin_verified:", user.role_admin_verified);
      console.log("=======================================");
      
      return res.status(201).json({ 
        message: "Registration submitted. Please wait for admin approval.", 
        user: {
          id: user._id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
          status: user.status,
          role_admin_verified: user.role_admin_verified
        }
      });
    }

    // Create Student user (requires email verification)
    if (role === "Student") {
      // Check if email verification should be skipped in development
      const skipEmailVerification = process.env.SKIP_EMAIL_VERIFICATION === 'true' && isDevelopment;
      
      if (skipEmailVerification) {
        console.log('⚠️ DEVELOPMENT MODE: Skipping email verification');
        console.log('✅ User account created and auto-verified for testing');
        
        const user = await User.create({
          first_name,
          last_name,
          email,
          id_number,
          password_hash: hash,
          role,
          status: "active", // Auto-active in dev mode
          is_verified: true, // Auto-verified in dev mode
          role_admin_verified: true // Students are auto-approved
        });
        
        return res.status(201).json({ 
          message: "Registration successful! (Email verification skipped in development mode - You can login immediately)",
          devMode: true,
          user: {
            id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role: user.role,
            status: user.status,
            is_verified: user.is_verified
          }
        });
      }
      
      // Normal flow with email verification
      // Generate verification token
      const verificationToken = generateVerificationToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      const user = await User.create({
        first_name,
        last_name,
        email,
        id_number,
        password_hash: hash,
        role,
        status: "pending", // Pending until email verified, then auto-approved
        is_verified: false,
        role_admin_verified: true, // Students are auto-approved, only need email verification
        email_verification_token: verificationToken,
        email_verification_expires: expiresAt
      });
      
      // Send verification email
      try {
        await sendVerificationEmail(
          user.email,
          verificationToken,
          user.role,
          `${user.first_name} ${user.last_name}`,
          true // isStudent flag
        );
        
        return res.status(201).json({ 
          message: "Registration successful! Please check your email to verify your account.",
          user: {
            id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role: user.role,
            status: user.status,
            is_verified: user.is_verified
          }
        });
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError.message);
        
        // In development mode, allow account creation without email verification
        if (isDevelopment) {
          console.log('⚠️ DEVELOPMENT MODE: Email failed but allowing account creation');
          console.log('⚠️ User can verify later or admin can manually verify');
          
          return res.status(201).json({ 
            message: "Registration successful! (Email sending failed - Development Mode: You can login without verification or admin can verify manually)",
            warning: "Email verification disabled in development mode",
            user: {
              id: user._id,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              role: user.role,
              status: user.status,
              is_verified: user.is_verified
            }
          });
        }
        
        // In production, delete the user if email fails
        await User.findByIdAndDelete(user._id);
        return res.status(500).json({ 
          message: "Failed to send verification email. Please try again or contact support.",
          error: emailError.message
        });
      }
    }

    // Create other users (Vendor, Admin, EventsOffice - no approval needed)
    const user = await User.create({
      first_name,
      last_name,
      email,
      id_number,
      password_hash: hash,
      role,
      status: "active", // Auto-approved roles
      is_verified: true,
      role_admin_verified: true // These roles don't need admin verification
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

    // Debug logging
    console.log("=== LOGIN ATTEMPT ===");
    console.log("Email:", email);
    console.log("User Status:", user.status);
    console.log("User Role:", user.role);
    console.log("Role Admin Verified:", user.role_admin_verified);
    console.log("==================");

    // Verify password first (security best practice)
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Check user status AFTER password verification
    if (user.status === "blocked") {
      return res.status(403).json({ message: "Your account has been blocked. Please contact admin." });
    }
    
    // For Staff, TA, Professor - check if admin verified their role
    if ((user.role === "Staff" || user.role === "TA" || user.role === "Professor") && !user.role_admin_verified) {
      return res.status(403).json({ message: "Your account is pending admin approval. Please wait for verification." });
    }
    
    // Check email verification for both students and approved staff/TA/professor
    if (!user.is_verified) {
      if (user.role === "Student") {
        return res.status(403).json({ 
          message: "Please verify your email address. Check your inbox for the verification link." 
        });
      } else if (["Staff", "TA", "Professor"].includes(user.role) && user.role_admin_verified) {
        return res.status(403).json({ 
          message: "Your role has been approved. Please check your email to verify your account." 
        });
      }
    }
    
    if (user.status === "pending") {
      return res.status(403).json({ message: "Your account is pending verification. Please check your email." });
    }
    
    if (user.status !== "active") {
      return res.status(403).json({ message: "Your account is not active. Please contact admin." });
    }

    // Generate token for successful login
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
