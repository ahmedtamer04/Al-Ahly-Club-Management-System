import express from "express";
import { registerForEvent, viewRegisteredEvents } from "../controllers/registrationController.js";

const router = express.Router();


// POST /register - Register for a workshop/trip
router.post("/register", registerForEvent);

// GET /:user_id/events - View registered events (upcoming & past)
router.get("/:user_id/events", viewRegisteredEvents);

export default router;
