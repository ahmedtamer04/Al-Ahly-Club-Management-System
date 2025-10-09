import mongoose from "mongoose";

const facilitySchema = new mongoose.Schema({
  type: { type: String, default: "court" }, 
  name: { type: String, required: true },  
  location: String,
  attributes: {
    sport: { type: String, enum: ["Basketball", "Football", "Tennis"], required: true },
    indoor: Boolean
  },
  status: { type: String, enum: ["available", "unavailable"], default: "available" },

 availability: {
  type: [{
    date: { type: Date, required: true },
    times: [String] 
  }],
  default: []
}
});

export default mongoose.model("Facility", facilitySchema);
