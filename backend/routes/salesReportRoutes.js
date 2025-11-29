import express from "express";
import { getSalesReport } from "../controllers/salesReportController.js";
import { auth, requireAdminOrEventsOffice } from "../middleware/auth.js";

const router = express.Router();

// GET /api/sales-report
// Query params: event_type, start_date, end_date, sort_by, sort_order
router.get("/", auth, requireAdminOrEventsOffice, getSalesReport);

export default router;

