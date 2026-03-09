import express from "express";
import cors from "cors";
import helmet from "helmet";

import { config } from "./config";
import { apiRateLimiter } from "./middleware/rateLimit";
import { errorHandler } from "./middleware/errorHandler";
import { registerPredictRoute } from "./routes/predict";
import { registerLabelRoute } from "./routes/label";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: "*"
  })
);
app.use(express.json({ limit: config.bodyLimit }));
app.use("/api", apiRateLimiter);

const apiRouter = express.Router();
registerPredictRoute(apiRouter);
registerLabelRoute(apiRouter);

app.use("/api", apiRouter);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Backend listening on port ${config.port}`);
});

import path from "path";

const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));