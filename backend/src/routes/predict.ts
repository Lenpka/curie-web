import type { Request, Response, Router } from "express";
import { predictCurieTemperature } from "../services/modelService";

export function registerPredictRoute(router: Router): void {
  router.post("/predict", async (req: Request, res: Response) => {
    const { formulas } = req.body as { formulas?: unknown };

    if (!Array.isArray(formulas) || formulas.length === 0) {
      return res
        .status(400)
        .json({ error: "Field 'formulas' must be a non-empty array of strings" });
    }

    const cleaned = formulas
      .map((f) => (typeof f === "string" ? f.trim() : ""))
      .filter((f) => f.length > 0);

    if (cleaned.length === 0) {
      return res
        .status(400)
        .json({ error: "No valid formulas provided after cleanup" });
    }

    try {
      const results = await predictCurieTemperature(cleaned);
      return res.json({ results });
    } catch (err) {
      console.error("Predict error:", err);
      return res.status(502).json({ error: "Model service unavailable" });
    }
  });
}

