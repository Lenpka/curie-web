"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveUserLabel = saveUserLabel;
const fileStorage_1 = require("../db/fileStorage");
function saveUserLabel(payload) {
    const { formula, tcValue, tcUnit, structureType, synagonia, anisotropyMJm3, easyAxis, cifStoredName, source, comment, clientIp } = payload;
    let curieTcK;
    if (tcValue != null && Number.isFinite(tcValue)) {
        const unit = tcUnit === "C" ? "C" : "K";
        curieTcK = unit === "K" ? tcValue : tcValue + 273.15;
    }
    const createdAt = new Date().toISOString();
    (0, fileStorage_1.appendUserLabel)({
        formula: formula.trim(),
        curieTcK,
        structureType: structureType?.trim() || undefined,
        synagonia,
        anisotropyMJm3,
        easyAxis: easyAxis?.trim() || undefined,
        cifStoredName,
        source,
        comment,
        createdAt,
        clientIp
    });
}
