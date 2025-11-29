import express from "express";
import { 
  getNotifications, 
  getUnreadNotificationCount,
  markAsRead, 
  markAllAsRead,
  deleteNotification
} from "../controllers/notificationController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get all notifications for logged-in user
router.get("/", getNotifications);

// Get unread notification count
router.get("/unread-count", getUnreadNotificationCount);

// Mark all notifications as read
router.patch("/mark-all-read", markAllAsRead);

// Mark specific notification as read
router.patch("/:id/read", markAsRead);

// Delete a notification
router.delete("/:id", deleteNotification);

export default router;
