import express from "express";
import {
  getUpcomingEvents,
  getAllEvents,
  filterEvents,
  sortEventsByDate,
  deleteEvent,
  archiveEvent,
  unarchiveEvent,
  getEventComments,
  getEventById
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

// PATCH /archive/:eventId - Archive an event that has already passed
router.patch('/archive/:eventId', auth, requireAdminOrEventsOffice, archiveEvent);

// PATCH /unarchive/:eventId - Unarchive a previously archived event
router.patch('/unarchive/:eventId', auth, requireAdminOrEventsOffice, unarchiveEvent);

// GET event by ID
router.get("/:id", auth, requireStudentOrAbove, getEventById);

// GET event comments by ID
router.get("/:event_id/comments", auth, requireStudentOrAbove, getEventComments);

export default router;
