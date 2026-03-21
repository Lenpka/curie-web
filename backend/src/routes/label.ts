import type { Request, Response, Router } from "express";
import path from "path";

import { appendUserCifMetadata, LABEL_HEADER, readUserLabels } from "../db/fileStorage";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { saveUserLabel } from "../services/labelService";
import { labelCifUpload } from "../utils/cifMulter";

function csvEscapeCell(val: string | number): string {
  const s = String(val);
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function parseOptionalNumber(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : undefined;
}

function parseLabelBody(req: Request): {
  formula: string;
  tcValue: number;
  tcUnit: "K" | "C";
  structureType?: string;
  synagonia?: string;
  anisotropyMJm3?: number;
  easyAxis?: string;
  source?: string;
  comment?: string;
  cifFile?: Express.Multer.File;
} {
  const multipart = req.is("multipart/form-data");
  const b = req.body;

  const formula = typeof b.formula === "string" ? b.formula : String(b.formula ?? "");
  const tcRaw = multipart ? parseFloat(String(b.tcValue ?? "")) : Number(b.tcValue);
  const tcUnit = b.tcUnit === "C" ? "C" : "K";
  const structureType =
    typeof b.structureType === "string" && b.structureType.trim()
      ? b.structureType.trim().slice(0, 500)
      : undefined;
  const synagonia =
    typeof b.synagonia === "string" && b.synagonia.trim()
      ? b.synagonia.trim()
      : undefined;
  const anisotropyMJm3 = parseOptionalNumber(b.anisotropy ?? b.anisotropyMJm3);
  const easyAxis =
    typeof b.easyAxis === "string" && b.easyAxis.trim()
      ? b.easyAxis.trim().slice(0, 500)
      : undefined;
  const source =
    typeof b.source === "string" && b.source.trim()
      ? b.source.trim()
      : undefined;
  const comment =
    typeof b.comment === "string" && b.comment.trim()
      ? b.comment.trim()
      : undefined;

  return {
    formula,
    tcValue: tcRaw,
    tcUnit,
    synagonia,
    anisotropyMJm3,
    easyAxis,
    source,
    comment,
    cifFile: req.file
  };
}

export function registerLabelRoute(router: Router): void {
  router.get("/labels", requireAuth, requireAdmin, (_req: Request, res: Response) => {
    try {
      const labels = readUserLabels();
      const format = _req.query.format as string | undefined;
      if (format === "csv") {
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", "attachment; filename=\"user_labels.csv\"");
        const rows = labels.map((r) =>
          [
            csvEscapeCell(r.formula),
            csvEscapeCell(r.curieTcK.toFixed(2)),
            csvEscapeCell(r.structureType ?? ""),
            csvEscapeCell(r.synagonia ?? ""),
            csvEscapeCell(
              r.anisotropyMJm3 != null && Number.isFinite(r.anisotropyMJm3)
                ? r.anisotropyMJm3.toFixed(6)
                : ""
            ),
            csvEscapeCell(r.easyAxis ?? ""),
            csvEscapeCell(r.cifStoredName ?? ""),
            csvEscapeCell(r.source ?? ""),
            csvEscapeCell((r.comment ?? "").replace(/\n/g, " ")),
            csvEscapeCell(r.createdAt),
            csvEscapeCell(r.clientIp ?? "")
          ].join(",")
        );
        return res.send(LABEL_HEADER + rows.join("\n"));
      }
      return res.json({ labels });
    } catch (err) {
      console.error("Labels read error:", err);
      return res.status(500).json({ error: "Failed to read labels" });
    }
  });

  router.post(
    "/label",
    (req, res, next) => {
      const ct = req.headers["content-type"] || "";
      if (ct.includes("multipart/form-data")) {
        return labelCifUpload.single("cif")(req, res, (err) => {
          if (err) {
            return res.status(400).json({
              error: err instanceof Error ? err.message : "Upload failed"
            });
          }
          next();
        });
      }
      next();
    },
    (req: Request, res: Response) => {
      const parsed = parseLabelBody(req);

      const {
        formula,
        tcValue,
        tcUnit,
        structureType,
        synagonia,
        anisotropyMJm3,
        easyAxis,
        source,
        comment,
        cifFile
      } = parsed;

      if (typeof formula !== "string" || !formula.trim()) {
        return res.status(400).json({ error: "Field 'formula' is required" });
      }
      if (typeof tcValue !== "number" || !Number.isFinite(tcValue)) {
        return res.status(400).json({ error: "Field 'tcValue' must be a number" });
      }
      if (tcUnit !== "K" && tcUnit !== "C") {
        return res.status(400).json({ error: "Field 'tcUnit' must be 'K' or 'C'" });
      }

      let cifStoredName: string | undefined;
      const createdAt = new Date().toISOString();

      try {
        if (cifFile) {
          const storedName = path.basename(cifFile.filename || cifFile.path || "");
          cifStoredName = storedName || undefined;
          if (cifStoredName) {
            appendUserCifMetadata({
              originalName: cifFile.originalname || storedName,
              storedName: cifStoredName,
              formula: formula.trim(),
              comment: comment ?? "",
              createdAt,
              clientIp: req.ip
            });
          }
        }

        saveUserLabel({
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
      } catch (err) {
        console.error("Label save error:", err);
        return res.status(500).json({ error: "Failed to save label" });
      }
    }
  );
}
