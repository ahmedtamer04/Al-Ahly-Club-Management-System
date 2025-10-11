import express from "express";
import { createTrip, updateTrip, getTrip, listTrips } from "../controllers/tripController.js";

const router = express.Router();

// All routes require authentication


// Create trip (EventsOffice only)
router.post("/createTrip", createTrip);

// Edit trip (EventsOffice only, with server-side edit lock)
router.patch("updateTrip/:id", updateTrip);

// Fetch single trip (any authenticated)
router.get("/getTrip/:id", getTrip);

// List trips with filters (any authenticated)
router.get("/listTrips", listTrips);

export default router;


