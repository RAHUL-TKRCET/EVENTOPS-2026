import fs from "fs";
import path from "path";
import { Client } from "pg";
import { config } from "../config";

async function runMigrations() {
  console.log("==================================================================");
  console.log("🛠️  EVENTOPS 2026 — PostgreSQL Database Architecture Migration");
  console.log("==================================================================");

  // 1. Check or create target database
  const rootClient = new Client({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: "postgres", // Connect to system database first
  });

  try {
    await rootClient.connect();
    console.log("[PostgreSQL] Connected to system cluster.");

    const dbCheck = await rootClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [config.database.database]
    );

    if (dbCheck.rows.length === 0) {
      console.log(`[PostgreSQL] Database '${config.database.database}' does not exist. Creating...`);
      await rootClient.query(`CREATE DATABASE "${config.database.database}"`);
      console.log(`[PostgreSQL] Database '${config.database.database}' created successfully!`);
    } else {
      console.log(`[PostgreSQL] Target database '${config.database.database}' verified.`);
    }
  } catch (err: any) {
    console.warn(`[PostgreSQL] Warning checking root database: ${err.message}. Proceeding directly...`);
  } finally {
    await rootClient.end().catch(() => {});
  }

  // 2. Connect to target database and apply schema
  const appClient = new Client({
    connectionString: config.database.url,
  });

  try {
    await appClient.connect();
    console.log(`[PostgreSQL] Connected to target database '${config.database.database}'.`);

    const schemaPath = path.join(__dirname, "schema.sql");
    const sql = fs.readFileSync(schemaPath, "utf-8");

    console.log("[PostgreSQL] Executing DDL statements from schema.sql...");
    await appClient.query(sql);

    // 3. Verify created tables
    const tablesRes = await appClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log("\n✅ Database Schema Migration Completed Successfully!");
    console.log(`📊 Verified ${tablesRes.rows.length} Core Tables:`);
    tablesRes.rows.forEach((r: any, idx: number) => {
      console.log(`   ${String(idx + 1).padStart(2, " ")}. ${r.table_name}`);
    });
    console.log("==================================================================");
  } catch (err: any) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  } finally {
    await appClient.end();
  }
}

runMigrations();
