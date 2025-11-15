import express from "express";
import { 
  createWorkshop, 
  editWorkshop, 
  getMyWorkshops,
  completeWorkshop,
  getPendingWorkshops,
  reviewWorkshop,
  getWorkshopParticipants
} from "../controllers/workshopController.js";
import { auth, requireProfessor, requireAdminOrEventsOffice } from "../middleware/auth.js";

const router = express.Router();

// Get pending workshops for review (EventsOffice/Admin only)
router.get("/pending", auth, requireAdminOrEventsOffice, getPendingWorkshops);

// View all workshops created by the user (Professor only)
router.get("/my", auth, requireProfessor, getMyWorkshops);

// Get workshop participants (Professor only - their own workshops)
router.get("/:id/participants", auth, requireProfessor, getWorkshopParticipants);

// Create a workshop (Professor only)
router.post("/", auth, requireProfessor, createWorkshop);

// Edit a workshop (Professor only)  
router.put("/:id", auth, requireProfessor, editWorkshop);

// Review workshop - accept/reject/request edits (EventsOffice/Admin only)
router.patch("/:id/review", auth, requireAdminOrEventsOffice, reviewWorkshop);

// Mark workshop as completed and send certificates (Admin/EventsOffice only)
router.patch("/:id/complete", auth, requireAdminOrEventsOffice, completeWorkshop);

// ✅ CRITICAL: ES6 export instead of module.exports
export default router;
