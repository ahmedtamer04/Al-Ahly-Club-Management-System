import express from "express";
import { registerForEvent, viewRegisteredEvents, cancelRegistration, getAllRegistrations, cancelUnpaidRegistration, getRegistrationsForMyEvents, exportEventRegistrationsXlsx } from "../controllers/registrationController.js";
import { auth, requireRegistering, requireAdmin, requireAdminOrEventsOffice } from "../middleware/auth.js";  


const router = express.Router();


// POST /register - Register for a workshop/trip
router.post("/register", auth, requireRegistering, registerForEvent);

// GET /:user_id/events - View registered events (upcoming & past)
router.get("/:user_id/events", auth, requireRegistering, viewRegisteredEvents);

// PATCH /cancel/:registrationId - Cancel a registration
router.patch("/cancel/:registrationId", auth, requireRegistering, cancelRegistration);

// DELETE /cancel-unpaid/:registrationId - Cancel unpaid registration (payment abandoned)
router.delete("/cancel-unpaid/:registrationId", auth, requireRegistering, cancelUnpaidRegistration);

// GET /all - Get all registrations (Admin only)
router.get("/all", auth, requireAdmin, getAllRegistrations);

// GET /my-events - Get registrations for events belonging to the requester
// Admin and EventsOffice can use this to view full registration list
router.get("/my-events", auth, requireAdminOrEventsOffice, getRegistrationsForMyEvents);

// GET /event/:event_id/export - Get .xlsx file of registered attendees for an event
router.get('/event/:event_id/export', auth, requireAdminOrEventsOffice, exportEventRegistrationsXlsx);

export default router;
