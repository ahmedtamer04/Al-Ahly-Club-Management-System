import express from "express";
import {
  createGymSession,
  editGymSession,
  cancelGymSession,
  viewGymSchedule
} from "../controllers/gymSessionController.js";

const router = express.Router();

// Gym Session Routes
router.post("/createGymSession", createGymSession);              // Create a session
router.put("/editGymSession/:id", editGymSession);              // Edit session (date/time/duration)
router.patch("/cancelGymSession/:id", cancelGymSession);   // Cancel session
router.get("/viewGymSchedule", viewGymSchedule);        // View monthly schedule

export default router;
