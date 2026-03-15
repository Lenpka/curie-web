"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.checkPassword = checkPassword;
exports.toAuthUser = toAuthUser;
exports.register = register;
exports.login = login;
exports.getAuthUserById = getAuthUserById;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userStorage_1 = require("../db/userStorage");
const SALT_ROUNDS = 10;
function hashPassword(plain) {
    return bcryptjs_1.default.hash(plain, SALT_ROUNDS);
}
function checkPassword(plain, hash) {
    return bcryptjs_1.default.compare(plain, hash);
}
function toAuthUser(record) {
    return {
        id: record.id,
        email: record.email,
        role: record.role
    };
}
async function register(email, password) {
    if (!email?.trim())
        throw new Error("EMAIL_REQUIRED");
    if (!password || password.length < 6)
        throw new Error("PASSWORD_TOO_SHORT");
    const passwordHash = await hashPassword(password);
    const user = (0, userStorage_1.createUser)(email, passwordHash);
    return toAuthUser(user);
}
async function login(email, password) {
    const user = (0, userStorage_1.findUserByEmail)(email);
    if (!user)
        return null;
    const ok = await checkPassword(password, user.passwordHash);
    return ok ? toAuthUser(user) : null;
}
function getAuthUserById(id) {
    const user = (0, userStorage_1.findUserById)(id);
    return user ? toAuthUser(user) : null;
}
