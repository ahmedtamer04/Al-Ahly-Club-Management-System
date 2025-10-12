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
  getVendorRequestsStats
} from "../controllers/adminController.js";
import { auth, requireAdmin, requireAdminOrEventsOffice } from "../middleware/auth.js";

const router = express.Router();

// Admin authentication required for all routes except email verification
router.use("/verify-email", (req, res, next) => next()); // Allow email verification without auth

// All routes require authentication
router.use(auth);

router.use(requireAdmin);

// Admin user management
router.post("/create-admin", createAdminUser);
router.delete("/delete-admin/:userId", deleteAdminUser);
router.get("/admin-users", getAdminUsers);
router.get("/user/:userId", getUserById);
router.get("/users", getAllUsers);

// User management and moderation
router.post("/user/:userId/block", toggleUserBlock);
router.delete("/comment/:commentId", deleteComment);

// User approval system
router.get("/pending-users", getPendingUsers);
router.post("/approve/:userId", approveUser);
router.post("/resend-verification/:userId", resendVerificationEmail);

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