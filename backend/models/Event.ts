import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ["bazaar","trip","conference","workshop","gym_session"], 
    required: true 
  },
  title: { type: String, required: true },
  description: String,
  location: String,
  starts_at: { type: Date, required: true },
  ends_at: { type: Date, required: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["active","canceled","deleted"], default: "active" },
  capacity: Number,
  counters: {
    registrations: { type: Number, default: 0 },
    applications: { type: Number, default: 0 }
  },
  meta: mongoose.Schema.Types.Mixed,
  workshop: {
    professor_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    professor_name: String
  }
}, { timestamps: true });

eventSchema.index({ title: "text", description: "text" });
export default mongoose.model("Event", eventSchema);
