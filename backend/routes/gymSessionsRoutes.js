import express from "express";
import {
  createGymSession,
  editGymSession,
  cancelGymSession,
  viewGymSchedule
} from "../controllers/gymSessionController.js";

const router = express.Router();

// Gym Session Routes
router.post("/", createGymSession);              // Create a session
router.put("/:id", editGymSession);              // Edit session (date/time/duration)
router.patch("/:id/cancel", cancelGymSession);   // Cancel session
router.get("/schedule", viewGymSchedule);        // View monthly schedule

export default router;
