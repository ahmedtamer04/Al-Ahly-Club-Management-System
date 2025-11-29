import express from "express";
import { auth, requireEventsOffice, requireVendor, requireStudentOrAbove } from "../middleware/auth.js";
import {
  createPoll,
  getAllPolls,
  getPollById,
  updatePoll,
  openPoll,
  closePoll,
  cancelPoll,
  getOpenPolls,
  applyToPoll,
  getMyPollApplications,
  getPollsForVoting,
  voteForApplication,
  removeVote,
  getMyVotes
} from "../controllers/pollController.js";

const router = express.Router();

// ========================================
// EVENTS OFFICE ROUTES
// ========================================

// Create a new poll
router.post("/create", auth, requireEventsOffice, createPoll);

// Get all polls
router.get("/all", auth, requireEventsOffice, getAllPolls);

// Get poll by ID
router.get("/:pollId", auth, requireEventsOffice, getPollById);

// Update poll
router.put("/:pollId", auth, requireEventsOffice, updatePoll);

// Open poll (make it available for applications)
router.post("/:pollId/open", auth, requireEventsOffice, openPoll);

// Close poll and select vendors
router.post("/:pollId/close", auth, requireEventsOffice, closePoll);

// Cancel poll
router.post("/:pollId/cancel", auth, requireEventsOffice, cancelPoll);

// ========================================
// VENDOR ROUTES
// ========================================

// Get all open polls (for vendors to view and apply)
router.get("/vendor/open", auth, requireVendor, getOpenPolls);

// Apply to a poll
router.post("/vendor/:pollId/apply", auth, requireVendor, applyToPoll);

// Get vendor's poll applications
router.get("/vendor/applications", auth, requireVendor, getMyPollApplications);

// ========================================
// VOTING ROUTES (For Students, Staff, TA, Professor)
// ========================================

// Get open polls with applications for voting
router.get("/voting/open", auth, requireStudentOrAbove, getPollsForVoting);

// Vote for a vendor application
router.post("/voting/:pollId/vote/:applicationId", auth, requireStudentOrAbove, voteForApplication);

// Remove vote (unvote)
router.delete("/voting/:pollId/vote/:applicationId", auth, requireStudentOrAbove, removeVote);

// Get user's votes for a poll
router.get("/voting/:pollId/my-votes", auth, requireStudentOrAbove, getMyVotes);

export default router;

