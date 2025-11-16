import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  uploadDocument,
  getDocuments,
  downloadDocument,
  viewDocument,
  deleteDocument,
  upload
} from "../controllers/documentController.js";
import { auth, requireAdminOrEventsOffice } from "../middleware/auth.js";

const router = express.Router();

// Upload document (single file)
router.post("/upload", auth, requireAdminOrEventsOffice, upload.single("file"), uploadDocument);

// Get all documents
router.get("/", auth, requireAdminOrEventsOffice, getDocuments);

// Download document
router.get("/:id/download", auth, requireAdminOrEventsOffice, downloadDocument);

// View document (inline) - supports token in query param for direct links
router.get("/:id/view", async (req, res, next) => {
  // If token is in query params and no Authorization header, add it
  if (req.query.token && !req.header('Authorization')) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  // Use standard auth middleware
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password_hash');
    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is not valid' });
  }
}, requireAdminOrEventsOffice, viewDocument);

// Delete document
router.delete("/:id", auth, requireAdminOrEventsOffice, deleteDocument);

export default router;

