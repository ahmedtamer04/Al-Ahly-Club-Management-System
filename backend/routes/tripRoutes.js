import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createTrip, updateTrip, getTrip, listTrips } from "../controllers/tripController.js";

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Create trip (EventsOffice only)
router.post("/", requireRole(["EventsOffice"]), createTrip);

// Edit trip (EventsOffice only, with server-side edit lock)
router.patch("/:id", requireRole(["EventsOffice"]), updateTrip);

// Fetch single trip (any authenticated)
router.get("/:id", getTrip);

// List trips with filters (any authenticated)
router.get("/", listTrips);

export default router;


