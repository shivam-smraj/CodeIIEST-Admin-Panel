/**
 * seed.mjs — Seeds events from events.json and leaderboard users from data.json
 * Run: node scripts/seed.mjs
 *
 * For leaderboard users: creates User accounts with:
 *   - email derived from the "Email Address" field
 *   - password = their roll number (Enrollment No) uppercased
 *   - enrollmentYear derived from email prefix (e.g. 2024xxx... → 2024)
 *   - codeforcesId from "CodeForces handle"
 *   - role = "user" (alumni entries get role = "alumni")
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import * as dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error("MONGO_URI not set in .env.local"); process.exit(1); }

// ──────────────── Schemas ────────────────

const EventSchema = new mongoose.Schema({
  title:            { type: String, required: true },
  miniTitle:        { type: String, required: true },
  description:      { type: String, required: true },
  imageVariant:     String,
  AvatarSampleData: [{ name: String, img: String }],
  TagsList:         [String],
  sideDetails1:     { text1: String, text2: String, text3: String },
  sideDetails2:     { text1: String, text2: String, text3: String },
  completionStatus: { type: Number, default: 0 },
  moreInfo:         { type: String, default: "#" },
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  email:          { type: String, required: true, unique: true, lowercase: true },
  displayName:    { type: String, default: "" },
  passwordHash:   { type: String },
  role:           { type: String, enum: ["user","admin","superadmin","alumni"], default: "user" },
  codeforcesId:   { type: String, default: "" },
  enrollmentYear: { type: Number },
  enrollmentNo:   { type: String, default: "" },
  provider:       { type: String, default: "credentials" },
}, { timestamps: true });

const Event = mongoose.models.Event ?? mongoose.model("Event", EventSchema);
const User  = mongoose.models.User  ?? mongoose.model("User",  UserSchema);

// ──────────────── Data ────────────────

const eventsData = JSON.parse(
  readFileSync(path.resolve(__dirname, "events.json"), "utf-8")
);

const leaderboardData = JSON.parse(
  readFileSync(path.resolve(__dirname, "data.json"), "utf-8")
);

// ──────────────── Helpers ────────────────

function parseEnrollmentYear(email, enrollmentNo) {
  // Try from email prefix "2024xxx..."
  const emailMatch = email?.match(/^(\d{4})/);
  if (emailMatch) return parseInt(emailMatch[1]);
  // Try from enrollmentNo "2024ITB004"
  const noMatch = String(enrollmentNo || "").match(/^(\d{4})/);
  if (noMatch) return parseInt(noMatch[1]);
  return null;
}

function isAlumni(entry) {
  return entry.Timestamp === "Alumni" || String(entry["Email Address"]).match(/^\d{4}$/);
}

// ──────────────── Seed ────────────────

async function seedEvents(force = false) {
  const existing = await Event.countDocuments();
  if (existing > 0 && !force) {
    console.log(`ℹ️  Events already seeded (${existing} events). Use --force to re-seed.`);
    return;
  }
  const inserted = await Event.insertMany(eventsData);
  console.log(`✅ Seeded ${inserted.length} events.`);
}

async function seedUsers() {
  let created = 0, skipped = 0, errors = 0;

  for (const entry of leaderboardData) {
    const email = String(entry["Email Address"] || "").toLowerCase().trim();
    const cfHandle = String(entry["CodeForces handle"] || "").trim();
    const fullName = String(entry["Full Name"] || "").trim();
    const enrollmentNo = String(entry["Enrollment No"] || "").trim();

    // Skip entries without a proper email
    if (!email.includes("@") && !email.match(/^\d{4}$/)) {
      skipped++;
      continue;
    }

    // Password = enrollment number (uppercased), fallback to "CODEIIEST2024"
    const password = enrollmentNo && enrollmentNo !== "-"
      ? enrollmentNo.toUpperCase()
      : "CODEIIEST2024";

    const enrollmentYear = parseEnrollmentYear(email, enrollmentNo);
    const role = isAlumni(entry) ? "alumni" : "user";

    // For alumni with just year as email, construct a fake unique email
    const finalEmail = email.includes("@") ? email : `alumni-${cfHandle.toLowerCase()}@alumni.iiests.ac.in`;

    // Skip if CF handle is empty or has spaces
    if (!cfHandle || cfHandle.includes(" ")) {
      skipped++;
      continue;
    }

    try {
      const exists = await User.findOne({ email: finalEmail });
      if (exists) { skipped++; continue; }

      const passwordHash = await bcrypt.hash(password, 10);
      await User.create({
        email:         finalEmail,
        displayName:   fullName,
        passwordHash,
        role,
        codeforcesId:  cfHandle,
        enrollmentYear,
        enrollmentNo,
        provider:      "credentials",
      });
      created++;
      console.log(`  ✓ ${fullName} (${cfHandle}) [${password}]`);
    } catch (err) {
      console.error(`  ✗ Failed for ${email}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n✅ Users: ${created} created, ${skipped} skipped, ${errors} errors.`);
}

// ──────────────── Main ────────────────

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected.\n");

  console.log("── Seeding Events ──");
  await seedEvents();

  console.log("\n── Seeding Leaderboard Users ──");
  await seedUsers();

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch(err => { console.error(err); process.exit(1); });
