/**
 * seedEvents.js
 * Run with: node scripts/seedEvents.js
 *
 * Seeds realistic event data into MongoDB.
 * Fetches real users from the DB to set organizers and optionally pre-register some users.
 *
 * ⚠️  Run from the /backend directory:
 *     > node scripts/seedEvents.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Event = require("../models/Event");
const User = require("../models/User");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/alumniConnect";

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB:", MONGO_URI);

    // Fetch real users to use as organizers
    const alumni = await User.find({ role: "alumni" }).limit(5);
    const students = await User.find({ role: "student" }).limit(10);

    if (alumni.length === 0) {
      console.error("❌ No alumni users found. Please create at least one alumni account first.");
      process.exit(1);
    }

    console.log(`👥 Found ${alumni.length} alumni and ${students.length} students`);

    // Clear existing events
    const deleted = await Event.deleteMany({});
    console.log(`🗑️  Cleared ${deleted.deletedCount} existing events`);

    const now = new Date();
    const days = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

    // Pick up to 3 students to be pre-registered for events
    const preRegistered = students.slice(0, 3).map(s => s._id);

    // Build events — one featured + several upcoming
    const events = [
      {
        title: "Alumni Tech Talk: Cracking Big Tech Interviews 🚀",
        description:
          "Join our panel of alumni from Google, Amazon, and Microsoft as they break down exactly how to ace technical interviews. Cover DSA, system design, and behavioral rounds with live Q&A.",
        organizer: alumni[0]._id,
        organizerName: alumni[0].name,
        eventType: "webinar",
        mode: "online",
        location: null,
        startDate: days(3),
        endDate: new Date(days(3).getTime() + 2 * 60 * 60 * 1000),
        meetingLink: "https://meet.google.com/alumni-tech-talk",
        capacity: 150,
        registrants: preRegistered,
        tags: ["interview", "tech", "DSA", "career"],
        isFeatured: true,
        status: "upcoming"
      },
      {
        title: "Resume Workshop: Stand Out in the Job Market",
        description:
          "An interactive workshop where alumni HR professionals review your resume in real time. Learn what recruiters look for and common mistakes to avoid. Limited to 30 participants.",
        organizer: alumni[0]._id,
        organizerName: alumni[0].name,
        eventType: "workshop",
        mode: "online",
        location: null,
        startDate: days(5),
        endDate: new Date(days(5).getTime() + 90 * 60 * 1000),
        meetingLink: "https://zoom.us/j/resume-workshop",
        capacity: 30,
        registrants: preRegistered.slice(0, 1),
        tags: ["resume", "career", "HR", "workshop"],
        isFeatured: false,
        status: "upcoming"
      },
      {
        title: "Startup Networking Night",
        description:
          "Connect with alumni founders, investors, and fellow students passionate about entrepreneurship. Speed-networking rounds followed by panel discussion. Refreshments provided.",
        organizer: alumni.length > 1 ? alumni[1]._id : alumni[0]._id,
        organizerName: alumni.length > 1 ? alumni[1].name : alumni[0].name,
        eventType: "networking",
        mode: "offline",
        location: "Main Campus Auditorium, Room 204",
        startDate: days(8),
        endDate: new Date(days(8).getTime() + 3 * 60 * 60 * 1000),
        meetingLink: null,
        capacity: 80,
        registrants: preRegistered,
        tags: ["startup", "networking", "entrepreneurship"],
        isFeatured: false,
        status: "upcoming"
      },
      {
        title: "Full-Stack Hackathon: Build for Social Good",
        description:
          "48-hour hackathon where teams of 3-4 build web apps addressing real social problems. Mentors available throughout. Prizes: ₹50,000 for 1st place, ₹25,000 for 2nd, ₹10,000 for 3rd.",
        organizer: alumni.length > 2 ? alumni[2]._id : alumni[0]._id,
        organizerName: alumni.length > 2 ? alumni[2].name : alumni[0].name,
        eventType: "hackathon",
        mode: "hybrid",
        location: "Engineering Block B, Labs 1-4",
        startDate: days(14),
        endDate: new Date(days(14).getTime() + 48 * 60 * 60 * 1000),
        meetingLink: "https://discord.gg/hackathon-social",
        capacity: 200,
        registrants: preRegistered.slice(0, 2),
        tags: ["hackathon", "fullstack", "prizes", "social-good"],
        isFeatured: false,
        status: "upcoming"
      },
      {
        title: "Industry Panel: Career Paths in AI & Machine Learning",
        description:
          "Five alumni working in AI/ML across different sectors share their journeys — from academia to product companies to research labs. Open Q&A after the panel.",
        organizer: alumni.length > 3 ? alumni[3]._id : alumni[0]._id,
        organizerName: alumni.length > 3 ? alumni[3].name : alumni[0].name,
        eventType: "panel",
        mode: "online",
        location: null,
        startDate: days(10),
        endDate: new Date(days(10).getTime() + 2 * 60 * 60 * 1000),
        meetingLink: "https://teams.microsoft.com/ai-ml-panel",
        capacity: 100,
        registrants: preRegistered.slice(0, 2),
        tags: ["AI", "ML", "career", "panel"],
        isFeatured: false,
        status: "upcoming"
      },
      {
        title: "Office Hours: 1-on-1 Mock Interviews with Alumni",
        description:
          "Book a 30-minute mock interview slot with an alumni mentor from your field. Available specialisations: Software Engineering, Data Science, Finance, and Product Management.",
        organizer: alumni.length > 4 ? alumni[4]._id : alumni[0]._id,
        organizerName: alumni.length > 4 ? alumni[4].name : alumni[0].name,
        eventType: "other",
        mode: "online",
        location: null,
        startDate: days(2),
        endDate: new Date(days(2).getTime() + 4 * 60 * 60 * 1000),
        meetingLink: "https://calendly.com/alumni-mock-interviews",
        capacity: 40,
        registrants: preRegistered.slice(0, 1),
        tags: ["mock-interview", "mentoring", "career"],
        isFeatured: false,
        status: "upcoming"
      },
      {
        title: "Alumni Homecoming & Annual Meetup 2026",
        description:
          "The biggest alumni event of the year! Reconnect with batchmates, meet current students, and celebrate achievements. Dinner included. Bring your alumni ID.",
        organizer: alumni[0]._id,
        organizerName: alumni[0].name,
        eventType: "networking",
        mode: "offline",
        location: "University Convention Centre, Hall A",
        startDate: days(21),
        endDate: new Date(days(21).getTime() + 6 * 60 * 60 * 1000),
        meetingLink: null,
        capacity: 500,
        registrants: preRegistered,
        tags: ["alumni", "homecoming", "meetup", "networking"],
        isFeatured: false,
        status: "upcoming"
      }
    ];

    const inserted = await Event.insertMany(events);
    console.log(`\n🎉 Seeded ${inserted.length} events successfully!\n`);

    inserted.forEach((ev, i) => {
      console.log(
        `  [${i + 1}] ${ev.title}`
        + `\n       📅 ${ev.startDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}`
        + `\n       👥 Organizer: ${ev.organizerName} | Capacity: ${ev.capacity} | Registered: ${ev.registrants.length}`
        + (ev.isFeatured ? "\n       ⭐ FEATURED" : "")
        + "\n"
      );
    });

    if (preRegistered.length > 0) {
      console.log(`📌 Pre-registered students (up to 3) for select events:`);
      students.slice(0, 3).forEach(s => console.log(`   - ${s.name} (${s.email})`));
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
}

seed();
