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
  status: { 
    type: String, 
    enum: ["active","blocked","pending"], 
    default: "active" 
  },
  
  // Verification fields
  is_verified: { type: Boolean, default: false },
  role_admin_verified: { type: Boolean, default: null }, // null = not applicable, false = waiting for approval, true = approved
  
  // Email verification fields
  email_verification_token: { type: String },
  email_verification_expires: { type: Date },
  
  // Wallet and Payment fields
  wallet: {
    balance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'USD' },
    transactions: [{
      type: { 
        type: String, 
        enum: ['credit', 'debit', 'payment', 'refund', 'top-up'],
        required: true 
      },
      amount: { type: Number, required: true },
      description: { type: String, required: true },
      reference: { type: String }, // e.g., event_id, registration_id
      payment_method: { 
        type: String, 
        enum: ['wallet', 'stripe', 'card'],
      },
      stripe_payment_id: { type: String },
      timestamp: { type: Date, default: Date.now }
    }]
  },
  
  vendor_info: {
    company_name: String,
    tax_card_url: String,
    company_logo_url: String,
    documents_verified: { type: Boolean, default: false }
  }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
