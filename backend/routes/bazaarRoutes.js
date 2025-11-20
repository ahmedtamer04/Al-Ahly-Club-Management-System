import express from "express";
import { 
  createBazaar, 
  editBazaar, 
  getAllBazaars,
  getBazaarById,
  deleteBazaar
} from "../controllers/bazaarController.js";

import { auth, requireEventsOffice, requireAdminOrEventsOffice } from "../middleware/auth.js";

const router = express.Router();

// ================================
// ADMIN/EVENTS OFFICE ROUTES
// ================================

// Only Admins and EventsOffice can create, edit, or delete bazaars
router.post("/createBazaar", auth, requireEventsOffice, createBazaar);
// Allow Admin or EventsOffice to edit/delete bazaars
router.put("/editBazaar/:id", auth, requireAdminOrEventsOffice, editBazaar);
router.delete("/deleteBazaar/:id", auth, requireAdminOrEventsOffice, deleteBazaar);

// General routes (can be accessed by different roles)
router.get("/all", auth, getAllBazaars);
router.get("/:id", auth, getBazaarById);

export default router;
