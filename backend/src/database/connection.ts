import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { PGlite } from "@electric-sql/pglite";
import { config } from "../config";

export class DatabaseService {
  private static instance: DatabaseService;
  private pool: Pool | null = null;
  private pglite: PGlite | null = null;
  public engineType: "EXTERNAL_POSTGRES" | "EMBEDDED_POSTGRES" = "EMBEDDED_POSTGRES";

  private constructor() {
    try {
      this.pool = new Pool({
        connectionString: config.database.url,
        connectionTimeoutMillis: 1500,
      });
    } catch {
      this.pool = null;
    }
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initDatabase(): Promise<void> {
    // 1. Try external PostgreSQL connection first
    if (this.pool) {
      try {
        const client = await this.pool.connect();
        const res = await client.query("SELECT version()");
        client.release();
        this.engineType = "EXTERNAL_POSTGRES";
        console.log(`[PostgreSQL] Connected to External PostgreSQL Server:`, res.rows[0].version.split(" ")[0]);
        return;
      } catch {
        console.log("[PostgreSQL] External PostgreSQL server offline. Booting embedded PostgreSQL engine...");
      }
    }

    // 2. Initialize embedded PostgreSQL engine with persistence in ./data/postgres
    const dataDir = path.resolve(process.cwd(), "data/postgres");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.pglite = new PGlite(dataDir);
    this.engineType = "EMBEDDED_POSTGRES";
    console.log(`[PostgreSQL] Embedded PostgreSQL 16 engine initialized at ${dataDir}`);

    // 3. Ensure schema and initial seed data are applied
    await this.ensureSchema();
  }

  private async ensureSchema(): Promise<void> {
    try {
      const checkRes = await this.query(`
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'events';
      `);

      const tableExists = parseInt(checkRes.rows[0].count, 10) > 0;
      if (!tableExists) {
        const candidateSchemaPaths = [
          path.resolve(__dirname, "schema.sql"),
          path.resolve(process.cwd(), "src/database/schema.sql"),
          path.resolve(process.cwd(), "backend/src/database/schema.sql"),
        ];
        const schemaPath = candidateSchemaPaths.find((p) => fs.existsSync(p));

        const candidateSeedPaths = [
          path.resolve(__dirname, "seed.sql"),
          path.resolve(process.cwd(), "src/database/seed.sql"),
          path.resolve(process.cwd(), "backend/src/database/seed.sql"),
        ];
        const seedPath = candidateSeedPaths.find((p) => fs.existsSync(p));

        if (schemaPath) {
          const schemaSql = fs.readFileSync(schemaPath, "utf-8");
          await this.exec(schemaSql);
          console.log("[PostgreSQL] Base schema applied (23 core tables, indexes, constraints).");
        }

        if (seedPath) {
          const seedSql = fs.readFileSync(seedPath, "utf-8");
          await this.exec(seedSql);
          console.log("[PostgreSQL] Initial seed dataset loaded (Organizations, 9-role accounts, Events, Venues).");
        }
      } else {
        console.log("[PostgreSQL] Database tables verified and active.");
      }
    } catch (err: any) {
      console.warn("[PostgreSQL] Schema initialization note:", err.message);
    }
  }

  public async query(text: string, params?: any[]): Promise<{ rows: any[]; rowCount: number }> {
    if (this.engineType === "EXTERNAL_POSTGRES" && this.pool) {
      const res = await this.pool.query(text, params);
      return { rows: res.rows, rowCount: res.rowCount || res.rows.length };
    }

    if (this.pglite) {
      const res = await this.pglite.query(text, params);
      return { rows: res.rows, rowCount: res.rows.length };
    }

    return { rows: [], rowCount: 0 };
  }

  public async exec(sql: string): Promise<void> {
    if (this.engineType === "EXTERNAL_POSTGRES" && this.pool) {
      await this.pool.query(sql);
      return;
    }

    if (this.pglite) {
      await this.pglite.exec(sql);
    }
  }
}

export const db = DatabaseService.getInstance();
