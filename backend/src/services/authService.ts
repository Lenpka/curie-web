import bcrypt from "bcrypt";
import {
  createUser,
  findUserByEmail,
  findUserById,
  type UserRecord
} from "../db/userStorage";

const SALT_ROUNDS = 10;

export interface AuthUser {
  id: string;
  email: string;
  role: UserRecord["role"];
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function checkPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function toAuthUser(record: UserRecord): AuthUser {
  return {
    id: record.id,
    email: record.email,
    role: record.role
  };
}

export async function register(
  email: string,
  password: string
): Promise<AuthUser> {
  if (!email?.trim()) throw new Error("EMAIL_REQUIRED");
  if (!password || password.length < 6) throw new Error("PASSWORD_TOO_SHORT");
  const passwordHash = await hashPassword(password);
  const user = createUser(email, passwordHash);
  return toAuthUser(user);
}

export async function login(
  email: string,
  password: string
): Promise<AuthUser | null> {
  const user = findUserByEmail(email);
  if (!user) return null;
  const ok = await checkPassword(password, user.passwordHash);
  return ok ? toAuthUser(user) : null;
}

export function getAuthUserById(id: string): AuthUser | null {
  const user = findUserById(id);
  return user ? toAuthUser(user) : null;
}
