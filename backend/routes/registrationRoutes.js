import express from "express";
import { registerForEvent, viewRegisteredEvents, cancelRegistration } from "../controllers/registrationController.js";
import { auth, requireRegistering } from "../middleware/auth.js";  


const router = express.Router();


// POST /register - Register for a workshop/trip
router.post("/register", auth, requireRegistering, registerForEvent);

// GET /:user_id/events - View registered events (upcoming & past)
router.get("/:user_id/events", auth, requireRegistering, viewRegisteredEvents);

// DELETE /cancel/:id - Cancel a registration
router.delete("/cancel/:id", auth, requireRegistering, cancelRegistration);

export default router;
