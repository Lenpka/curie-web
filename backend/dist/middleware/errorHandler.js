"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, _req, res, _next) {
    // MVP: простая обёртка. Далее можно расширить логированием и кодами ошибок.
    console.error("API error:", err);
    res.status(500).json({ error: "Internal server error" });
}
