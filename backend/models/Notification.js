import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  
  type: {
    type: String,
    enum: [
      "workshop_submitted",      // For EventsOffice when professor submits
      "workshop_accepted",        // For Professor when workshop accepted
      "workshop_rejected",        // For Professor when workshop rejected
      "workshop_revision_requested" // For Professor when edits requested
    ],
    required: true
  },
  
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  
  link: {
    type: String,  // URL to navigate to when notification clicked
    trim: true
  },
  
  is_read: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Related entities
  workshop_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event"
  },
  
  // Additional metadata
  metadata: {
    workshop_name: String,
    professor_name: String,
    requested_edits: String,
    rejection_reason: String,
    reviewed_by: String
  }
  
}, { 
  timestamps: true 
});

// Indexes for efficient queries
notificationSchema.index({ user_id: 1, is_read: 1 });
notificationSchema.index({ user_id: 1, createdAt: -1 });
notificationSchema.index({ workshop_id: 1 });

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ 
    user_id: userId, 
    is_read: false 
  });
};

// Static method to mark all as read for a user
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { user_id: userId, is_read: false },
    { is_read: true }
  );
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.is_read = true;
  return this.save();
};

export default mongoose.model("Notification", notificationSchema);
