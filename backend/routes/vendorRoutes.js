import express from "express";
import { auth, requireVendor } from "../middleware/auth.js";
import {
  getUpcomingBazaars,
  applyToBazaar,
  applyToBoothEvent,
  getAcceptedApplications,
  getPendingAndRejectedApplications,
  getApplicationById,
  getMyApplications,
  cancelApplication,
  getBoothAvailability
} from "../controllers/vendorController.js";

const router = express.Router();

// ========================================
// VENDOR ROUTES (All require vendor authentication)
// ========================================

// 1. View upcoming bazaars available for application
router.get("/upcoming/bazaars", auth, requireVendor, getUpcomingBazaars);

// 2. Apply to bazaar (names/emails of max 5 individuals, booth size)
router.post("/apply/bazaar", auth, requireVendor, applyToBazaar);

// 3. Apply to booth event (names/emails of max 5 individuals, duration 1-4 weeks, location, booth size)
router.post("/apply/booth-event", auth, requireVendor, applyToBoothEvent);

// 4. View my accepted applications
router.get("/applications/accepted", auth, requireVendor, getAcceptedApplications);

// 5. View my pending and rejected applications
router.get("/applications/pending-rejected", auth, requireVendor, getPendingAndRejectedApplications);

// 6. View all my applications (any status)
router.get("/applications/my-applications", auth, requireVendor, getMyApplications);

// 7. Get specific application details
router.get("/applications/:applicationId", auth, requireVendor, getApplicationById);

// 8. Cancel pending application
router.patch("/applications/:applicationId/cancel", auth, requireVendor, cancelApplication);

// 9. Get booth availability for platform map
router.get("/booth-availability", auth, requireVendor, getBoothAvailability);

export default router;
