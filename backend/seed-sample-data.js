import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Event from "./models/Events.js";
import Registration from "./models/Registration.js";
import Payment from "./models/Payment.js";
import Document from "./models/Document.js";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const seedSampleData = async () => {
  try {
    try {
      await connectDB();
      console.log("✅ Connected to database\n");
    } catch (err) {
      console.error("❌ Database connection failed. Please ensure:");
      console.error("   1. MongoDB connection string is correct in .env");
      console.error("   2. Your IP is whitelisted in MongoDB Atlas");
      console.error("   3. Network connection is available");
      throw err;
    }

    // Get or create admin user for document upload
    let admin = await User.findOne({ email: "admin@guc.edu.eg" });
    if (!admin) {
      console.log("Creating admin user...");
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash("Admin123!", salt);
      admin = await User.create({
        first_name: "System",
        last_name: "Administrator",
        email: "admin@guc.edu.eg",
        id_number: `ADM-${Date.now()}`,
        password_hash: hash,
        role: "Admin",
        status: "active",
        is_verified: true,
        role_admin_verified: true
      });
    }

    // Create sample document
    console.log("📄 Creating sample document...");
    const uploadsDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Create a sample text file
    const sampleDocContent = `Al-Ahly Club - Sample Document
Generated: ${new Date().toISOString()}

This is a sample document for testing the document management system.

Event Revenue Summary:
- Workshops: High revenue events
- Trips: Popular among students
- Conferences: Academic events
- Bazaars: Vendor participation
- Booths: Exhibition spaces

This document demonstrates the document upload and download functionality.`;
    
    const docFilename = `sample-document-${Date.now()}.txt`;
    const docPath = path.join(uploadsDir, docFilename);
    fs.writeFileSync(docPath, sampleDocContent);

    const existingDoc = await Document.findOne({ original_filename: "Sample Document.txt" });
    if (!existingDoc) {
      const document = await Document.create({
        filename: docFilename,
        original_filename: "Sample Document.txt",
        file_path: docPath,
        file_size: Buffer.byteLength(sampleDocContent),
        mime_type: "text/plain",
        uploaded_by: admin._id,
        description: "Sample document for testing document management features",
        category: "report"
      });
      console.log("✅ Sample document created:", document.original_filename);
    } else {
      console.log("⚠️  Sample document already exists");
    }

    // Create sample events with different types
    console.log("\n📅 Creating sample events...");
    
    const eventTypes = ["Workshop", "Trip", "Conference", "Bazaar", "Booth"];
    const events = [];

    for (let i = 0; i < eventTypes.length; i++) {
      const type = eventTypes[i];
      const eventName = `${type} Event ${i + 1}`;
      
      // Check if event already exists
      let event = await Event.findOne({ name: eventName, type: type });
      
      if (!event) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + (i * 7)); // Spread events over weeks
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);

        const eventData = {
          type: type,
          name: eventName,
          location: `Location ${i + 1}`,
          short_description: `Sample ${type} event for testing revenue reports`,
          start_date: startDate,
          end_date: endDate,
          time: "10:00 AM",
          created_by: admin._id,
          status: "upcoming"
        };

        // Add type-specific fields
        if (type === "Workshop") {
          eventData.workshop = {
            full_agenda: "Workshop agenda",
            faculty_responsible: "Faculty Member",
            professors_participating: ["Professor A", "Professor B"],
            required_budget: 1000,
            funding_source: "GUC",
            capacity: 50,
            registration_deadline: new Date(startDate.getTime() - 24 * 60 * 60 * 1000),
            price: Math.floor(Math.random() * 100) + 20 // $20-$120
          };
        } else if (type === "Trip") {
          eventData.trip = {
            price: Math.floor(Math.random() * 200) + 50, // $50-$250
            capacity: 30,
            registration_deadline: new Date(startDate.getTime() - 24 * 60 * 60 * 1000)
          };
        } else if (type === "Conference") {
          eventData.conference = {
            campus: "GUC",
            professors_participating: ["Professor C", "Professor D"],
            full_agenda: "Conference agenda",
            conference_website: "https://example.com",
            required_budget: 5000,
            funding_source: "GUC"
          };
        } else if (type === "Bazaar") {
          eventData.bazaar = {
            registration_deadline: new Date(startDate.getTime() - 24 * 60 * 60 * 1000),
            vendors_participating: []
          };
        } else if (type === "Booth") {
          eventData.booth = {
            vendors: []
          };
        }

        event = await Event.create(eventData);
        console.log(`✅ Created ${type} event: ${eventName}`);
      } else {
        console.log(`⚠️  ${type} event already exists: ${eventName}`);
      }
      
      events.push(event);
    }

    // Create sample registrations with payments to generate revenue
    console.log("\n💰 Creating sample registrations and payments...");
    
    // Get or create a test student user
    let student = await User.findOne({ email: "teststudent@guc.edu.eg" });
    if (!student) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash("password123", salt);
      student = await User.create({
        first_name: "Test",
        last_name: "Student",
        email: "teststudent@guc.edu.eg",
        id_number: `STU-${Date.now()}`,
        password_hash: hash,
        role: "Student",
        status: "active",
        is_verified: true,
        role_admin_verified: true
      });
    }

    // Generate random revenue for each event type
    const revenueTargets = {
      "Workshop": { min: 500, max: 2000, registrations: 15 },
      "Trip": { min: 1000, max: 3000, registrations: 20 },
      "Conference": { min: 200, max: 800, registrations: 10 },
      "Bazaar": { min: 300, max: 1500, registrations: 12 },
      "Booth": { min: 400, max: 1200, registrations: 8 }
    };

    for (const event of events) {
      const config = revenueTargets[event.type];
      if (!config) continue;

      // Check existing registrations
      const existingRegs = await Registration.countDocuments({ event_id: event._id });
      if (existingRegs > 0) {
        console.log(`⚠️  ${event.type} event already has ${existingRegs} registrations, skipping...`);
        continue;
      }

      const numRegistrations = config.registrations;
      const avgPrice = (config.min + config.max) / 2 / numRegistrations;
      
      let totalRevenue = 0;
      const registrations = [];

      for (let i = 0; i < numRegistrations; i++) {
        // Mix of paid and free registrations
        const isPaid = Math.random() > 0.3; // 70% paid, 30% free
        const price = isPaid ? Math.floor(avgPrice * (0.8 + Math.random() * 0.4)) : 0;

        const registration = await Registration.create({
          event_id: event._id,
          user_id: student._id,
          name: `Test User ${i + 1}`,
          email: `testuser${i + 1}@guc.edu.eg`,
          personalId: `ID-${Date.now()}-${i}`,
          role: "student",
          status: "registered",
          payment_status: isPaid ? "paid" : "free",
          payment_method: isPaid ? "wallet" : "free",
          payment_amount: price,
          paid_at: isPaid ? new Date() : null
        });

        registrations.push(registration);
        totalRevenue += price;

        // Create payment record for paid registrations
        if (isPaid) {
          await Payment.create({
            user_id: student._id,
            event_id: event._id,
            registration_id: registration._id,
            amount: price,
            currency: "USD",
            payment_method: "wallet",
            payment_status: "completed",
            description: `Payment for ${event.name}`,
            paid_at: new Date()
          });
        }
      }

      console.log(`✅ Created ${numRegistrations} registrations for ${event.type} (Revenue: $${totalRevenue.toFixed(2)})`);
    }

    console.log("\n📊 Summary:");
    console.log("=================================");
    console.log("✅ Sample document created");
    console.log("✅ Sample events created for all types");
    console.log("✅ Sample registrations and payments created");
    console.log("=================================");
    console.log("\n💰 Revenue by Event Type:");
    
    for (const event of events) {
      const regs = await Registration.find({ 
        event_id: event._id, 
        payment_status: "paid" 
      });
      const revenue = regs.reduce((sum, reg) => sum + (reg.payment_amount || 0), 0);
      const payments = await Payment.find({ 
        event_id: event._id, 
        payment_status: "completed" 
      });
      const paymentRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalRevenue = revenue + paymentRevenue;
      
      console.log(`   ${event.type}: $${totalRevenue.toFixed(2)}`);
    }

    console.log("\n✅ Sample data seeding completed!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding data:", err);
    process.exit(1);
  }
};

seedSampleData();

