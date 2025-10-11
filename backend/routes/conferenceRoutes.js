import express from "express";
import {
  createConference,
  editConference
} from "../controllers/conferenceController.js";

const router = express.Router();

router.post("/", createConference);
router.put("/:id", editConference); 

export default router;
