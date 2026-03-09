import type { NextFunction, Request, Response } from "express";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // MVP: простая обёртка. Далее можно расширить логированием и кодами ошибок.
  console.error("API error:", err);
  res.status(500).json({ error: "Internal server error" });
}

