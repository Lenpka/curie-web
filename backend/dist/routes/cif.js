"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCifRoute = registerCifRoute;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const DATA_DIR = process.env.DATA_DIR || path_1.default.join(process.cwd(), "data");
const CIF_DIR = path_1.default.join(DATA_DIR, "user_cifs");
const CIFS_CSV = path_1.default.join(DATA_DIR, "user_cifs.csv");
const CIF_HEADER = "original_name,stored_name,formula,comment,created_at,client_ip\n";
function ensureDataDir() {
    if (!fs_1.default.existsSync(DATA_DIR))
        fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs_1.default.existsSync(CIF_DIR))
        fs_1.default.mkdirSync(CIF_DIR, { recursive: true });
    if (!fs_1.default.existsSync(CIFS_CSV)) {
        fs_1.default.writeFileSync(CIFS_CSV, CIF_HEADER, { encoding: "utf8" });
    }
}
function sanitizeText(s) {
    return String(s ?? "").replace(/\r?\n/g, " ").trim();
}
function randomName(original) {
    const ext = path_1.default.extname(original).toLowerCase();
    const safeExt = ext === ".cif" ? ".cif" : ".cif";
    return crypto_1.default.randomBytes(16).toString("hex") + safeExt;
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        try {
            ensureDataDir();
            cb(null, CIF_DIR);
        }
        catch (e) {
            cb(e, CIF_DIR);
        }
    },
    filename: (_req, file, cb) => {
        const stored = randomName(file.originalname);
        cb(null, stored);
    }
});
const fileFilter = (_req, file, cb) => {
    const name = (file.originalname || "").toLowerCase();
    const ok = name.endsWith(".cif");
    if (!ok)
        return cb(new Error("Only .cif files are allowed"));
    cb(null, true);
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        files: 20,
        fileSize: 25 * 1024 * 1024 // 25MB per file
    }
});
function registerCifRoute(router) {
    router.post("/cif/upload", auth_1.requireAuth, upload.array("files", 20), (req, res) => {
        const formula = sanitizeText(req.body?.formula);
        const comment = sanitizeText(req.body?.comment);
        const clientIp = req.ip;
        const files = (req.files ?? []);
        try {
            ensureDataDir();
            if (!files.length) {
                return res.status(400).json({ error: "No files uploaded" });
            }
            const createdAt = new Date().toISOString();
            for (const f of files) {
                const originalName = f.originalname;
                const storedName = path_1.default.basename(f.filename || "");
                const line = [
                    originalName,
                    storedName,
                    formula,
                    comment,
                    createdAt,
                    clientIp
                ]
                    .map((x) => `"${String(x).replace(/"/g, '""')}"`)
                    .join(",") + "\n";
                fs_1.default.appendFileSync(CIFS_CSV, line, { encoding: "utf8" });
            }
            return res.json({ status: "ok", uploaded: files.length });
        }
        catch (e) {
            console.error("CIF upload error:", e);
            return res.status(500).json({ error: "Failed to upload CIF" });
        }
    });
}
