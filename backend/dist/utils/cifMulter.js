"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkCifUpload = exports.labelCifUpload = exports.USER_CIF_DIR = void 0;
exports.ensureUserCifDir = ensureUserCifDir;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const multer_1 = __importDefault(require("multer"));
const DATA_DIR = process.env.DATA_DIR || path_1.default.join(process.cwd(), "data");
exports.USER_CIF_DIR = path_1.default.join(DATA_DIR, "user_cifs");
function ensureUserCifDir() {
    if (!fs_1.default.existsSync(DATA_DIR))
        fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs_1.default.existsSync(exports.USER_CIF_DIR))
        fs_1.default.mkdirSync(exports.USER_CIF_DIR, { recursive: true });
}
function randomStoredName(original) {
    const ext = path_1.default.extname(original).toLowerCase();
    const safeExt = ext === ".cif" ? ".cif" : ".cif";
    return crypto_1.default.randomBytes(16).toString("hex") + safeExt;
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        try {
            ensureUserCifDir();
            cb(null, exports.USER_CIF_DIR);
        }
        catch (e) {
            cb(e, exports.USER_CIF_DIR);
        }
    },
    filename: (_req, file, cb) => {
        cb(null, randomStoredName(file.originalname));
    }
});
const fileFilter = (_req, file, cb) => {
    const name = (file.originalname || "").toLowerCase();
    if (!name.endsWith(".cif")) {
        return cb(new Error("Only .cif files are allowed"));
    }
    cb(null, true);
};
/** Один CIF (форма разметки); то же хранилище, что и у /api/cif/upload */
exports.labelCifUpload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 25 * 1024 * 1024 }
});
/** Несколько файлов (страница «только CIF») */
exports.bulkCifUpload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        files: 20,
        fileSize: 25 * 1024 * 1024
    }
});
