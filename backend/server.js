import dotenv from "dotenv";

// Load environment variables FIRST, before other imports
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";

import tripRoutes from "./routes/tripRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import facilityRoutes from "./routes/facilityRoutes.js";
import gymSessionsRoutes from "./routes/gymSessionsRoutes.js";
import conferenceRoutes from "./routes/conferenceRoutes.js";
import bazaarRoutes from "./routes/bazaarRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import workshopRoutes from "./routes/workshopRoutes.js";


const app = express();

// Debug: Check if environment variables are loaded
console.log("MONGO_URI:", process.env.MONGO_URI ? "✅ Loaded" : "❌ Not found");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "✅ Loaded" : "❌ Not found");

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes


app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/facilities", facilityRoutes);
app.use("/gym-sessions", gymSessionsRoutes);
app.use("/conference", conferenceRoutes);
app.use("/bazaar", bazaarRoutes);
app.use("/trips", tripRoutes);
app.use("/registration", registrationRoutes);
app.use("/vendor", vendorRoutes); // ← Add this
app.use("/workshops", workshopRoutes);
// Basic route for testing
app.get("/", (req, res) => {
  res.json({ message: "Al-Ahly Club Management System API" });
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

