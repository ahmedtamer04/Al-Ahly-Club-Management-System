import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
  event_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Event", 
    required: true 
  },
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  rating: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5
  },
  review: { 
    type: String,
    trim: true,
    maxlength: 500
  }
}, { timestamps: true });

// Ensure a user can only rate an event once
ratingSchema.index({ user_id: 1, event_id: 1 }, { unique: true });

// Index for querying ratings by event
ratingSchema.index({ event_id: 1 });

export default mongoose.model("Rating", ratingSchema);
