import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";

dotenv.config();
await connectDB();

// Insert initial Admin
await User.create({
  first_name: "Super",
  last_name: "Admin",
  email: "admin@guc.edu.eg",
  password_hash: "hashed_password_here",
  role: "Admin",
  is_verified: true
});

console.log("✅ Seed complete");
process.exit();
