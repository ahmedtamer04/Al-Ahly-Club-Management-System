import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import bcrypt from "bcryptjs";

dotenv.config();

const createAdminAccounts = async () => {
  try {
    await connectDB();
    console.log("✅ Connected to database");

    // Admin Account
    const adminEmail = "admin@guc.edu.eg";
    const adminPassword = "Admin123!";
    
    // Events Office Account
    const eventsOfficeEmail = "eventsoffice@guc.edu.eg";
    const eventsOfficePassword = "EventsOffice123!";

    // Check if accounts already exist
    const existingAdmin = await User.findOne({ email: adminEmail });
    const existingEventsOffice = await User.findOne({ email: eventsOfficeEmail });

    if (existingAdmin) {
      console.log("⚠️  Admin account already exists:", adminEmail);
    } else {
      // Hash admin password
      const adminSalt = await bcrypt.genSalt(10);
      const adminHash = await bcrypt.hash(adminPassword, adminSalt);

      // Create Admin account
      const admin = await User.create({
        first_name: "System",
        last_name: "Administrator",
        email: adminEmail,
        id_number: `ADM-${Date.now()}`,
        password_hash: adminHash,
        role: "Admin",
        status: "active",
        is_verified: true,
        role_admin_verified: true
      });

      console.log("✅ Admin account created successfully!");
      console.log("   Email:", adminEmail);
      console.log("   Password:", adminPassword);
    }

    if (existingEventsOffice) {
      console.log("⚠️  Events Office account already exists:", eventsOfficeEmail);
    } else {
      // Hash Events Office password
      const eoSalt = await bcrypt.genSalt(10);
      const eoHash = await bcrypt.hash(eventsOfficePassword, eoSalt);

      // Create Events Office account
      const eventsOffice = await User.create({
        first_name: "Events",
        last_name: "Office",
        email: eventsOfficeEmail,
        id_number: `EO-${Date.now()}`,
        password_hash: eoHash,
        role: "EventsOffice",
        status: "active",
        is_verified: true,
        role_admin_verified: true
      });

      console.log("✅ Events Office account created successfully!");
      console.log("   Email:", eventsOfficeEmail);
      console.log("   Password:", eventsOfficePassword);
    }

    console.log("\n📋 Account Credentials Summary:");
    console.log("=================================");
    console.log("ADMIN ACCOUNT:");
    console.log("   Email: " + adminEmail);
    console.log("   Password: " + adminPassword);
    console.log("\nEVENTS OFFICE ACCOUNT:");
    console.log("   Email: " + eventsOfficeEmail);
    console.log("   Password: " + eventsOfficePassword);
    console.log("=================================");
    console.log("\n✅ Script completed successfully!");
    console.log("⚠️  IMPORTANT: Change these passwords after first login!");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating accounts:", err);
    process.exit(1);
  }
};

createAdminAccounts();

