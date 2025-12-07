import mongoose from "mongoose";

const eventResourceSchema = new mongoose.Schema({
  event_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Event", 
    required: true 
  },
  uploaded_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  resource_type: { 
    type: String, 
    enum: ["file", "link"], 
    required: true 
  },
  title: { 
    type: String, 
    required: true,
    maxlength: 200
  },
  description: { 
    type: String,
    maxlength: 500
  },
  // For files
  file_path: { 
    type: String 
  },
  file_name: { 
    type: String 
  },
  file_size: { 
    type: Number 
  },
  mime_type: { 
    type: String 
  },
  // For links
  url: { 
    type: String 
  }
}, { 
  timestamps: true 
});

// Index for faster queries
eventResourceSchema.index({ event_id: 1, createdAt: -1 });

export default mongoose.model("EventResource", eventResourceSchema);
