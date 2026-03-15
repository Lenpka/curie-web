import fs from "fs";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || path.join (process.cwd(), "data");
const USERS_FILE = path.join (DATA_DIR, "users.json");

export type UserRole = "user" | "admin";
export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}
// Убедится в наличии директории с данными иначе - создать
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {recursive: true});
  }

}
//Загрузить данные
function loadUsers(): UserRecord[] {
  ensureDataDir(); // Рекурсивно берем данные
  if (!fs.existsSync(USERS_FILE)) {
    return [];
  } 
  const row = fs.readFileSync(USERS_FILE, "utf-8");
  try{
    const data = JSON.parse(row);
    return Array.isArray(data.users) ? data.users : [];
  } catch {
    return [];
  }

}

// Сохранение пользователей
function saveUsers (users: UserRecord[]) : void{
  ensureDataDir();
  fs.writeFileSync(
    USERS_FILE,
    JSON.stringify ( { users}, null, 2),
    "utf8"
  );
}
// Переход ко следующему
function nextId (users: UserRecord[]) : string{
  const max = users.reduce( (m,u) => {
    const n = parseInt(u.id, 10);
    return Number.isFinite(n) && n > m ? n: m;
  }, 0);
  return String (max + 1);
}  

// Емэйл
export function findUserByEmail (email: string) : UserRecord | null {
const users = loadUsers();
const norm = email.trim().toLowerCase();
return users.find( (u) => u.email.toLowerCase() === norm) ?? null;

}
// Id
export function findUserById (id:string): UserRecord | null {
  const users = loadUsers();
  return users.find( (u) => u.id === id) ?? null;
}

// Создание пользователя
export function createUser ( //Емайл, пароль и доступ на вход
  email: string,
  passwordHash: string,
  role?: UserRole
): // конец входа
 UserRecord {
  const users = loadUsers();
  const norm = email.trim().toLowerCase();
  if (users.some((u) => u.email.toLowerCase() === norm)) {
    throw new Error("USER_EXISTS");
  }
  const isFirst = users.length === 0;
  const newUser: UserRecord = {
    id: nextId(users),
    email: norm,
    passwordHash,
    role: role ?? (isFirst ? "admin": "user"),
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  saveUsers(users);
  return newUser;
 }
 