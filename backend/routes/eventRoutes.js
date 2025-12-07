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
  getEventById,
  rateEvent,
  getEventRatings,
  getMyRating,
  deleteRating,
  createComment,
  updateComment,
  deleteUserComment,
  getMyComment
} from "../controllers/eventController.js";

import { messageParticipants } from "../controllers/eventMessageController.js";

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

// Rating routes
// POST rate an event (Student, Staff, TA, Professor who attended)
router.post("/:eventId/rate", auth, requireStudentOrAbove, rateEvent);

// GET all ratings for an event
router.get("/:eventId/ratings", auth, requireStudentOrAbove, getEventRatings);

// GET my rating for an event
router.get("/:eventId/my-rating", auth, requireStudentOrAbove, getMyRating);

// DELETE my rating for an event
router.delete("/:eventId/rate", auth, requireStudentOrAbove, deleteRating);

// Comment routes
// POST create a comment on an event (Student, Staff, TA, Professor who attended)
router.post("/:eventId/comments", auth, requireStudentOrAbove, createComment);

// GET my comment for an event
router.get("/:eventId/my-comment", auth, requireStudentOrAbove, getMyComment);

// PUT update my comment
router.put("/:eventId/comments/:commentId", auth, requireStudentOrAbove, updateComment);

// DELETE my comment
router.delete("/:eventId/comments/:commentId", auth, requireStudentOrAbove, deleteUserComment);

// POST message all registered participants (event creator, Admin, or EventsOffice only)
router.post("/:eventId/message-participants", auth, messageParticipants);

export default router;
