import mongoose from "mongoose";
import dotenv from "dotenv";
import Event from "./models/Events.js";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

const seedEvents = async () => {
  try {
    await Event.deleteMany();
    console.log("Existing events cleared.");

    const events = [];

    // -------------------- TRIPS --------------------
    for (let i = 1; i <= 10; i++) {
      const day = 10 + i;
      events.push({
        name: `Trip ${i} - Explore City ${i}`,
        type: "Trip",
        location: `City ${i}`,
        short_description: `Trip to explore interesting spots in City ${i}`,
        start_date: new Date(Date.UTC(2025, 9, day, 8, 0)), // October
        end_date: new Date(Date.UTC(2025, 9, day, 18, 0)),
        time: "08:00-18:00",
        status: "upcoming",
        created_by: new mongoose.Types.ObjectId(),
        trip: {
          price: 20 + i * 5,
          capacity: 15 + i * 2,
          registration_deadline: new Date(Date.UTC(2025, 9, day - 1, 23, 59, 59)),
        },
      });
    }

    // -------------------- BAZAARS --------------------
    for (let i = 1; i <= 10; i++) {
      const day = 5 + i;
      events.push({
        name: `Bazaar ${i} - Local Crafts`,
        type: "Bazaar",
        location: `Area ${i}`,
        short_description: `Bazaar featuring local crafts and food ${i}`,
        start_date: new Date(Date.UTC(2025, 9, day, 10, 0)),
        end_date: new Date(Date.UTC(2025, 9, day, 18, 0)),
        time: "10:00-18:00",
        status: "upcoming",
        created_by: new mongoose.Types.ObjectId(),
        bazaar: {
          registration_deadline: new Date(Date.UTC(2025, 9, day - 2, 23, 59, 59)),
          vendors_participating: [
            { vendor_name: `Vendor ${i}A`, booth_number: `B${i}`, products: ["Food", "Crafts"] },
            { vendor_name: `Vendor ${i}B`, booth_number: `C${i}`, products: ["Art"] },
          ],
        },
      });
    }

    // -------------------- WORKSHOPS --------------------
    for (let i = 1; i <= 10; i++) {
      const day = 15 + i;
      events.push({
        name: `Workshop ${i} - Learn Topic ${i}`,
        type: "Workshop",
        location: `Lab ${i}`,
        short_description: `Hands-on workshop on Topic ${i}`,
        start_date: new Date(Date.UTC(2025, 9, day, 9, 0)),
        end_date: new Date(Date.UTC(2025, 9, day, 16, 0)),
        time: "09:00-16:00",
        status: "upcoming",
        created_by: new mongoose.Types.ObjectId(),
        workshop: {
          full_agenda: `Session 1, Session 2, Q&A`,
          faculty_responsible: `Dr. Faculty ${i}`,
          professors_participating: [`Prof. A${i}`, `Prof. B${i}`],
          required_budget: 1000 + i * 100,
          funding_source: i % 2 === 0 ? "GUC" : "EXTERNAL",
          capacity: 20 + i,
          registration_deadline: new Date(Date.UTC(2025, 9, day - 2, 23, 59, 59)),
        },
      });
    }

    // -------------------- BOOTHS --------------------
    for (let i = 1; i <= 5; i++) {
      const day = 20 + i;
      events.push({
        name: `Booth ${i} - Startup Showcase`,
        type: "Booth",
        location: `Hall ${i}`,
        short_description: `Showcase of innovative startups ${i}`,
        start_date: new Date(Date.UTC(2025, 9, day, 10, 0)),
        end_date: new Date(Date.UTC(2025, 9, day, 16, 0)),
        time: "10:00-16:00",
        status: "upcoming",
        created_by: new mongoose.Types.ObjectId(),
        booth: {
          vendors: [
            { vendor_name: `Startup ${i}A`, company_name: `Company ${i}A` },
            { vendor_name: `Startup ${i}B`, company_name: `Company ${i}B` },
          ],
        },
      });
    }

    // -------------------- CONFERENCES --------------------
    const conferenceNames = ["Tech", "Innovation", "Science", "AI", "Blockchain"];
    for (let i = 0; i < conferenceNames.length; i++) {
      const day = 25 + i;
      events.push({
        name: `${conferenceNames[i]} Conference 2025`,
        type: "Conference",
        location: `Campus ${i + 1}`,
        short_description: `Annual ${conferenceNames[i]} conference`,
        start_date: new Date(Date.UTC(2025, 9, day, 9, 0)),
        end_date: new Date(Date.UTC(2025, 9, day, 17, 0)),
        time: "09:00-17:00",
        status: "upcoming",
        created_by: new mongoose.Types.ObjectId(),
        conference: {
          campus: i % 2 === 0 ? "GUC" : "GUC Berlin",
          full_agenda: "Opening, Keynotes, Workshops",
          professors_participating: [`Prof. ${i}A`, `Prof. ${i}B`],
          conference_website: `https://conf${i}.example.com`,
          required_budget: 3000 + i * 500,
          funding_source: i % 2 === 0 ? "GUC" : "EXTERNAL",
        },
      });
    }

    // Insert all events
    await Event.insertMany(events);
    console.log(`Seeded ${events.length} events successfully!`);
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
};

seedEvents();
