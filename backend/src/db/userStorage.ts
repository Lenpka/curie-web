import { getDb } from "./sqlite";

export type UserRole = "user" | "admin";
export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

// Емэйл
export function findUserByEmail (email: string) : UserRecord | null {
  const db = getDb();
  const norm = email.trim().toLowerCase();
  const row = db
    .prepare<unknown[], { id: number; email: string; password_hash: string; role: string; created_at: string }>(
      "SELECT id, email, password_hash, role, created_at FROM users WHERE LOWER(email) = ?"
    )
    .get(norm.toLowerCase());
  if (!row) return null;
  return {
    id: String(row.id),
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role as UserRole,
    createdAt: row.created_at
  };
}
// Id
export function findUserById (id:string): UserRecord | null {
  const db = getDb();
  const row = db
    .prepare<unknown[], { id: number; email: string; password_hash: string; role: string; created_at: string }>(
      "SELECT id, email, password_hash, role, created_at FROM users WHERE id = ?"
    )
    .get(Number(id));
  if (!row) return null;
  return {
    id: String(row.id),
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role as UserRole,
    createdAt: row.created_at
  };
}

// Создание пользователя
export function createUser ( //Емайл, пароль и доступ на вход
  email: string,
  passwordHash: string,
  role?: UserRole
): // конец входа
 UserRecord {
  const db = getDb();
  const norm = email.trim().toLowerCase();

  const existing = db
    .prepare<unknown[], { id: number }>(
      "SELECT id FROM users WHERE LOWER(email) = ?"
    )
    .get(norm.toLowerCase());
  if (existing) {
    throw new Error("USER_EXISTS");
  }

  const totalRow = db
    .prepare<unknown[], { count: number }>("SELECT COUNT(*) as count FROM users")
    .get();
  const isFirst = !totalRow || totalRow.count === 0;

  const createdAt = new Date().toISOString();

  const result = db
    .prepare<[string, string, string, string]>(
      "INSERT INTO users (email, password_hash, role, created_at) VALUES (?, ?, ?, ?)"
    )
    .run(norm, passwordHash, role ?? (isFirst ? "admin" : "user"), createdAt);

  const id = typeof result.lastInsertRowid === "bigint"
    ? Number(result.lastInsertRowid)
    : (result.lastInsertRowid as number);

  return {
    id: String(id),
    email: norm,
    passwordHash,
    role: role ?? (isFirst ? "admin" : "user"),
    createdAt
  };
}

/** При старте: один пользователь → admin; все из ADMIN_EMAILS → admin. */
export function ensureFirstUserIsAdmin(adminEmails: string[] = []): void {
  const db = getDb();
  const totalRow = db
    .prepare<unknown[], { count: number }>("SELECT COUNT(*) as count FROM users")
    .get();
  const total = totalRow?.count ?? 0;
  if (total === 0) return;

  const list = adminEmails.map((e) => e.trim().toLowerCase()).filter(Boolean);

  const firstRow = db
    .prepare<unknown[], { id: number; role: string }>(
      "SELECT id, role FROM users ORDER BY id ASC LIMIT 1"
    )
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
      .prepare(
        `UPDATE users SET role = 'admin' WHERE LOWER(email) IN (${placeholders}) AND role <> 'admin'`
      )
      .run(...list);
    changed = true; // если не хотим считать реально изменённые строки, просто помечаем
  }

  db.exec("COMMIT");
}
 