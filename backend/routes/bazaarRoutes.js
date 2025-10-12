import express from "express";
import { 
  createBazaar, 
  editBazaar, 
  getAllBazaars,
  getBazaarById,
  // Vendor-specific functions
  getUpcomingBazaars,
  applyToBazaar,
  applyForBoothPlatform,
  getAcceptedApplications,
  getPendingAndRejectedApplications,
  getApplicationById
} from "../controllers/bazaarController.js";

import { auth, requireEventsOffice, requireVendor } from "../middleware/auth.js";

const router = express.Router();

// ================================
// ADMIN/EVENTS OFFICE ROUTES
// ================================

// Only Admins and EventsOffice can create or edit bazaars
router.post("/createBazaar", auth, requireEventsOffice, createBazaar);
router.put("/editBazaar/:id", auth, requireEventsOffice, editBazaar);

// General routes (can be accessed by different roles)
router.get("/all", auth, getAllBazaars);
router.get("/:id", auth, getBazaarById);

// ================================
// VENDOR-SPECIFIC ROUTES
// ================================

// 1. View List of upcoming Bazaars
router.get("/vendor/upcoming", auth, requireVendor, getUpcomingBazaars);

// 2. Apply to join Bazaar
router.post("/vendor/apply/bazaar", auth, requireVendor, applyToBazaar);

// 3. Apply for a booth in platform
router.post("/vendor/apply/booth-platform", auth, requireVendor, applyForBoothPlatform);

// 4. View all upcoming booths/bazaars (ACCEPTED ONLY)
router.get("/vendor/applications/accepted", auth, requireVendor, getAcceptedApplications);

// 5. View all requests booths/bazaars (REJECTED/PENDING)
router.get("/vendor/applications/pending-rejected", auth, requireVendor, getPendingAndRejectedApplications);

// Bonus: Get specific application details
router.get("/vendor/applications/:applicationId", auth, requireVendor, getApplicationById);

export default router;
