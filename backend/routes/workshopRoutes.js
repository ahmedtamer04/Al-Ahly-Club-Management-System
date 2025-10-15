import express from "express";
import { 
  createWorkshop, 
  editWorkshop, 
  getMyWorkshops 
} from "../controllers/workshopController.js";
import { auth, requireProfessor } from "../middleware/auth.js";

const router = express.Router();

// Create a workshop (Professor only)
router.post("/", auth, requireProfessor, createWorkshop);

// Edit a workshop (Professor only)  
router.put("/:id", auth, requireProfessor, editWorkshop);

// View all workshops created by the user (Professor only)
router.get("/my", auth, requireProfessor, getMyWorkshops);

// ✅ CRITICAL: ES6 export instead of module.exports
export default router;
