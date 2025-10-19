import mongoose from "mongoose";


const registrationSchema = new mongoose.Schema({
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  user_id:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  personalId: { type: String, required: true },
  role: { type: String, enum: ["Student", "Staff", "TA", "Professor"], required: true },
  status: { type: String, enum: ["registered","canceled"], default: "registered" }
}, { timestamps: true });

registrationSchema.index({ user_id: 1, event_id: 1 }, { unique: true });
export default mongoose.model("Registration", registrationSchema);
