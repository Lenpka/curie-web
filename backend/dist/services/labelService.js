"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveUserLabel = saveUserLabel;
const fileStorage_1 = require("../db/fileStorage");
function saveUserLabel(payload) {
    const { formula, tcValue, tcUnit, synagonia, source, comment, clientIp } = payload;
    const curieTcK = tcUnit === "K" ? tcValue : tcValue + 273.15;
    const createdAt = new Date().toISOString();
    (0, fileStorage_1.appendUserLabel)({
        formula: formula.trim(),
        curieTcK,
        synagonia,
        source,
        comment,
        createdAt,
        clientIp
    });
}
