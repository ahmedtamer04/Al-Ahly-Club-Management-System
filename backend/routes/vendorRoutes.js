import express from "express";
import { auth, requireVendor } from "../middleware/auth.js";
import {
  getUpcomingBazaars,
  getUpcomingBooths,
  applyToBazaar,
  applyForBooth,
  getAcceptedApplications,
  getPendingAndRejectedApplications,
  getApplicationById,
  getMyApplications,
  cancelApplication
} from "../controllers/vendorController.js";

const router = express.Router();

// ========================================
// VENDOR ROUTES (All require vendor authentication)
// ========================================

// 1. View upcoming bazaars available for application
router.get("/upcoming/bazaars", auth, requireVendor, getUpcomingBazaars);

// 2. View upcoming booths available for application
router.get("/upcoming/booths", auth, requireVendor, getUpcomingBooths);

// 3. Apply to a bazaar event
router.post("/apply/bazaar", auth, requireVendor, applyToBazaar);

// 4. Apply for a booth event
router.post("/apply/booth", auth, requireVendor, applyForBooth);

// 5. View my accepted applications
router.get("/applications/accepted", auth, requireVendor, getAcceptedApplications);

// 6. View my pending and rejected applications
router.get("/applications/pending-rejected", auth, requireVendor, getPendingAndRejectedApplications);

// 7. View all my applications (any status)
router.get("/applications/my-applications", auth, requireVendor, getMyApplications);

// 8. Get specific application details
router.get("/applications/:applicationId", auth, requireVendor, getApplicationById);

// 9. Cancel pending application
router.patch("/applications/:applicationId/cancel", auth, requireVendor, cancelApplication);

export default router;
