import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// Load environment variables before anything else
dotenv.config({ path: '../.env' });

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // parse JSON bodies

// Connect to database
connectDB();

// Routes
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
