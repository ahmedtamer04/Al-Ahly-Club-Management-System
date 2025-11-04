import express from "express";
import { issueCertificate, batchIssueCertificates } from "../controllers/certificateController.js";
import { auth, requireAdminOrEventsOffice } from "../middleware/auth.js";

const router = express.Router();

// Issue certificate for a single registration (Admin/EventsOffice only)
router.post("/issue/:registrationId", auth, requireAdminOrEventsOffice, issueCertificate);

// Batch issue certificates for all participants of a workshop (Admin/EventsOffice only)
router.post("/batch-issue/:eventId", auth, requireAdminOrEventsOffice, batchIssueCertificates);

export default router;
