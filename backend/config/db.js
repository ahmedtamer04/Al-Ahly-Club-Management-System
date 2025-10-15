import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Temporarily hardcoded for testing - REMOVE in production
  const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://ahmedtamer04:12345@cluster0.dtt6a4j.mongodb.net/";
          
    console.log("Attempting to connect to:", MONGO_URI.replace(/:[^:@]*@/, ':***@')); // Hide password in logs
    
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;