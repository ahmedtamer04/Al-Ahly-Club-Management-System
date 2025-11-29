import mongoose from "mongoose";

const courtReservationSchema = new mongoose.Schema({
  facility_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Facility",
    required: true
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  student_name: {
    type: String,
    required: true,
    trim: true
  },
  guc_id: {
    type: String,
    required: true,
    trim: true
  },
  reservation_date: {
    type: Date,
    required: true
  },
  reservation_time: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ["confirmed", "cancelled"],
    default: "confirmed"
  },
  cancelled_at: Date
}, { timestamps: true });

// Index to prevent double booking of same facility, date, and time
courtReservationSchema.index({ facility_id: 1, reservation_date: 1, reservation_time: 1 }, { unique: true });
courtReservationSchema.index({ student_id: 1 });
courtReservationSchema.index({ reservation_date: 1 });

export default mongoose.model("CourtReservation", courtReservationSchema);

