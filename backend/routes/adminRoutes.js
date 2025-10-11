import express from "express";
import { 
  createAdminUser, 
  deleteAdminUser, 
  getAdminUsers, 
  getUserById,
  getPendingUsers,
  approveUser,
  verifyEmail,
  resendVerificationEmail
} from "../controllers/adminController.js";
import { auth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Admin authentication required for all routes except email verification
router.use("/verify-email", (req, res, next) => next()); // Allow email verification without auth

// All other admin routes require authentication and Admin role
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

export default router;

// Email verification route (no auth required)
export const emailVerificationRoute = express.Router();
emailVerificationRoute.get("/verify-email/:token", verifyEmail);