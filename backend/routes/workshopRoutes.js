import express from "express";
import { 
  createWorkshop, 
  editWorkshop, 
  getMyWorkshops,
  completeWorkshop
} from "../controllers/workshopController.js";
import { auth, requireProfessor, requireAdminOrEventsOffice } from "../middleware/auth.js";

const router = express.Router();

// Create a workshop (Professor only)
router.post("/", auth, requireProfessor, createWorkshop);

// Edit a workshop (Professor only)  
router.put("/:id", auth, requireProfessor, editWorkshop);

// View all workshops created by the user (Professor only)
router.get("/my", auth, requireProfessor, getMyWorkshops);

// Mark workshop as completed and send certificates (Admin/EventsOffice only)
router.patch("/:id/complete", auth, requireAdminOrEventsOffice, completeWorkshop);

// ✅ CRITICAL: ES6 export instead of module.exports
export default router;
