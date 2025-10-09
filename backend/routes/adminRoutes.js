import express from "express";
import { 
  createAdminUser, 
  deleteAdminUser, 
  getAdminUsers, 
  getUserById 
} from "../controllers/adminController.js"; // Changed from .JS to .js

import { auth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// All admin routes require authentication and Admin role
router.use(auth);           // ← Must have valid token (any role)
router.use(requireAdmin);   // ← Must be Admin role specifically

// Create Admin or EventsOffice user
router.post("/create-admin", createAdminUser);

// Delete Admin or EventsOffice user
router.delete("/delete-admin/:userId", deleteAdminUser);

// Get all Admin and EventsOffice users
router.get("/admin-users", getAdminUsers);

// Get specific user by ID
router.get("/user/:userId", getUserById);

export default router;