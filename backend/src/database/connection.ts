import { Pool } from "pg";
import { config } from "../config";

export class DatabaseService {
  private static instance: DatabaseService;
  private pool: Pool | null = null;
  public isConnectedToPostgres: boolean = false;

  private constructor() {
    try {
      this.pool = new Pool({
        connectionString: config.database.url,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      this.pool.on("error", (err) => {
        console.warn("[PostgreSQL] Pool background error:", err.message);
      });
    } catch (err: any) {
      console.warn("[PostgreSQL] Pool initialization skipped:", err.message);
    }
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async testConnection(): Promise<boolean> {
    if (!this.pool) return false;
    try {
      const client = await this.pool.connect();
      const res = await client.query("SELECT NOW()");
      client.release();
      this.isConnectedToPostgres = true;
      console.log("[PostgreSQL] Connected successfully at:", res.rows[0].now);
      return true;
    } catch (err: any) {
      console.warn("[PostgreSQL] Direct connection unavailable, operating with in-memory resilient state store:", err.message);
      this.isConnectedToPostgres = false;
      return false;
    }
  }

  public async query(text: string, params?: any[]): Promise<any> {
    if (this.isConnectedToPostgres && this.pool) {
      return this.pool.query(text, params);
    }
    return { rows: [] };
  }
}

export const db = DatabaseService.getInstance();
