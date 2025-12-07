import express from "express";
import { 
  joinWaitlist, 
  getMyWaitlist, 
  getEventWaitlist, 
  leaveWaitlist, 
  confirmPromotion 
} from "../controllers/waitlistController.js";
import { auth, requireRegistering } from "../middleware/auth.js";

const router = express.Router();

// POST /join - Join waitlist for a full event
router.post("/join", auth, requireRegistering, joinWaitlist);

// GET /my-waitlist - Get user's waitlist entries
router.get("/my-waitlist", auth, requireRegistering, getMyWaitlist);

// GET /:eventId - Get waitlist info for specific event
router.get("/:eventId", auth, requireRegistering, getEventWaitlist);

// DELETE /:eventId - Leave waitlist for an event
router.delete("/:eventId", auth, requireRegistering, leaveWaitlist);

// POST /confirm/:id - Confirm promotion and create registration
router.post("/confirm/:id", auth, requireRegistering, confirmPromotion);

export default router;
