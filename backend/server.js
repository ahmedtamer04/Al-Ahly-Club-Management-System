import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import tripRoutes from "./routes/tripRoutes.js";

// Load environment variables before anything else
dotenv.config({ path: '../.env' });

// Connect to database
connectDB();

const app = express();
app.use(express.json()); // parse JSON bodies

// Routes
app.use("/", authRoutes);
app.use("/api/trips", tripRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
