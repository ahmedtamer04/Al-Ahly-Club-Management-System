import express from "express";
import { getAllFacilities, addFacility } from "../controllers/facilityController.js";

const router = express.Router();

// Routes
router.get("/", getAllFacilities);    // GET all courts
router.post("/", addFacility);        // Add a new court (for testing)

export default router;
