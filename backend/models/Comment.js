import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  author_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  body: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 1000
  },
  status: { type: String, enum: ["visible","deleted"], default: "visible" },
  deleted_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

// Index for querying comments by event
commentSchema.index({ event_id: 1, status: 1 });

// Index for querying user's comments
commentSchema.index({ author_id: 1, event_id: 1 });

export default mongoose.model("Comment", commentSchema);
