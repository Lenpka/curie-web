function envFlag(name: string): boolean {
  const v = (process.env[name] || "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  modelServiceUrl: process.env.MODEL_SERVICE_URL || "http://localhost:8001",
  /** Без PostgreSQL: SKIP_DB=1 — работает /api/predict, auth/label без БД не работают */
  skipDb: envFlag("SKIP_DB"),
  /** Если initDb упал (истёк хост, неверный URL), не валить весь процесс — только при отсутствии REQUIRE_DB=1 */
  requireDb: envFlag("REQUIRE_DB"),
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100
  },
  bodyLimit: "100kb",
  sessionSecret: process.env.SESSION_SECRET || "change-me-in-production",
  /** Список email, которым при старте выставляется роль admin (переменная ADMIN_EMAILS, через запятую). */
  adminEmails: (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
};

