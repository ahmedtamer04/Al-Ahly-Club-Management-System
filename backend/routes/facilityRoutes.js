import express from "express";
import { getAllFacilities, addFacility } from "../controllers/facilityController.js";
import { auth, requireStudentOrAbove, requireAdminOrEventsOffice } from "../middleware/auth.js";
const router = express.Router();

// Routes
//  View all courts (available to everyone logged in)
router.get("/", auth, requireStudentOrAbove, getAllFacilities);

//  For admin/events office to add a new court (for testing)
router.post("/", auth, requireAdminOrEventsOffice, addFacility);
export default router;


