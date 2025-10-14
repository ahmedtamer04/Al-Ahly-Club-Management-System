import express from "express";
import {
  getUpcomingEvents,
  filterEvents,
  sortEventsByDate,
  // getEventById,
} from "../controllers/eventController.js";

import {auth, requireStudentOrAbove} from "../middleware/auth.js";

const router = express.Router();

// GET all upcoming events
router.get("/upcoming", auth, requireStudentOrAbove, getUpcomingEvents);

// GET filtered events by field/value
router.get("/filter/:field/:value", auth, requireStudentOrAbove, filterEvents);

// GET sorted events by date
router.get("/sort/date/:order", auth, requireStudentOrAbove, sortEventsByDate);

// // GET event by ID
// router.get("/:id", getEventById);

export default router;
