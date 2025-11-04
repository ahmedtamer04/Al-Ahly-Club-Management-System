import dotenv from "dotenv";

// Load environment variables FIRST, before other imports
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";

import tripRoutes from "./routes/tripRoutes.js";
import adminRoutes, { emailVerificationRoute } from "./routes/adminRoutes.js";
import facilityRoutes from "./routes/facilityRoutes.js";
import gymSessionsRoutes from "./routes/gymSessionsRoutes.js";
import conferenceRoutes from "./routes/conferenceRoutes.js";
import bazaarRoutes from "./routes/bazaarRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import workshopRoutes from "./routes/workshopRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js"; // ← Add this
import eventRoutes from "./routes/eventRoutes.js"; // ← Add this
import favoriteRoutes from "./routes/favoriteRoutes.js";


const app = express();

// Debug: Check if environment variables are loaded
console.log("MONGO_URI:", process.env.MONGO_URI ? "✅ Loaded" : "❌ Not found");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "✅ Loaded" : "❌ Not found");
console.log("DEVELOPMENT_MODE:", process.env.DEVELOPMENT_MODE ? `✅ ${process.env.DEVELOPMENT_MODE}` : "❌ Not found");
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "✅ Loaded" : "❌ Not found");

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB and start server after successful connection
const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server due to DB connection error:', err.message);
    process.exit(1);
  }
};

startServer();

// Basic route for testing (before API routes)
app.get("/", (req, res) => {
  res.json({ 
    message: "Al-Ahly Club Management System API",
    status: "running",
    version: "1.0.0"
  });
});

// API Routes (all routes prefixed with /api)
app.use("/api/auth", authRoutes);
// Email verification route (no auth required) - must be before admin routes
app.use("/api/admin", emailVerificationRoute);
app.use("/api/admin", adminRoutes);
app.use("/api/facilities", facilityRoutes);
app.use("/api/gym-sessions", gymSessionsRoutes);
app.use("/api/conference", conferenceRoutes);
app.use("/api/bazaar", bazaarRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/registration", registrationRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/workshop", workshopRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/favorites", favoriteRoutes);



// Note: server is started in startServer() after DB connection

