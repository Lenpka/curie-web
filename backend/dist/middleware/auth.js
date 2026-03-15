"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireAdmin = requireAdmin;
const authService_1 = require("../services/authService");
function requireAuth(req, res, next) {
    const userId = req.session?.userId;
    if (!userId) {
        res.status(401).json({ error: "Unauthorized", code: "auth_required" });
        return;
    }
    const user = (0, authService_1.getAuthUserById)(userId);
    if (!user) {
        req.session = undefined;
        res.status(401).json({ error: "Unauthorized", code: "auth_required" });
        return;
    }
    req.user = user;
    next();
}
function requireAdmin(req, res, next) {
    if (!req.user) {
        res.status(401).json({ error: "Unauthorized", code: "auth_required" });
        return;
    }
    if (req.user.role !== "admin") {
        res.status(403).json({ error: "Forbidden", code: "admin_required" });
        return;
    }
    next();
}
