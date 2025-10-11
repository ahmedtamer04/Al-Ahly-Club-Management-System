import express from "express";
import { auth, requireEventsOffice, requireStudentOrAbove} from "../middleware/auth.js";
import {
  createConference,
  editConference
} from "../controllers/conferenceController.js";

const router = express.Router();

router.use(auth);

router.post("/create", requireEventsOffice, createConference);
router.put("/:id", requireEventsOffice, editConference); 

export default router;
