"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserByEmail = findUserByEmail;
exports.findUserById = findUserById;
exports.createUser = createUser;
exports.ensureFirstUserIsAdmin = ensureFirstUserIsAdmin;
const postgres_1 = require("./postgres");
// Емэйл
async function findUserByEmail(email) {
    const norm = email.trim().toLowerCase();
    const rows = await (0, postgres_1.query)("SELECT id, email, password_hash, role, created_at FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1", [norm]);
    const row = rows[0];
    if (!row)
        return null;
    return {
        id: String(row.id),
        email: row.email,
        passwordHash: row.password_hash,
        role: row.role,
        createdAt: row.created_at
    };
}
// Id
async function findUserById(id) {
    const rows = await (0, postgres_1.query)("SELECT id, email, password_hash, role, created_at FROM users WHERE id = $1 LIMIT 1", [Number(id)]);
    const row = rows[0];
    if (!row)
        return null;
    return {
        id: String(row.id),
        email: row.email,
        passwordHash: row.password_hash,
        role: row.role,
        createdAt: row.created_at
    };
}
// Создание пользователя
async function createUser(//Емайл, пароль и доступ на вход
email, passwordHash, role) {
    const norm = email.trim().toLowerCase();
    const existing = await (0, postgres_1.query)("SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1", [norm]);
    if (existing[0])
        throw new Error("USER_EXISTS");
    const countRows = await (0, postgres_1.query)("SELECT COUNT(*)::text as count FROM users");
    const total = Number(countRows[0]?.count ?? "0");
    const isFirst = total === 0;
    const roleToSet = role ?? (isFirst ? "admin" : "user");
    const createdRows = await (0, postgres_1.query)("INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, password_hash, role, created_at", [norm, passwordHash, roleToSet]);
    const row = createdRows[0];
    return {
        id: String(row.id),
        email: row.email,
        passwordHash: row.password_hash,
        role: row.role,
        createdAt: row.created_at
    };
}
/** При старте: один пользователь → admin; все из ADMIN_EMAILS → admin. */
async function ensureFirstUserIsAdmin(adminEmails = []) {
    const countRows = await (0, postgres_1.query)("SELECT COUNT(*)::text as count FROM users");
    const total = Number(countRows[0]?.count ?? "0");
    if (total === 0)
        return;
    const list = adminEmails.map((e) => e.trim().toLowerCase()).filter(Boolean);
    const firstRows = await (0, postgres_1.query)("SELECT id, role FROM users ORDER BY id ASC LIMIT 1");
    const first = firstRows[0];
    if (first && first.role !== "admin") {
        await (0, postgres_1.query)("UPDATE users SET role = 'admin' WHERE id = $1", [first.id]);
    }
    if (list.length > 0) {
        await (0, postgres_1.query)("UPDATE users SET role = 'admin' WHERE LOWER(email) = ANY($1::text[]) AND role <> 'admin'", [list]);
    }
}
