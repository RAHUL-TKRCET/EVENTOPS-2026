import fs from "fs";
import path from "path";
import { Client } from "pg";
import { config } from "../config";

async function runSeed() {
  console.log("==================================================================");
  console.log("🌱  EVENTOPS 2026 — PostgreSQL Database Seeding");
  console.log("==================================================================");

  const client = new Client({
    connectionString: config.database.url,
  });

  try {
    await client.connect();
    console.log(`[PostgreSQL] Connected to target database '${config.database.database}'.`);

    const seedPath = path.join(__dirname, "seed.sql");
    const sql = fs.readFileSync(seedPath, "utf-8");

    console.log("[PostgreSQL] Executing seed SQL statements...");
    await client.query(sql);

    // Verify row counts
    const counts = await Promise.all([
      client.query("SELECT COUNT(*) FROM organizations"),
      client.query("SELECT COUNT(*) FROM users"),
      client.query("SELECT COUNT(*) FROM events"),
      client.query("SELECT COUNT(*) FROM teams"),
      client.query("SELECT COUNT(*) FROM venues"),
      client.query("SELECT COUNT(*) FROM judges"),
      client.query("SELECT COUNT(*) FROM resources"),
    ]);

    console.log("\n✅ Database Seed Completed Successfully!");
    console.log(`   - Organizations: ${counts[0].rows[0].count}`);
    console.log(`   - Users (9 Roles): ${counts[1].rows[0].count}`);
    console.log(`   - Events: ${counts[2].rows[0].count}`);
    console.log(`   - Teams: ${counts[3].rows[0].count}`);
    console.log(`   - Venues: ${counts[4].rows[0].count}`);
    console.log(`   - Judges: ${counts[5].rows[0].count}`);
    console.log(`   - Resources: ${counts[6].rows[0].count}`);
    console.log("==================================================================");
  } catch (err: any) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSeed();
