import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Temporarily hardcoded for testing - REMOVE in production
    const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://mostafaguc_db_user:Hj0ZNVRqSP6CGKVc@cluster0.htwbnm8.mongodb.net/alahly";
    
    console.log("Attempting to connect to:", MONGO_URI.replace(/:[^:@]*@/, ':***@')); // Hide password in logs
    
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;