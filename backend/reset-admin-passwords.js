import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import bcrypt from "bcryptjs";

dotenv.config();

const resetPasswords = async () => {
  try {
    await connectDB();
    console.log("✅ Connected to database\n");

    const adminEmail = "admin@guc.edu.eg";
    const eventsOfficeEmail = "eventsoffice@guc.edu.eg";

    // New passwords
    const adminPassword = "Admin123!";
    const eventsOfficePassword = "EventsOffice123!";

    // Hash passwords
    const adminSalt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash(adminPassword, adminSalt);

    const eoSalt = await bcrypt.genSalt(10);
    const eoHash = await bcrypt.hash(eventsOfficePassword, eoSalt);

    // Update Admin account
    const admin = await User.findOne({ email: adminEmail });
    if (admin) {
      admin.password_hash = adminHash;
      admin.status = "active";
      admin.is_verified = true;
      admin.role_admin_verified = true; // Fix this
      await admin.save();
      console.log("✅ Admin account password reset successfully!");
      console.log("   Email:", adminEmail);
      console.log("   New Password:", adminPassword);
      console.log("   Status: active");
      console.log("   Verified: true\n");
    } else {
      console.log("❌ Admin account not found, creating new one...");
      await User.create({
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
      console.log("✅ Admin account created!");
      console.log("   Email:", adminEmail);
      console.log("   Password:", adminPassword);
      console.log("");
    }

    // Update Events Office account
    const eventsOffice = await User.findOne({ email: eventsOfficeEmail });
    if (eventsOffice) {
      eventsOffice.password_hash = eoHash;
      eventsOffice.status = "active";
      eventsOffice.is_verified = true;
      eventsOffice.role_admin_verified = true;
      await eventsOffice.save();
      console.log("✅ Events Office account password reset successfully!");
      console.log("   Email:", eventsOfficeEmail);
      console.log("   New Password:", eventsOfficePassword);
      console.log("   Status: active");
      console.log("   Verified: true\n");
    } else {
      console.log("❌ Events Office account not found, creating new one...");
      await User.create({
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
      console.log("✅ Events Office account created!");
      console.log("   Email:", eventsOfficeEmail);
      console.log("   Password:", eventsOfficePassword);
      console.log("");
    }

    console.log("📋 FINAL CREDENTIALS:");
    console.log("=================================");
    console.log("ADMIN ACCOUNT:");
    console.log("   Email: " + adminEmail);
    console.log("   Password: " + adminPassword);
    console.log("\nEVENTS OFFICE ACCOUNT:");
    console.log("   Email: " + eventsOfficeEmail);
    console.log("   Password: " + eventsOfficePassword);
    console.log("=================================");
    console.log("\n✅ All accounts are ready to use!");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
};

resetPasswords();



