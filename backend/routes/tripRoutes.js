import express from "express";
import { auth, requireEventsOffice, requireStudentOrAbove, requireAdminOrEventsOffice } from "../middleware/auth.js";
import { createTrip, updateTrip, getTrip, listTrips } from "../controllers/tripController.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

// Create trip (EventsOffice only)
router.post("/createTrip", requireEventsOffice, createTrip);

// Edit trip (Admin or EventsOffice) — Admin should be able to edit upcoming events too
router.put("/updateTrip/:id", requireAdminOrEventsOffice, updateTrip);

// Fetch single trip (any authenticated)
router.get("/getTrip/:id", requireStudentOrAbove, getTrip);

// List trips with filters (any authenticated)
router.get("/listTrips", requireStudentOrAbove, listTrips);

export default router;


