import mongoose from "mongoose";

const facilitySchema = new mongoose.Schema({
  type: { type: String, default: "court" },
  name: String,
  location: String,
  attributes: {
    sport: String,
    indoor: Boolean
  },
  status: { type: String, enum: ["available","unavailable"], default: "available" }
});

export default mongoose.model("Facility", facilitySchema);

