import type { Request, Response, Router } from "express";
import {
  readUserClassifications,
  MAGNETIC_CLASSES
} from "../db/fileStorage";
import { saveUserClassification } from "../services/classifyService";
import { requireAuth, requireAdmin } from "../middleware/auth";

export function registerClassifyRoute(router: Router): void {
  router.get(
    "/classifications",
    requireAuth,
    requireAdmin,
    (req: Request, res: Response) => {
      try {
        const list = readUserClassifications();
        const format = req.query.format as string | undefined;
        if (format === "csv") {
          res.setHeader("Content-Type", "text/csv; charset=utf-8");
          const header = "formula,magnetic_class,created_at,client_ip\n";
          const rows = list.map(
            (r) => [r.formula, r.magneticClass, r.createdAt, r.clientIp ?? ""].join(",")
          );
          return res.send(header + rows.join("\n"));
        }
        return res.json({ classifications: list });
      } catch (err) {
        console.error("Classifications read error:", err);
        return res.status(500).json({ error: "Failed to read classifications" });
      }
    }
  );

  router.get("/classify/options", (_req: Request, res: Response) => {
    return res.json({ classes: [...MAGNETIC_CLASSES] });
  });

  router.post("/classify", (req: Request, res: Response) => {
    const { formula, magneticClass } = req.body ?? {};
    if (typeof formula !== "string" || !formula.trim()) {
      return res.status(400).json({ error: "Field 'formula' is required" });
    }
    if (typeof magneticClass !== "string" || !magneticClass.trim()) {
      return res.status(400).json({ error: "Field 'magneticClass' is required" });
    }
    try {
      saveUserClassification({
        formula: formula.trim(),
        magneticClass: magneticClass.trim(),
        clientIp: req.ip
      });
      return res.json({ status: "ok" });
    } catch (e: any) {
      if (e.message === "INVALID_CLASS") {
        return res.status(400).json({
          error: "magneticClass must be one of: " + MAGNETIC_CLASSES.join(", ")
        });
      }
      console.error("Classify save error:", e);
      return res.status(500).json({ error: "Failed to save classification" });
    }
  });
}
