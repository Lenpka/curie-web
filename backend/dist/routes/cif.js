"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCifRoute = registerCifRoute;
const fileStorage_1 = require("../db/fileStorage");
const auth_1 = require("../middleware/auth");
const cifMulter_1 = require("../utils/cifMulter");
function registerCifRoute(router) {
    router.post("/cif/upload", auth_1.requireAuth, (req, res, next) => {
        (0, cifMulter_1.ensureUserCifDir)();
        cifMulter_1.bulkCifUpload.array("files", 20)(req, res, (err) => {
            if (err) {
                return res.status(400).json({
                    error: err instanceof Error ? err.message : "Upload failed"
                });
            }
            next();
        });
    }, (req, res) => {
        const formula = String(req.body?.formula ?? "")
            .replace(/\r?\n/g, " ")
            .trim();
        const comment = String(req.body?.comment ?? "")
            .replace(/\r?\n/g, " ")
            .trim();
        const clientIp = req.ip;
        const files = (req.files ?? []);
        try {
            if (!files.length) {
                return res.status(400).json({ error: "No files uploaded" });
            }
            const createdAt = new Date().toISOString();
            for (const f of files) {
                const originalName = f.originalname;
                const storedName = f.filename || "";
                (0, fileStorage_1.appendUserCifMetadata)({
                    originalName,
                    storedName,
                    formula,
                    comment,
                    createdAt,
                    clientIp
                });
            }
            return res.json({ status: "ok", uploaded: files.length });
        }
        catch (e) {
            console.error("CIF upload error:", e);
            return res.status(500).json({ error: "Failed to upload CIF" });
        }
    });
}
