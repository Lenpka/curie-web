"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLabelRoute = registerLabelRoute;
const path_1 = __importDefault(require("path"));
const fileStorage_1 = require("../db/fileStorage");
const auth_1 = require("../middleware/auth");
const labelService_1 = require("../services/labelService");
const cifMulter_1 = require("../utils/cifMulter");
function csvEscapeCell(val) {
    const s = String(val);
    if (/[",\n\r]/.test(s)) {
        return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
}
function parseOptionalNumber(v) {
    if (v === undefined || v === null || v === "")
        return undefined;
    const n = typeof v === "number" ? v : parseFloat(String(v));
    return Number.isFinite(n) ? n : undefined;
}
function parseLabelBody(req) {
    const b = req.body;
    const formula = typeof b.formula === "string" ? b.formula : String(b.formula ?? "");
    const tcValue = parseOptionalNumber(b.tcValue);
    const tcUnit = b.tcUnit === "C" ? "C" : "K";
    const structureType = typeof b.structureType === "string" && b.structureType.trim()
        ? b.structureType.trim().slice(0, 500)
        : undefined;
    const synagonia = typeof b.synagonia === "string" && b.synagonia.trim()
        ? b.synagonia.trim()
        : undefined;
    const anisotropyMJm3 = parseOptionalNumber(b.anisotropy ?? b.anisotropyMJm3);
    const easyAxis = typeof b.easyAxis === "string" && b.easyAxis.trim()
        ? b.easyAxis.trim().slice(0, 500)
        : undefined;
    const source = typeof b.source === "string" && b.source.trim()
        ? b.source.trim()
        : undefined;
    const comment = typeof b.comment === "string" && b.comment.trim()
        ? b.comment.trim()
        : undefined;
    return {
        formula,
        tcValue,
        tcUnit,
        structureType,
        synagonia,
        anisotropyMJm3,
        easyAxis,
        source,
        comment,
        cifFile: req.file
    };
}
function registerLabelRoute(router) {
    router.get("/labels", auth_1.requireAuth, auth_1.requireAdmin, (_req, res) => {
        try {
            const labels = (0, fileStorage_1.readUserLabels)();
            const format = _req.query.format;
            if (format === "csv") {
                res.setHeader("Content-Type", "text/csv; charset=utf-8");
                res.setHeader("Content-Disposition", "attachment; filename=\"user_labels.csv\"");
                const rows = labels.map((r) => [
                    csvEscapeCell(r.formula),
                    csvEscapeCell(r.curieTcK != null && Number.isFinite(r.curieTcK)
                        ? r.curieTcK.toFixed(2)
                        : ""),
                    csvEscapeCell(r.structureType ?? ""),
                    csvEscapeCell(r.synagonia ?? ""),
                    csvEscapeCell(r.anisotropyMJm3 != null && Number.isFinite(r.anisotropyMJm3)
                        ? r.anisotropyMJm3.toFixed(6)
                        : ""),
                    csvEscapeCell(r.easyAxis ?? ""),
                    csvEscapeCell(r.cifStoredName ?? ""),
                    csvEscapeCell(r.source ?? ""),
                    csvEscapeCell((r.comment ?? "").replace(/\n/g, " ")),
                    csvEscapeCell(r.createdAt),
                    csvEscapeCell(r.clientIp ?? "")
                ].join(","));
                return res.send(fileStorage_1.LABEL_HEADER + rows.join("\n"));
            }
            return res.json({ labels });
        }
        catch (err) {
            console.error("Labels read error:", err);
            return res.status(500).json({ error: "Failed to read labels" });
        }
    });
    router.post("/label", (req, res, next) => {
        const ct = req.headers["content-type"] || "";
        if (ct.includes("multipart/form-data")) {
            return cifMulter_1.labelCifUpload.single("cif")(req, res, (err) => {
                if (err) {
                    return res.status(400).json({
                        error: err instanceof Error ? err.message : "Upload failed"
                    });
                }
                next();
            });
        }
        next();
    }, (req, res) => {
        const parsed = parseLabelBody(req);
        const { formula, tcValue, tcUnit, structureType, synagonia, anisotropyMJm3, easyAxis, source, comment, cifFile } = parsed;
        if (typeof formula !== "string" || !formula.trim()) {
            return res.status(400).json({ error: "Field 'formula' is required" });
        }
        if (tcValue !== undefined && !Number.isFinite(tcValue)) {
            return res.status(400).json({ error: "Field 'tcValue' must be a valid number when provided" });
        }
        if (tcValue !== undefined && tcUnit !== "K" && tcUnit !== "C") {
            return res.status(400).json({ error: "Field 'tcUnit' must be 'K' or 'C'" });
        }
        let cifStoredName;
        const createdAt = new Date().toISOString();
        try {
            if (cifFile) {
                const storedName = path_1.default.basename(cifFile.filename || cifFile.path || "");
                cifStoredName = storedName || undefined;
                if (cifStoredName) {
                    (0, fileStorage_1.appendUserCifMetadata)({
                        originalName: cifFile.originalname || storedName,
                        storedName: cifStoredName,
                        formula: formula.trim(),
                        comment: comment ?? "",
                        createdAt,
                        clientIp: req.ip
                    });
                }
            }
            (0, labelService_1.saveUserLabel)({
                formula,
                tcValue,
                tcUnit,
                structureType,
                synagonia,
                anisotropyMJm3,
                easyAxis,
                cifStoredName,
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
