import mongoose from "mongoose";

const vendorAppSchema = new mongoose.Schema({
  vendor_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  kind: { type: String, enum: ["bazaar","booth_setup"], required: true },
  application: {
    staff: [{ name: String, email: String }],
    booth_size: String,
    setup_duration_hours: Number,
    setup_location: String
  },
  status: { type: String, enum: ["pending","accepted","rejected"], default: "pending" }
}, { timestamps: true });

export default mongoose.model("VendorApplication", vendorAppSchema);
