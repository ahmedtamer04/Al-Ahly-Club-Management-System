import mongoose from "mongoose";

const voteSchema = new mongoose.Schema({
  poll_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Poll",
    required: true
  },
  application_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PollApplication",
    required: true
  },
  voter_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  voted_at: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index to ensure one vote per user per poll (user can vote for multiple applications in same poll)
voteSchema.index({ poll_id: 1, voter_id: 1, application_id: 1 }, { unique: true });
voteSchema.index({ poll_id: 1, application_id: 1 }); // For counting votes per application
voteSchema.index({ voter_id: 1 }); // For finding user's votes

export default mongoose.model("Vote", voteSchema);

