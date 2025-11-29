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
  registerForGymSession,
  getMyGymSessionRegistrations,
  cancelGymSessionRegistration
} from "../controllers/gymSessionRegistrationController.js";

import {
  auth,
  requireAdminOrEventsOffice,
  requireStudentOrAbove
} from "../middleware/auth.js";

const router = express.Router();

// View Gym Schedule (any logged-in user)
router.get("/schedule", auth, requireStudentOrAbove, viewGymSchedule);

// Create Gym Session (only Events Office or Admin)
router.post("/create", auth, requireAdminOrEventsOffice, createGymSession);

// Edit Gym Session (only Events Office or Admin)
router.put("/edit/:id", auth, requireAdminOrEventsOffice, editGymSession);

// Cancel Gym Session (only Events Office or Admin)
router.patch("/cancel/:id", auth, requireAdminOrEventsOffice, cancelGymSession);

// Gym Session Registration Routes (Students, Staff, TA, Professor)
router.post("/register/:sessionId", auth, requireStudentOrAbove, registerForGymSession);
router.get("/my-registrations", auth, requireStudentOrAbove, getMyGymSessionRegistrations);
router.delete("/registrations/:registrationId", auth, requireStudentOrAbove, cancelGymSessionRegistration);

export default router;
