import mongoose from "mongoose";

const tripSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 3, maxlength: 80 },
  location: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  price: { type: Number, required: true, min: 0 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  time: { type: String, required: true, trim: true, minlength: 1, maxlength: 40 },
  shortDescription: { type: String, required: true, trim: true, minlength: 10, maxlength: 280 },
  capacity: { type: Number, required: true, min: 1 },
  registrationDeadline: { type: Date, required: true },
  status: { type: String, enum: ["active","canceled","deleted"], default: "active" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  lastEditReason: { type: String, trim: true, maxlength: 300 }
}, { timestamps: true });

// Cross-field validators
tripSchema.pre("validate", function(next) {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate("endDate", "endDate must be greater than or equal to startDate");
  }
  if (this.startDate && this.registrationDeadline && !(this.registrationDeadline < this.startDate)) {
    this.invalidate("registrationDeadline", "registrationDeadline must be before startDate");
  }
  next();
});

// Indexes
tripSchema.index({ startDate: 1 });
tripSchema.index({ name: "text", location: "text", shortDescription: "text" });
// Optional unique pair: name + startDate
tripSchema.index({ name: 1, startDate: 1 }, { unique: true, sparse: false });

export default mongoose.model("Trip", tripSchema);


