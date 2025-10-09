import express from "express";
import { signupUser, loginUser, logoutUser, createFirstAdmin } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signupUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/create-first-admin", createFirstAdmin); // Add this line

export default router;
