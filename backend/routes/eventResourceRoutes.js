import express from "express";
import {
  uploadFileResource,
  addLinkResource,
  getEventResources,
  downloadResource,
  deleteResource,
  upload
} from "../controllers/eventResourceController.js";
import { auth, requireStudentOrAbove } from "../middleware/auth.js";

const router = express.Router();

// GET all resources for an event
router.get("/:eventId", auth, requireStudentOrAbove, getEventResources);

// POST upload file resource (organizers only - checked in controller)
router.post("/:eventId/upload", auth, requireStudentOrAbove, upload.single('file'), uploadFileResource);

// POST add link resource (organizers only - checked in controller)
router.post("/:eventId/link", auth, requireStudentOrAbove, addLinkResource);

// GET download a resource file
router.get("/download/:resourceId", auth, requireStudentOrAbove, downloadResource);

// DELETE a resource
router.delete("/:resourceId", auth, requireStudentOrAbove, deleteResource);

export default router;
