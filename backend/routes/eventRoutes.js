import express from "express";
import {
  getUpcomingEvents,
  filterEvents,
  sortEventsByDate,
  // getEventById,
} from "../controllers/eventController.js";

const router = express.Router();

// GET all upcoming events
router.get("/upcoming", getUpcomingEvents);

// GET filtered events by field/value
router.get("/filter/:field/:value", filterEvents);

// GET sorted events by date
router.get("/sort/date/:order", sortEventsByDate);

// // GET event by ID
// router.get("/:id", getEventById);

export default router;
