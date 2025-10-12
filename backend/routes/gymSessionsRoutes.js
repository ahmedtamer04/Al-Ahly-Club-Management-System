// import express from "express";
// import {
//   createGymSession,
//   editGymSession,
//   cancelGymSession,
//   viewGymSchedule
// } from "../controllers/gymSessionController.js";

// const router = express.Router();

// // Gym Session Routes
// router.post("/createGymSession", createGymSession);              // Create a session
// router.put("/editGymSession/:id", editGymSession);              // Edit session (date/time/duration)
// router.patch("/cancelGymSession/:id", cancelGymSession);   // Cancel session
// router.get("/viewGymSchedule", viewGymSchedule);        // View monthly schedule

// export default router;

import express from "express";
import {
  createGymSession,
  editGymSession,
  cancelGymSession,
  viewGymSchedule
} from "../controllers/gymSessionController.js";

import {
  auth,
  requireAdminOrEventsOffice,
  requireStudentOrAbove
} from "../middleware/auth.js";

const router = express.Router();

// View Gym Schedule (any logged-in user)
router.get("/schedule", auth, requireStudentOrAbove, viewGymSchedule);

// Create Gym Session (only Events Office or Admin)
router.post("/", auth, requireAdminOrEventsOffice, createGymSession);

// Edit Gym Session (only Events Office or Admin)
router.put("/:id", auth, requireAdminOrEventsOffice, editGymSession);

// Cancel Gym Session (only Events Office or Admin)
router.patch("/:id/cancel", auth, requireAdminOrEventsOffice, cancelGymSession);

export default router;
