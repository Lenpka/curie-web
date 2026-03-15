"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserByEmail = findUserByEmail;
exports.findUserById = findUserById;
exports.createUser = createUser;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_DIR = process.env.DATA_DIR || path_1.default.join(process.cwd(), "data");
const USERS_FILE = path_1.default.join(DATA_DIR, "users.json");
// Убедится в наличии директории с данными иначе - создать
function ensureDataDir() {
    if (!fs_1.default.existsSync(DATA_DIR)) {
        fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
    }
}
//Загрузить данные
function loadUsers() {
    ensureDataDir(); // Рекурсивно берем данные
    if (!fs_1.default.existsSync(USERS_FILE)) {
        return [];
    }
    const row = fs_1.default.readFileSync(USERS_FILE, "utf-8");
    try {
        const data = JSON.parse(row);
        return Array.isArray(data.users) ? data.users : [];
    }
    catch {
        return [];
    }
}
// Сохранение пользователей
function saveUsers(users) {
    ensureDataDir();
    fs_1.default.writeFileSync(USERS_FILE, JSON.stringify({ users }, null, 2), "utf8");
}
// Переход ко следующему
function nextId(users) {
    const max = users.reduce((m, u) => {
        const n = parseInt(u.id, 10);
        return Number.isFinite(n) && n > m ? n : m;
    }, 0);
    return String(max + 1);
}
// Емэйл
function findUserByEmail(email) {
    const users = loadUsers();
    const norm = email.trim().toLowerCase();
    return users.find((u) => u.email.toLowerCase() === norm) ?? null;
}
// Id
function findUserById(id) {
    const users = loadUsers();
    return users.find((u) => u.id === id) ?? null;
}
// Создание пользователя
function createUser(//Емайл, пароль и доступ на вход
email, passwordHash, role) {
    const users = loadUsers();
    const norm = email.trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === norm)) {
        throw new Error("USER_EXISTS");
    }
    const isFirst = users.length === 0;
    const newUser = {
        id: nextId(users),
        email: norm,
        passwordHash,
        role: role ?? (isFirst ? "admin" : "user"),
        createdAt: new Date().toISOString()
    };
    users.push(newUser);
    saveUsers(users);
    return newUser;
}
