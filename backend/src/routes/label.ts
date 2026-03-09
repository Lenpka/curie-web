import type { Request, Response, Router } from "express";
import { saveUserLabel } from "../services/labelService";

export function registerLabelRoute(router: Router): void {
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

