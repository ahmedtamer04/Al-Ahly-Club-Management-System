import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  author_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  body: { type: String, required: true },
  status: { type: String, enum: ["visible","deleted"], default: "visible" },
  deleted_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

export default mongoose.model("Comment", commentSchema);
