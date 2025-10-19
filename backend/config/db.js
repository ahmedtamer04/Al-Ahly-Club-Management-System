import mongoose from "mongoose";

const connectDB = async () => {
  try {
  // Prefer MONGO_URI from env; if missing, fall back to the previously used Atlas URI
  // (This was the project's original testing Atlas connection.)
  const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://ahmedtamer04:12345@cluster0.dtt6a4j.mongodb.net/";

    // Hide password in logs if present
    try {
      console.log("Attempting to connect to:", MONGO_URI.replace(/:[^:@]*@/, ':***@'));
    } catch (e) {
      console.log("Attempting to connect to MongoDB");
    }

    // Mongoose connection options (safe defaults)
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(MONGO_URI, {
      // useNewUrlParser and useUnifiedTopology are defaults in Mongoose 7+, but harmless to include
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // fail fast when DB is unreachable
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection error:", error && error.message ? error.message : error);
    // Don't forcibly exit here — let the server decide or developer fix env; still throw so calling code can handle
    throw error;
  }
};

export default connectDB;