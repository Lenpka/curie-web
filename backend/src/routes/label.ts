import type { Request, Response, Router } from "express";
import { readUserLabels } from "../db/fileStorage";
import { saveUserLabel } from "../services/labelService";
import { requireAuth, requireAdmin } from "../middleware/auth";

export function registerLabelRoute(router: Router): void {
  router.get("/labels", requireAuth, requireAdmin, (_req: Request, res: Response) => {
    try {
      const labels = readUserLabels();
      const format = _req.query.format as string | undefined;
      if (format === "csv") {
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        const header = "formula,Curie_TC_K,synagonia,source,comment,created_at,client_ip\n";
        const rows = labels.map(
          (r) =>
            [r.formula, r.curieTcK.toFixed(2), r.synagonia ?? "", r.source ?? "", (r.comment ?? "").replace(/\n/g, " "), r.createdAt, r.clientIp ?? ""].join(",")
        );
        return res.send(header + rows.join("\n"));
      }
      return res.json({ labels });
    } catch (err) {
      console.error("Labels read error:", err);
      return res.status(500).json({ error: "Failed to read labels" });
    }
  });

  router.post("/label", (req: Request, res: Response) => {
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
      saveUserLabel({
        formula,
        tcValue,
        tcUnit,
        synagonia,
        source,
        comment,
        clientIp: req.ip
      });
      return res.json({ status: "ok" });
    } catch (err) {
      console.error("Label save error:", err);
      return res.status(500).json({ error: "Failed to save label" });
    }
  });
}

