import mongoose from "mongoose";
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI must be defined in environment variables');
}

const MONGO_URI: string = process.env.MONGO_URI;

const connectionDB = async(): Promise<void> => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Database connected successfully");
    } catch (error) {
        console.error("❌ Database connection failed", error);
        process.exit(1);
    }
};

export default connectionDB;