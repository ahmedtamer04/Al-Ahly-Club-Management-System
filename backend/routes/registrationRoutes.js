import express from "express";
import { registerForEvent, viewRegisteredEvents, cancelRegistration, getAllRegistrations } from "../controllers/registrationController.js";
import { auth, requireRegistering, requireAdmin } from "../middleware/auth.js";  


const router = express.Router();


// POST /register - Register for a workshop/trip
router.post("/register", auth, requireRegistering, registerForEvent);

// GET /:user_id/events - View registered events (upcoming & past)
router.get("/:user_id/events", auth, requireRegistering, viewRegisteredEvents);

// PATCH /cancel/:registrationId - Cancel a registration
router.patch("/cancel/:registrationId", auth, requireRegistering, cancelRegistration);

// GET /all - Get all registrations (Admin only)
router.get("/all", auth, requireAdmin, getAllRegistrations);

export default router;
