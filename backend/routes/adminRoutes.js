import express from "express";
import { 
  createAdminUser, 
  deleteAdminUser, 
  getAdminUsers, 
  getUserById,
  getPendingUsers,
  approveUser,
  verifyEmail,
  resendVerificationEmail,
  getAllVendorRequests,
  getVendorRequestById,
  acceptVendorRequest,
  rejectVendorRequest,
  getVendorRequestsStats
} from "../controllers/adminController.js";
import { auth, requireAdmin, requireAdminOrEventsOffice } from "../middleware/auth.js";

const router = express.Router();

// Admin authentication required for all routes except email verification
router.use("/verify-email", (req, res, next) => next()); // Allow email verification without auth

// All routes require authentication
router.use(auth);

// Admin user management (Admin only)
router.post("/create-admin", requireAdmin, createAdminUser);
router.delete("/delete-admin/:userId", requireAdmin, deleteAdminUser);
router.get("/admin-users", requireAdmin, getAdminUsers);
router.get("/user/:userId", requireAdmin, getUserById);

// User approval system (Admin only)
router.get("/pending-users", requireAdmin, getPendingUsers);
router.post("/approve/:userId", requireAdmin, approveUser);
router.post("/resend-verification/:userId", requireAdmin, resendVerificationEmail);

// Vendor application management (Admin and EventsOffice)
router.get("/vendor-requests", requireAdminOrEventsOffice, getAllVendorRequests);
router.get("/vendor-requests/stats", requireAdminOrEventsOffice, getVendorRequestsStats);
router.get("/vendor-requests/:applicationId", requireAdminOrEventsOffice, getVendorRequestById);
router.post("/vendor-requests/:applicationId/accept", requireAdminOrEventsOffice, acceptVendorRequest);
router.post("/vendor-requests/:applicationId/reject", requireAdminOrEventsOffice, rejectVendorRequest);

export default router;

// Email verification route (no auth required)
export const emailVerificationRoute = express.Router();
emailVerificationRoute.get("/verify-email/:token", verifyEmail);