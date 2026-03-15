export const config = {
  port: Number(process.env.PORT) || 3000,
  modelServiceUrl: process.env.MODEL_SERVICE_URL || "http://localhost:8001",
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100
  },
  bodyLimit: "100kb",
  sessionSecret: process.env.SESSION_SECRET || "change-me-in-production"
};

