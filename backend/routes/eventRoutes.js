import express from "express";
import {
  getUpcomingEvents,
  filterEvents,
  sortEventsByDate,
  deleteEvent,
  getEventComments
} from "../controllers/eventController.js";

import {auth, requireStudentOrAbove, requireAdminOrEventsOffice} from "../middleware/auth.js";

const router = express.Router();

// GET all upcoming events
router.get("/upcoming", auth, requireStudentOrAbove, getUpcomingEvents);

// GET filtered events by field/value
router.get("/filter/:field/:value", auth, requireStudentOrAbove, filterEvents);

// GET sorted events by date
router.get("/sort/date/:order", auth, requireStudentOrAbove, sortEventsByDate);

router.delete("/delete/:eventId", auth, requireAdminOrEventsOffice, deleteEvent);

// GET event by ID
// router.get("/:id", getEventById);

// GET event comments by ID
router.get("/:event_id/comments", auth, requireStudentOrAbove, getEventComments);

export default router;
