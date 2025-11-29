import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import bcrypt from "bcryptjs";

dotenv.config();

const checkAccounts = async () => {
  try {
    await connectDB();
    console.log("✅ Connected to database\n");

    const adminEmail = "admin@guc.edu.eg";
    const eventsOfficeEmail = "eventsoffice@guc.edu.eg";

    // Check Admin account
    const admin = await User.findOne({ email: adminEmail });
    if (admin) {
      console.log("📋 ADMIN ACCOUNT FOUND:");
      console.log("   Email:", admin.email);
      console.log("   Role:", admin.role);
      console.log("   Status:", admin.status);
      console.log("   Is Verified:", admin.is_verified);
      console.log("   Role Admin Verified:", admin.role_admin_verified);
      console.log("   ID Number:", admin.id_number);
      console.log("   Name:", admin.first_name, admin.last_name);
      
      // Test password
      const testPassword = "Admin123!";
      const passwordMatch = await bcrypt.compare(testPassword, admin.password_hash);
      console.log("   Password 'Admin123!' matches:", passwordMatch);
      console.log("");
    } else {
      console.log("❌ ADMIN ACCOUNT NOT FOUND");
      console.log("");
    }

    // Check Events Office account
    const eventsOffice = await User.findOne({ email: eventsOfficeEmail });
    if (eventsOffice) {
      console.log("📋 EVENTS OFFICE ACCOUNT FOUND:");
      console.log("   Email:", eventsOffice.email);
      console.log("   Role:", eventsOffice.role);
      console.log("   Status:", eventsOffice.status);
      console.log("   Is Verified:", eventsOffice.is_verified);
      console.log("   Role Admin Verified:", eventsOffice.role_admin_verified);
      console.log("   ID Number:", eventsOffice.id_number);
      console.log("   Name:", eventsOffice.first_name, eventsOffice.last_name);
      
      // Test password
      const testPassword = "EventsOffice123!";
      const passwordMatch = await bcrypt.compare(testPassword, eventsOffice.password_hash);
      console.log("   Password 'EventsOffice123!' matches:", passwordMatch);
      console.log("");
    } else {
      console.log("❌ EVENTS OFFICE ACCOUNT NOT FOUND");
      console.log("");
    }

    // List all Admin and EventsOffice accounts
    const allAdmins = await User.find({ role: { $in: ["Admin", "EventsOffice"] } });
    console.log("📊 ALL ADMIN/EVENTS OFFICE ACCOUNTS IN DATABASE:");
    console.log("Total:", allAdmins.length);
    allAdmins.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.role}:`);
      console.log("   Email:", user.email);
      console.log("   Status:", user.status);
      console.log("   Is Verified:", user.is_verified);
    });

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
};

checkAccounts();




