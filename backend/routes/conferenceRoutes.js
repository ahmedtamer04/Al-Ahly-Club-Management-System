import express from "express";
import {
  createConference
} from "../controllers/conferenceController.js";

const router = express.Router();

router.post("/", createConference);

export default router;
