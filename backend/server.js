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
import waitlistRoutes from "./routes/waitlistRoutes.js";
import workshopRoutes from "./routes/workshopRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import { startReminderScheduler } from "./services/eventReminderService.js";
import { checkExpiredPromotions } from "./jobs/checkExpiredPromotions.js";
import cron from "node-cron";
import pollRoutes from "./routes/pollRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import salesReportRoutes from "./routes/salesReportRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import eventResourceRoutes from "./routes/eventResourceRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";


const app = express();
const databaseDisabled = process.env.DATABASE_DISABLED === "true";

// Debug: Check if environment variables are loaded
console.log("MONGO_URI:", process.env.MONGO_URI ? "✅ Loaded" : "❌ Not found");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "✅ Loaded" : "❌ Not found");
console.log("DEVELOPMENT_MODE:", process.env.DEVELOPMENT_MODE ? `✅ ${process.env.DEVELOPMENT_MODE}` : "❌ Not found");
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "✅ Loaded" : "❌ Not found");
console.log("STRIPE_SECRET_KEY:", process.env.STRIPE_SECRET_KEY ? `✅ Loaded (${process.env.STRIPE_SECRET_KEY.substring(0, 20)}...)` : "❌ Not found");

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api", (req, res, next) => {
  if (databaseDisabled) {
    return res.status(503).json({ error: "Database is temporarily disabled" });
  }

  next();
});

// Connect to MongoDB unless database access is explicitly disabled.
const startServer = async () => {
  try {
    if (databaseDisabled) {
      console.warn("DATABASE_DISABLED=true; database-backed API routes and jobs are disabled.");
    } else {
      await connectDB();
    }

    const PORT = process.env.PORT || 5001;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);

      if (!databaseDisabled) {
        startReminderScheduler();

        cron.schedule('*/15 * * * *', async () => {
          console.log('Running scheduled expired promotions check...');
          await checkExpiredPromotions();
        });
        console.log('✅ Waitlist expired promotions cron job scheduled (every 15 minutes)');
      }
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
    database: databaseDisabled ? "disabled" : "connected",
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
app.use("/api/waitlist", waitlistRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/workshop", workshopRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/sales-report", salesReportRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/event-resources", eventResourceRoutes);
app.use("/api/recommendations", recommendationRoutes);



// Note: server starts after DB connection unless DATABASE_DISABLED=true.

