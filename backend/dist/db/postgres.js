"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDb = initDb;
exports.query = query;
const pg_1 = require("pg");
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL
});
async function initDb() {
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
async function query(text, params = []) {
    const res = await pool.query(text, params);
    return res.rows;
}
