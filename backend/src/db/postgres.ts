import { Pool, type QueryResultRow } from "pg";

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

export async function initDb(): Promise<void> {
  // минимальная "миграция" для MVP: таблица пользователей
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
    const res = await pool.query<T>(text, params as any[]);
    return res.rows;
}