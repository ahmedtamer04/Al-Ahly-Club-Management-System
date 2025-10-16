import express from "express";
import { 
  createBazaar, 
  editBazaar, 
  getAllBazaars,
  getBazaarById,
} from "../controllers/bazaarController.js";

import { auth, requireEventsOffice, requireVendor } from "../middleware/auth.js";

const router = express.Router();

// ================================
// ADMIN/EVENTS OFFICE ROUTES
// ================================

// Only Admins and EventsOffice can create or edit bazaars
router.post("/createBazaar", auth, requireEventsOffice, createBazaar);
router.put("/editBazaar/:id", auth, requireEventsOffice, editBazaar);

// General routes (can be accessed by different roles)
router.get("/all", auth, getAllBazaars);
router.get("/:id", auth, getBazaarById);

export default router;
