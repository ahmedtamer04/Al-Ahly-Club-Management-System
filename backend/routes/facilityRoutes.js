import express from "express";
import { getAllFacilities, addFacility } from "../controllers/facilityController.js";
import {
  getAvailableCourts,
  createCourtReservation,
  getMyCourtReservations,
  cancelCourtReservation
} from "../controllers/courtReservationController.js";
import { auth, requireStudent, requireAdminOrEventsOffice } from "../middleware/auth.js";
const router = express.Router();

// Routes
//  View all courts (available to everyone logged in)
router.get("/getAll", auth, requireStudent, getAllFacilities);

//  For admin/events office to add a new court (for testing)
router.post("/add", auth, requireAdminOrEventsOffice, addFacility);

// Court Reservation Routes (Students only)
router.get("/courts/available", auth, requireStudent, getAvailableCourts);
router.post("/courts/reserve", auth, requireStudent, createCourtReservation);
router.get("/courts/my-reservations", auth, requireStudent, getMyCourtReservations);
router.delete("/courts/reservations/:reservationId", auth, requireStudent, cancelCourtReservation);

export default router;


