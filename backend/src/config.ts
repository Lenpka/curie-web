export const config = {
  port: Number(process.env.PORT) || 3000,
  modelServiceUrl: process.env.MODEL_SERVICE_URL || "http://localhost:8001",
  /** Без PostgreSQL: npm start с SKIP_DB=1 — работает /api/predict, auth/label упадут при обращении */
  skipDb: process.env.SKIP_DB === "1",
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

