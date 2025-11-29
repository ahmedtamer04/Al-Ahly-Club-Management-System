import mongoose from "mongoose";

const vendorLoyaltyProgramSchema = new mongoose.Schema({
  vendor_user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    unique: true // One participation per vendor
  },
  status: { 
    type: String, 
    enum: ["pending", "active", "cancelled", "rejected"], 
    default: "pending" 
  },
  discount_rate: {
    type: Number,
    required: true,
    min: 0,
    max: 100 // Percentage discount (0-100)
  },
  promo_code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    unique: true,
    match: [/^[A-Z0-9]{4,20}$/, 'Promo code must be 4-20 alphanumeric characters']
  },
  terms_and_conditions: {
    type: String,
    required: true,
    trim: true,
    maxlength: [2000, 'Terms and conditions cannot exceed 2000 characters']
  },
  applied_at: {
    type: Date,
    default: Date.now
  },
  approved_at: Date,
  cancelled_at: Date,
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  cancellation_reason: {
    type: String,
    trim: true,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
  }
}, { timestamps: true });

// Indexes for performance
vendorLoyaltyProgramSchema.index({ vendor_user_id: 1 });
vendorLoyaltyProgramSchema.index({ status: 1 });
vendorLoyaltyProgramSchema.index({ promo_code: 1 });

// Instance methods
vendorLoyaltyProgramSchema.methods.cancel = function(reason) {
  this.status = 'cancelled';
  this.cancelled_at = new Date();
  if (reason) {
    this.cancellation_reason = reason;
  }
  return this.save();
};

vendorLoyaltyProgramSchema.methods.approve = function(approvedBy) {
  this.status = 'active';
  this.approved_at = new Date();
  this.approved_by = approvedBy;
  return this.save();
};

export default mongoose.model("VendorLoyaltyProgram", vendorLoyaltyProgramSchema);

