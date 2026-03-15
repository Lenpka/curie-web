"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerClassifyRoute = registerClassifyRoute;
const fileStorage_1 = require("../db/fileStorage");
const classifyService_1 = require("../services/classifyService");
const auth_1 = require("../middleware/auth");
function registerClassifyRoute(router) {
    router.get("/classifications", auth_1.requireAuth, auth_1.requireAdmin, (req, res) => {
        try {
            const list = (0, fileStorage_1.readUserClassifications)();
            const format = req.query.format;
            if (format === "csv") {
                res.setHeader("Content-Type", "text/csv; charset=utf-8");
                const header = "formula,magnetic_class,created_at,client_ip\n";
                const rows = list.map((r) => [r.formula, r.magneticClass, r.createdAt, r.clientIp ?? ""].join(","));
                return res.send(header + rows.join("\n"));
            }
            return res.json({ classifications: list });
        }
        catch (err) {
            console.error("Classifications read error:", err);
            return res.status(500).json({ error: "Failed to read classifications" });
        }
    });
    router.get("/classify/options", (_req, res) => {
        return res.json({ classes: [...fileStorage_1.MAGNETIC_CLASSES] });
    });
    router.post("/classify", (req, res) => {
        const { formula, magneticClass } = req.body ?? {};
        if (typeof formula !== "string" || !formula.trim()) {
            return res.status(400).json({ error: "Field 'formula' is required" });
        }
        if (typeof magneticClass !== "string" || !magneticClass.trim()) {
            return res.status(400).json({ error: "Field 'magneticClass' is required" });
        }
        try {
            (0, classifyService_1.saveUserClassification)({
                formula: formula.trim(),
                magneticClass: magneticClass.trim(),
                clientIp: req.ip
            });
            return res.json({ status: "ok" });
        }
        catch (e) {
            if (e.message === "INVALID_CLASS") {
                return res.status(400).json({
                    error: "magneticClass must be one of: " + fileStorage_1.MAGNETIC_CLASSES.join(", ")
                });
            }
            console.error("Classify save error:", e);
            return res.status(500).json({ error: "Failed to save classification" });
        }
    });
}
