"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuthRoutes = registerAuthRoutes;
const authService_1 = require("../services/authService");
function registerAuthRoutes(router) {
    router.post("/auth/register", async (req, res) => {
        const { email, password } = req.body ?? {};
        try {
            const user = await (0, authService_1.register)(String(email ?? ""), String(password ?? ""));
            req.session = req.session || {};
            req.session.userId = user.id;
            return res.status(201).json({ user: { id: user.id, email: user.email, role: user.role } });
        }
        catch (e) {
            if (e.message === "USER_EXISTS") {
                return res.status(409).json({ error: "User with this email already exists", code: "user_exists" });
            }
            if (e.message === "EMAIL_REQUIRED") {
                return res.status(400).json({ error: "Email is required", code: "email_required" });
            }
            if (e.message === "PASSWORD_TOO_SHORT") {
                return res.status(400).json({ error: "Password must be at least 6 characters", code: "password_short" });
            }
            console.error("Register error:", e);
            return res.status(500).json({ error: "Registration failed" });
        }
    });
    router.post("/auth/login", async (req, res) => {
        const { email, password } = req.body ?? {};
        const user = await (0, authService_1.login)(String(email ?? ""), String(password ?? ""));
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password", code: "invalid_credentials" });
        }
        req.session = req.session || {};
        req.session.userId = user.id;
        return res.json({ user: { id: user.id, email: user.email, role: user.role } });
    });
    router.post("/auth/logout", (req, res) => {
        req.session = undefined;
        res.json({ ok: true });
    });
    router.get("/auth/me", (req, res) => {
        const userId = req.session?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Not logged in", code: "auth_required" });
        }
        const user = (0, authService_1.getAuthUserById)(userId);
        if (!user) {
            req.session = undefined;
            return res.status(401).json({ error: "Not logged in", code: "auth_required" });
        }
        return res.json({ user: { id: user.id, email: user.email, role: user.role } });
    });
}
