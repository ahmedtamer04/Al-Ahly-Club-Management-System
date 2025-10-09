import mongoose from "mongoose";

const gymSessionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String, // Example: "10:00 AM"
    required: true,
  },
  duration: {
    type: Number, // in minutes
    required: true,
  },
  type: {
    type: String, // Example: "Yoga", "Pilates", "Zumba", etc.
    required: true,
    enum: ["Yoga", "Pilates", "Zumba", "Cardio", "Strength", "Cross Circuit", "Kick-Boxing", "Aerobics","Other"], 
  },
  maxParticipants: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["scheduled", "cancelled"],
    default: "scheduled",
  },
}, { timestamps: true });

export default mongoose.model("GymSession", gymSessionSchema);
