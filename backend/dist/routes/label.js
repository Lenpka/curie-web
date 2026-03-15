"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLabelRoute = registerLabelRoute;
const fileStorage_1 = require("../db/fileStorage");
const labelService_1 = require("../services/labelService");
const auth_1 = require("../middleware/auth");
function registerLabelRoute(router) {
    router.get("/labels", auth_1.requireAuth, auth_1.requireAdmin, (_req, res) => {
        try {
            const labels = (0, fileStorage_1.readUserLabels)();
            const format = _req.query.format;
            if (format === "csv") {
                res.setHeader("Content-Type", "text/csv; charset=utf-8");
                const header = "formula,Curie_TC_K,synagonia,source,comment,created_at,client_ip\n";
                const rows = labels.map((r) => [r.formula, r.curieTcK.toFixed(2), r.synagonia ?? "", r.source ?? "", (r.comment ?? "").replace(/\n/g, " "), r.createdAt, r.clientIp ?? ""].join(","));
                return res.send(header + rows.join("\n"));
            }
            return res.json({ labels });
        }
        catch (err) {
            console.error("Labels read error:", err);
            return res.status(500).json({ error: "Failed to read labels" });
        }
    });
    router.post("/label", (req, res) => {
        const { formula, tcValue, tcUnit, synagonia, source, comment } = req.body;
        if (typeof formula !== "string" || !formula.trim()) {
            return res.status(400).json({ error: "Field 'formula' is required" });
        }
        if (typeof tcValue !== "number" || !Number.isFinite(tcValue)) {
            return res.status(400).json({ error: "Field 'tcValue' must be a number" });
        }
        if (tcUnit !== "K" && tcUnit !== "C") {
            return res
                .status(400)
                .json({ error: "Field 'tcUnit' must be 'K' or 'C'" });
        }
        try {
            (0, labelService_1.saveUserLabel)({
                formula,
                tcValue,
                tcUnit,
                synagonia,
                source,
                comment,
                clientIp: req.ip
            });
            return res.json({ status: "ok" });
        }
        catch (err) {
            console.error("Label save error:", err);
            return res.status(500).json({ error: "Failed to save label" });
        }
    });
}
