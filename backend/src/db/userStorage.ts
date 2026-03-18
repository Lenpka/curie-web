import { query } from "./postgres";

export type UserRole = "user" | "admin";
export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

// Емэйл
export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const norm = email.trim().toLowerCase();
  const rows = await query<{
    id: number;
    email: string;
    password_hash: string;
    role: string;
    created_at: string;
  }>(
    "SELECT id, email, password_hash, role, created_at FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
    [norm]
  );
  const row = rows[0];
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
export async function findUserById(id: string): Promise<UserRecord | null> {
  const rows = await query<{
    id: number;
    email: string;
    password_hash: string;
    role: string;
    created_at: string;
  }>(
    "SELECT id, email, password_hash, role, created_at FROM users WHERE id = $1 LIMIT 1",
    [Number(id)]
  );
  const row = rows[0];
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
export async function createUser( //Емайл, пароль и доступ на вход
  email: string,
  passwordHash: string,
  role?: UserRole
): // конец входа
 Promise<UserRecord> {
  const norm = email.trim().toLowerCase();
  const existing = await query<{ id: number }>(
    "SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
    [norm]
  );
  if (existing[0]) throw new Error("USER_EXISTS");

  const countRows = await query<{ count: string }>("SELECT COUNT(*)::text as count FROM users");
  const total = Number(countRows[0]?.count ?? "0");
  const isFirst = total === 0;

  const roleToSet = role ?? (isFirst ? "admin" : "user");
  const createdRows = await query<{
    id: number;
    email: string;
    password_hash: string;
    role: string;
    created_at: string;
  }>(
    "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, password_hash, role, created_at",
    [norm, passwordHash, roleToSet]
  );
  const row = createdRows[0];
  return {
    id: String(row.id),
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role as UserRole,
    createdAt: row.created_at
  };
}

/** При старте: один пользователь → admin; все из ADMIN_EMAILS → admin. */
export async function ensureFirstUserIsAdmin(adminEmails: string[] = []): Promise<void> {
  const countRows = await query<{ count: string }>("SELECT COUNT(*)::text as count FROM users");
  const total = Number(countRows[0]?.count ?? "0");
  if (total === 0) return;

  const list = adminEmails.map((e) => e.trim().toLowerCase()).filter(Boolean);

  const firstRows = await query<{ id: number; role: string }>(
    "SELECT id, role FROM users ORDER BY id ASC LIMIT 1"
  );
  const first = firstRows[0];
  if (first && first.role !== "admin") {
    await query("UPDATE users SET role = 'admin' WHERE id = $1", [first.id]);
  }
  if (list.length > 0) {
    await query(
      "UPDATE users SET role = 'admin' WHERE LOWER(email) = ANY($1::text[]) AND role <> 'admin'",
      [list]
    );
  }
}
 