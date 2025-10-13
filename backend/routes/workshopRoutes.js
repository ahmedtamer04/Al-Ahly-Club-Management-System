import express from "express";
import { 
  createWorkshop, 
  editWorkshop, 
  getMyWorkshops 
} from "../controllers/workshopController.js";
import { auth, requireEventsOffice } from "../middleware/auth.js";

const router = express.Router();

// Create a workshop (EventsOffice only)
router.post("/", auth, requireEventsOffice, createWorkshop);

// Edit a workshop (EventsOffice only)  
router.put("/:id", auth, requireEventsOffice, editWorkshop);

// View all workshops created by the user (EventsOffice only)
router.get("/my", auth, requireEventsOffice, getMyWorkshops);

// ✅ CRITICAL: ES6 export instead of module.exports
export default router;
