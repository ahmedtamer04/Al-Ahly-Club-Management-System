import express from "express";
import { auth, requireEventsOffice, requireStudentOrAbove} from "../middleware/auth.js";
import { createTrip, updateTrip, getTrip, listTrips } from "../controllers/tripController.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

// Create trip (EventsOffice only)
router.post("/createTrip", requireEventsOffice, createTrip);

// Edit trip (EventsOffice only, with server-side edit lock)
router.put("/updateTrip/:id", requireEventsOffice, updateTrip);

// Fetch single trip (any authenticated)
router.get("/getTrip/:id", requireStudentOrAbove, getTrip);

// List trips with filters (any authenticated)
router.get("/listTrips", requireStudentOrAbove, listTrips);

export default router;


