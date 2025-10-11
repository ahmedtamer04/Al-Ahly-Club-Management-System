import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name:  { type: String, required: true },
  email:      { type: String, required: true, unique: true },
  id_number:  { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ["Student","Staff","TA","Professor","Vendor","Admin","EventsOffice"], 
    required: true 
  },
  status: { type: String, enum: ["active","blocked","pending"], default: "active" },
  
  // Verification fields
  is_verified: { type: Boolean, default: false },
  role_admin_verified: { type: Boolean, default: false },
  
  // Email verification fields
  email_verification_token: { type: String },
  email_verification_expires: { type: Date },
  
  vendor_info: {
    company_name: String
  }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
