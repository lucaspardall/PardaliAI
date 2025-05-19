import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";

// Create PostgreSQL client with prepared statements
const sql = neon(process.env.DATABASE_URL || "postgresql://user:pass@localhost:5432/cipshopee");

// Initialize drizzle client with the PostgreSQL client
export const db = drizzle(sql);
