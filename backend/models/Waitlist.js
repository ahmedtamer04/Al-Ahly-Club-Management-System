import mongoose from 'mongoose';

const waitlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  position: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'promoted', 'confirmed', 'expired', 'cancelled'],
    default: 'waiting'
  },
  promotedAt: {
    type: Date
  },
  confirmationDeadline: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
waitlistSchema.index({ event: 1, position: 1 });
waitlistSchema.index({ user: 1, status: 1 });
waitlistSchema.index({ status: 1, confirmationDeadline: 1 });

// Prevent duplicate entries
waitlistSchema.index({ user: 1, event: 1 }, { unique: true });

export default mongoose.model('Waitlist', waitlistSchema);
