import express from "express";
import { createBazaar, editBazaar } from "../controllers/bazaarController.js";
import { auth, requireAdminOrEventsOffice } from "../middleware/auth.js";

const router = express.Router();

// Only Admins and EventsOffice can create or edit bazaars
router.post("/", auth, requireAdminOrEventsOffice, createBazaar);
router.put("/:id", auth, requireAdminOrEventsOffice, editBazaar);

export default router;
