import mongoose from "mongoose";

const pollApplicationSchema = new mongoose.Schema({
  poll_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Poll",
    required: true
  },
  vendor_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  // Business information
  business_name: {
    type: String,
    required: true,
    trim: true
  },
  business_type: {
    type: String,
    trim: true
  },
  business_description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Business description cannot exceed 1000 characters']
  },
  products_offered: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Products offered cannot exceed 500 characters']
  },
  contact_phone: {
    type: String,
    required: true,
    trim: true
  },
  contact_email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  // Staff information (max 5 individuals)
  staff: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    }
  }],
  // Booth preferences
  preferred_booth_size: {
    type: String,
    enum: ["2x2", "4x4"],
    required: true
  },
  preferred_positions: [{
    wall: {
      type: String,
      enum: ["north", "south", "east", "west"]
    },
    slot: {
      type: Number,
      min: 1,
      max: 6
    }
  }],
  // Additional notes
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ["pending", "selected", "rejected", "cancelled"],
    default: "pending"
  },
  applied_at: {
    type: Date,
    default: Date.now
  },
  reviewed_at: Date,
  reviewed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  rejection_reason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  }
}, { timestamps: true });

// Indexes for performance
pollApplicationSchema.index({ poll_id: 1, vendor_user_id: 1 }, { unique: true }); // One application per vendor per poll
pollApplicationSchema.index({ poll_id: 1, status: 1 });
pollApplicationSchema.index({ vendor_user_id: 1 });

export default mongoose.model("PollApplication", pollApplicationSchema);

