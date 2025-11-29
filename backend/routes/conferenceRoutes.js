import express from "express";
import { auth, requireEventsOffice, requireStudentOrAbove, requireAdminOrEventsOffice } from "../middleware/auth.js";
import {
  createConference,
  editConference
} from "../controllers/conferenceController.js";

const router = express.Router();

router.use(auth);

router.post("/create", requireEventsOffice, createConference);
// Allow Admin or EventsOffice to edit a conference (if it's still upcoming)
router.put("/:id", requireAdminOrEventsOffice, editConference);

export default router;
