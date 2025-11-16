import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    trim: true
  },
  original_filename: {
    type: String,
    required: true,
    trim: true
  },
  file_path: {
    type: String,
    required: true
  },
  file_size: {
    type: Number,
    required: true,
    min: 0
  },
  mime_type: {
    type: String,
    required: true
  },
  uploaded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  description: {
    type: String,
    trim: true,
    default: ""
  },
  event_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    default: null // null means general document, not event-specific
  },
  category: {
    type: String,
    enum: ["general", "event", "report", "other"],
    default: "general"
  }
}, { timestamps: true });

// Index for faster queries
documentSchema.index({ uploaded_by: 1 });
documentSchema.index({ event_id: 1 });
documentSchema.index({ category: 1 });
documentSchema.index({ createdAt: -1 });

export default mongoose.model("Document", documentSchema);

