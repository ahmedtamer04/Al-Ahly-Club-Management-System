import express from "express";
import { getRecommendations } from "../controllers/recommendationController.js";
import { auth, requireStudentOrAbove } from "../middleware/auth.js";

const router = express.Router();

// GET /api/recommendations - Get personalized recommendations
router.get("/", auth, requireStudentOrAbove, getRecommendations);

export default router;
