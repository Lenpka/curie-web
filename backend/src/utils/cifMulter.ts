import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
export const USER_CIF_DIR = path.join(DATA_DIR, "user_cifs");

export function ensureUserCifDir(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USER_CIF_DIR)) fs.mkdirSync(USER_CIF_DIR, { recursive: true });
}

function randomStoredName(original: string): string {
  const ext = path.extname(original).toLowerCase();
  const safeExt = ext === ".cif" ? ".cif" : ".cif";
  return crypto.randomBytes(16).toString("hex") + safeExt;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      ensureUserCifDir();
      cb(null, USER_CIF_DIR);
    } catch (e) {
      cb(e as Error, USER_CIF_DIR);
    }
  },
  filename: (_req, file, cb) => {
    cb(null, randomStoredName(file.originalname));
  }
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const name = (file.originalname || "").toLowerCase();
  if (!name.endsWith(".cif")) {
    return cb(new Error("Only .cif files are allowed"));
  }
  cb(null, true);
};

/** Один CIF (форма разметки); то же хранилище, что и у /api/cif/upload */
export const labelCifUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }
});

/** Несколько файлов (страница «только CIF») */
export const bulkCifUpload = multer({
  storage,
  fileFilter,
  limits: {
    files: 20,
    fileSize: 25 * 1024 * 1024
  }
});
