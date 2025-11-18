import express from "express";
import { 
  createAdminUser, 
  deleteAdminUser, 
  getAdminUsers, 
  getUserById, 
  getAllUsers,
  toggleUserBlock,
  deleteComment,
  getPendingUsers,
  approveUser,
  verifyEmail,
  resendVerificationEmail,
  getAllVendorRequests,
  getVendorRequestById,
  acceptVendorRequest,
  rejectVendorRequest,
  getVendorRequestsStats,
  getAllRegistrations,
  getEventRegistrationCount,
  getAllEventRegistrationCounts,
  getAllLoyaltyProgramApplications,
  getLoyaltyProgramApplicationById,
  acceptLoyaltyProgramApplication,
  rejectLoyaltyProgramApplication,
  getLoyaltyProgramStats
} from "../controllers/adminController.js";
import { auth, requireAdmin, requireAdminOrEventsOffice } from "../middleware/auth.js";

const router = express.Router();

// Admin authentication required for all routes except email verification
router.use("/verify-email", (req, res, next) => next()); // Allow email verification without auth

// All routes require authentication
router.use(auth);

// Vendor application management (Admin and EventsOffice) - Must come BEFORE requireAdmin middleware
router.get("/vendor-requests", requireAdminOrEventsOffice, getAllVendorRequests);
router.get("/vendor-requests/stats", requireAdminOrEventsOffice, getVendorRequestsStats);
router.get("/vendor-requests/:applicationId", requireAdminOrEventsOffice, getVendorRequestById);
router.post("/vendor-requests/:applicationId/accept", requireAdminOrEventsOffice, acceptVendorRequest);
router.post("/vendor-requests/:applicationId/reject", requireAdminOrEventsOffice, rejectVendorRequest);

// All remaining routes require Admin role only
router.use(requireAdmin);

// Admin user management
router.post("/create-admin", requireAdmin, createAdminUser);
router.delete("/delete-admin/:userId", requireAdmin, deleteAdminUser);
router.get("/admin-users", requireAdmin, getAdminUsers);
router.get("/user/:userId", requireAdmin, getUserById);
router.get("/users", requireAdmin, getAllUsers);

// User management and moderation
router.post("/user/:userId/block", toggleUserBlock);
router.delete("/comment/:commentId", deleteComment);

// User approval system
router.get("/pending-users", requireAdmin, getPendingUsers);
router.post("/approve/:userId", requireAdmin, approveUser);
router.post("/resend-verification/:userId", requireAdmin, resendVerificationEmail);

// Registration management
router.get("/registrations", requireAdmin, getAllRegistrations);
router.get("/registrations/counts", requireAdmin, getAllEventRegistrationCounts);
router.get("/registrations/event/:eventId/count", requireAdmin, getEventRegistrationCount);

// Loyalty Program management
router.get("/loyalty-program/applications", requireAdmin, getAllLoyaltyProgramApplications);
router.get("/loyalty-program/applications/stats", requireAdmin, getLoyaltyProgramStats);
router.get("/loyalty-program/applications/:applicationId", requireAdmin, getLoyaltyProgramApplicationById);
router.post("/loyalty-program/applications/:applicationId/accept", requireAdmin, acceptLoyaltyProgramApplication);
router.post("/loyalty-program/applications/:applicationId/reject", requireAdmin, rejectLoyaltyProgramApplication);

export default router;

// Email verification route (no auth required)
export const emailVerificationRoute = express.Router();
emailVerificationRoute.get("/verify-email/:token", verifyEmail);