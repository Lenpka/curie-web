"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserByEmail = findUserByEmail;
exports.findUserById = findUserById;
exports.createUser = createUser;
exports.ensureFirstUserIsAdmin = ensureFirstUserIsAdmin;
const sqlite_1 = require("./sqlite");
// Емэйл
function findUserByEmail(email) {
    const db = (0, sqlite_1.getDb)();
    const norm = email.trim().toLowerCase();
    const row = db
        .prepare("SELECT id, email, password_hash, role, created_at FROM users WHERE LOWER(email) = ?")
        .get(norm.toLowerCase());
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
function findUserById(id) {
    const db = (0, sqlite_1.getDb)();
    const row = db
        .prepare("SELECT id, email, password_hash, role, created_at FROM users WHERE id = ?")
        .get(Number(id));
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
function createUser(//Емайл, пароль и доступ на вход
email, passwordHash, role) {
    const db = (0, sqlite_1.getDb)();
    const norm = email.trim().toLowerCase();
    const existing = db
        .prepare("SELECT id FROM users WHERE LOWER(email) = ?")
        .get(norm.toLowerCase());
    if (existing) {
        throw new Error("USER_EXISTS");
    }
    const totalRow = db
        .prepare("SELECT COUNT(*) as count FROM users")
        .get();
    const isFirst = !totalRow || totalRow.count === 0;
    const createdAt = new Date().toISOString();
    const result = db
        .prepare("INSERT INTO users (email, password_hash, role, created_at) VALUES (?, ?, ?, ?)")
        .run(norm, passwordHash, role ?? (isFirst ? "admin" : "user"), createdAt);
    const id = typeof result.lastInsertRowid === "bigint"
        ? Number(result.lastInsertRowid)
        : result.lastInsertRowid;
    return {
        id: String(id),
        email: norm,
        passwordHash,
        role: role ?? (isFirst ? "admin" : "user"),
        createdAt
    };
}
/** При старте: один пользователь → admin; все из ADMIN_EMAILS → admin. */
function ensureFirstUserIsAdmin(adminEmails = []) {
    const db = (0, sqlite_1.getDb)();
    const totalRow = db
        .prepare("SELECT COUNT(*) as count FROM users")
        .get();
    const total = totalRow?.count ?? 0;
    if (total === 0)
        return;
    const list = adminEmails.map((e) => e.trim().toLowerCase()).filter(Boolean);
    const firstRow = db
        .prepare("SELECT id, role FROM users ORDER BY id ASC LIMIT 1")
        .get();
    db.exec("BEGIN");
    let changed = false;
    if (firstRow && firstRow.role !== "admin") {
        db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(firstRow.id);
        changed = true;
    }
    if (list.length > 0) {
        const placeholders = list.map(() => "?").join(", ");
        db
            .prepare(`UPDATE users SET role = 'admin' WHERE LOWER(email) IN (${placeholders}) AND role <> 'admin'`)
            .run(...list);
        changed = true; // если не хотим считать реально изменённые строки, просто помечаем
    }
    db.exec("COMMIT");
}
