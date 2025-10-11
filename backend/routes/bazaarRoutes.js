import express from "express";
import { createBazaar, editBazaar } from "../controllers/bazaarController.js";

import {auth, requireEventsOffice } from "../middleware/auth.js";

const router = express.Router();



// Only Admins and EventsOffice can create or edit bazaars
router.post("/createBazaar", auth, requireEventsOffice, createBazaar);
router.put("/editBazaar/:id", auth, requireEventsOffice, editBazaar);

export default router;
