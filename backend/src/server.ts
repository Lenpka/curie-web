import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import session from "express-session";

import { config } from "./config";
import { initDb } from "./db/postgres";
import { ensureFirstUserIsAdmin } from "./db/userStorage";
import { apiRateLimiter } from "./middleware/rateLimit";
import { errorHandler } from "./middleware/errorHandler";
import { registerPredictRoute } from "./routes/predict";
import { registerLabelRoute } from "./routes/label";
import { registerClassifyRoute } from "./routes/classify";
import { registerCifRoute } from "./routes/cif";
import { registerAuthRoutes } from "./routes/auth";

async function main() {
  if (config.skipDb) {
    console.warn(
      "SKIP_DB=1: PostgreSQL не инициализирован. Работают статика и /api/predict; вход и разметка без БД не работают."
    );
  } else {
    try {
      await initDb();
      await ensureFirstUserIsAdmin(config.adminEmails);
    } catch (e) {
      if (config.requireDb) {
        throw e;
      }
      console.warn(
        "PostgreSQL недоступен при старте (initDb / ensureFirstUserIsAdmin). Продолжаем без БД: статика и /api/predict. Вход и разметка не будут работать, пока не восстановите DATABASE_URL или не задайте SKIP_DB=1. Чтобы снова падать при ошибке БД, задайте REQUIRE_DB=1.",
        e
      );
    }
  }

  const app = express();

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use(cookieParser());
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax"
    }
  })
);
app.use(express.json({ limit: config.bodyLimit }));

// Сначала статика, чтобы главная страница и скрипты грузились без 404
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));

app.use("/api", apiRateLimiter);
const apiRouter = express.Router();
registerAuthRoutes(apiRouter);
registerPredictRoute(apiRouter);
registerLabelRoute(apiRouter);
registerClassifyRoute(apiRouter);
  registerCifRoute(apiRouter);
app.use("/api", apiRouter);

app.use(errorHandler);

  app.listen(config.port, () => {
    console.log(`Backend listening on port ${config.port}`);
  });
}

main().catch((e) => {
  console.error("Startup error:", e);
  process.exit(1);
});