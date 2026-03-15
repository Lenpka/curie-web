"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveUserClassification = saveUserClassification;
const fileStorage_1 = require("../db/fileStorage");
function saveUserClassification(payload) {
    const formula = payload.formula.trim();
    if (!formula)
        throw new Error("FORMULA_REQUIRED");
    const raw = payload.magneticClass?.trim().toLowerCase();
    if (!raw || !fileStorage_1.MAGNETIC_CLASSES.includes(raw)) {
        throw new Error("INVALID_CLASS");
    }
    (0, fileStorage_1.appendUserClassification)({
        formula,
        magneticClass: raw,
        createdAt: new Date().toISOString(),
        clientIp: payload.clientIp
    });
}
