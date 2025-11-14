import express from "express";
import { auth, requireVendor, requireAdmin, requireStudentOrAbove } from "../middleware/auth.js";
import {
  getUpcomingBazaars,
  applyToBazaar,
  applyToBoothEvent,
  getAcceptedApplications,
  getPendingAndRejectedApplications,
  getApplicationById,
  getMyApplications,
  cancelApplication,
  getBoothAvailability,
  getAllVendorApplications,
  payVendorApplicationWithWallet,
  createVendorStripePayment,
  confirmVendorStripePayment,
  getVendorPaymentInfo,
  sendQRCodesToVendor,
  applyToLoyaltyProgram,
  getLoyaltyProgramStatus,
  cancelLoyaltyProgram,
  getAllLoyaltyProgramVendors
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

// 10. Get payment info for accepted application
router.get("/applications/:applicationId/payment", auth, requireVendor, getVendorPaymentInfo);

// 11. Pay vendor application fee with wallet
router.post("/pay/wallet", auth, requireVendor, payVendorApplicationWithWallet);

// 12. Create Stripe payment intent for vendor application
router.post("/pay/stripe/create", auth, requireVendor, createVendorStripePayment);

// 13. Confirm Stripe payment for vendor application
router.post("/pay/stripe/confirm", auth, requireVendor, confirmVendorStripePayment);

// 14. Send QR codes for registered visitors
router.post("/applications/:application_id/send-qr-codes", auth, requireVendor, sendQRCodesToVendor);

// 15. Apply to GUC Loyalty Program
router.post("/loyalty-program/apply", auth, requireVendor, applyToLoyaltyProgram);

// 16. Get loyalty program status
router.get("/loyalty-program/status", auth, requireVendor, getLoyaltyProgramStatus);

// 17. Cancel loyalty program participation
router.post("/loyalty-program/cancel", auth, requireVendor, cancelLoyaltyProgram);

// ========================================
// PUBLIC ROUTES (For Students, Staff, TA, Professor, EventsOffice, Admin)
// ========================================

// 18. Get all active loyalty program vendors (Public view)
router.get("/loyalty-program/vendors", auth, requireStudentOrAbove, getAllLoyaltyProgramVendors);

// ========================================
// ADMIN ROUTES (Get all vendor applications)
// ========================================

// 19. Get all vendor applications (Admin only)
router.get("/applications/all", auth, requireAdmin, getAllVendorApplications);

export default router;
