"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_session_1 = __importDefault(require("express-session"));
const config_1 = require("./config");
const userStorage_1 = require("./db/userStorage");
const rateLimit_1 = require("./middleware/rateLimit");
const errorHandler_1 = require("./middleware/errorHandler");
const predict_1 = require("./routes/predict");
const label_1 = require("./routes/label");
const classify_1 = require("./routes/classify");
const auth_1 = require("./routes/auth");
(0, userStorage_1.ensureFirstUserIsAdmin)(config_1.config.adminEmails);
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: true,
    credentials: true
}));
app.use((0, cookie_parser_1.default)());
app.use((0, express_session_1.default)({
    secret: config_1.config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "lax"
    }
}));
app.use(express_1.default.json({ limit: config_1.config.bodyLimit }));
// Сначала статика, чтобы главная страница и скрипты грузились без 404
const publicDir = path_1.default.join(__dirname, "..", "public");
app.use(express_1.default.static(publicDir));
app.use("/api", rateLimit_1.apiRateLimiter);
const apiRouter = express_1.default.Router();
(0, auth_1.registerAuthRoutes)(apiRouter);
(0, predict_1.registerPredictRoute)(apiRouter);
(0, label_1.registerLabelRoute)(apiRouter);
(0, classify_1.registerClassifyRoute)(apiRouter);
app.use("/api", apiRouter);
app.use(errorHandler_1.errorHandler);
app.listen(config_1.config.port, () => {
    console.log(`Backend listening on port ${config_1.config.port}`);
});
