import express from "express";
import {
  getUpcomingEvents,
  getAllEvents,
  filterEvents,
  sortEventsByDate,
  deleteEvent
  // getEventById,
} from "../controllers/eventController.js";

import {auth, requireStudentOrAbove, requireAdminOrEventsOffice} from "../middleware/auth.js";

const router = express.Router();

// GET all events
router.get("/all", auth, requireAdminOrEventsOffice, getAllEvents);

// GET all upcoming events
router.get("/upcoming", auth, requireStudentOrAbove, getUpcomingEvents);

// GET filtered events by field/value
router.get("/filter/:field/:value", auth, requireStudentOrAbove, filterEvents);

// GET sorted events by date
router.get("/sort/date/:order", auth, requireStudentOrAbove, sortEventsByDate);

router.delete("/delete/:eventId", auth, requireAdminOrEventsOffice, deleteEvent);

// // GET event by ID
// router.get("/:id", getEventById);

export default router;
