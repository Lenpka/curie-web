import type { Request, Response, Router } from "express";

import { appendUserCifMetadata } from "../db/fileStorage";
import { requireAuth } from "../middleware/auth";
import { bulkCifUpload, ensureUserCifDir } from "../utils/cifMulter";

export function registerCifRoute(router: Router): void {
  router.post(
    "/cif/upload",
    requireAuth,
    (req, res, next) => {
      ensureUserCifDir();
      bulkCifUpload.array("files", 20)(req, res, (err) => {
        if (err) {
          return res.status(400).json({
            error: err instanceof Error ? err.message : "Upload failed"
          });
        }
        next();
      });
    },
    (req: Request, res: Response) => {
      const formula = String(req.body?.formula ?? "")
        .replace(/\r?\n/g, " ")
        .trim();
      const comment = String(req.body?.comment ?? "")
        .replace(/\r?\n/g, " ")
        .trim();
      const clientIp = req.ip;
      const files = (req.files ?? []) as Array<{
        originalname: string;
        filename: string;
      }>;

      try {
        if (!files.length) {
          return res.status(400).json({ error: "No files uploaded" });
        }

        const createdAt = new Date().toISOString();

        for (const f of files) {
          const originalName = f.originalname;
          const storedName = f.filename || "";
          appendUserCifMetadata({
            originalName,
            storedName,
            formula,
            comment,
            createdAt,
            clientIp
          });
        }

        return res.json({ status: "ok", uploaded: files.length });
      } catch (e) {
        console.error("CIF upload error:", e);
        return res.status(500).json({ error: "Failed to upload CIF" });
      }
    }
  );
}
