import mongoose from "mongoose";

const gymSessionRegistrationSchema = new mongoose.Schema({
  gym_session_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GymSession",
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
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
  },
  status: {
    type: String,
    enum: ["registered", "cancelled"],
    default: "registered"
  },
  cancelled_at: Date
}, { timestamps: true });

// Index to prevent duplicate registrations
gymSessionRegistrationSchema.index({ gym_session_id: 1, user_id: 1 }, { unique: true });
gymSessionRegistrationSchema.index({ gym_session_id: 1 });
gymSessionRegistrationSchema.index({ user_id: 1 });

export default mongoose.model("GymSessionRegistration", gymSessionRegistrationSchema);

