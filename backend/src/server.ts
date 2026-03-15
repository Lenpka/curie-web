import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import session from "express-session";

import { config } from "./config";
import { ensureFirstUserIsAdmin } from "./db/userStorage";
import { apiRateLimiter } from "./middleware/rateLimit";
import { errorHandler } from "./middleware/errorHandler";
import { registerPredictRoute } from "./routes/predict";
import { registerLabelRoute } from "./routes/label";
import { registerClassifyRoute } from "./routes/classify";
import { registerAuthRoutes } from "./routes/auth";

ensureFirstUserIsAdmin(config.adminEmails);

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
app.use("/api", apiRouter);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Backend listening on port ${config.port}`);
});