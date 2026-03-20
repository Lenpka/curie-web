import type { Request, Response, Router } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";

import { requireAuth } from "../middleware/auth";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const CIF_DIR = path.join(DATA_DIR, "user_cifs");
const CIFS_CSV = path.join(DATA_DIR, "user_cifs.csv");

const CIF_HEADER =
  "original_name,stored_name,formula,comment,created_at,client_ip\n";

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(CIF_DIR)) fs.mkdirSync(CIF_DIR, { recursive: true });
  if (!fs.existsSync(CIFS_CSV)) {
    fs.writeFileSync(CIFS_CSV, CIF_HEADER, { encoding: "utf8" });
  }
}

function sanitizeText(s: unknown): string {
  return String(s ?? "").replace(/\r?\n/g, " ").trim();
}

function randomName(original: string): string {
  const ext = path.extname(original).toLowerCase();
  const safeExt = ext === ".cif" ? ".cif" : ".cif";
  return crypto.randomBytes(16).toString("hex") + safeExt;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      ensureDataDir();
      cb(null, CIF_DIR);
    } catch (e) {
      cb(e as Error, CIF_DIR);
    }
  },
  filename: (_req, file, cb) => {
    const stored = randomName(file.originalname);
    cb(null, stored);
  }
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const name = (file.originalname || "").toLowerCase();
  const ok = name.endsWith(".cif");
  if (!ok) return cb(new Error("Only .cif files are allowed"));
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    files: 20,
    fileSize: 25 * 1024 * 1024 // 25MB per file
  }
});

export function registerCifRoute(router: Router): void {
  router.post(
    "/cif/upload",
    requireAuth,
    upload.array("files", 20),
    (req: Request, res: Response) => {
      const formula = sanitizeText(req.body?.formula);
      const comment = sanitizeText(req.body?.comment);
      const clientIp = req.ip;
      const files = (req.files ?? []) as Array<{
        originalname: string;
        filename: string;
      }>;

      try {
        ensureDataDir();
        if (!files.length) {
          return res.status(400).json({ error: "No files uploaded" });
        }

        const createdAt = new Date().toISOString();

        for (const f of files) {
          const originalName = f.originalname;
          const storedName = path.basename(f.filename || "");
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
          fs.appendFileSync(CIFS_CSV, line, { encoding: "utf8" });
        }

        return res.json({ status: "ok", uploaded: files.length });
      } catch (e) {
        console.error("CIF upload error:", e);
        return res.status(500).json({ error: "Failed to upload CIF" });
      }
    }
  );
}

