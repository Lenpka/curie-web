"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAGNETIC_CLASSES = void 0;
exports.appendUserLabel = appendUserLabel;
exports.readUserLabels = readUserLabels;
exports.appendUserClassification = appendUserClassification;
exports.readUserClassifications = readUserClassifications;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_DIR = process.env.DATA_DIR || path_1.default.join(process.cwd(), "data");
const LABELS_CSV = path_1.default.join(DATA_DIR, "user_labels.csv");
const CLASSIFICATIONS_CSV = path_1.default.join(DATA_DIR, "user_classifications.csv");
const HEADER = "formula,Curie_TC_K,synagonia,source,comment,created_at,client_ip\n";
const CLASS_HEADER = "formula,magnetic_class,created_at,client_ip\n";
exports.MAGNETIC_CLASSES = [
    "ferromagnet",
    "antiferromagnet",
    "ferrimagnet",
    "diamagnet",
    "paramagnet"
];
function appendUserLabel(record) {
    if (!fs_1.default.existsSync(DATA_DIR)) {
        fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
    }
    const isNewFile = !fs_1.default.existsSync(LABELS_CSV);
    const line = [
        record.formula,
        record.curieTcK.toFixed(2),
        record.synagonia ?? "",
        record.source ?? "",
        (record.comment ?? "").replace(/\r?\n/g, " "),
        record.createdAt,
        record.clientIp ?? ""
    ].join(",") + "\n";
    if (isNewFile) {
        fs_1.default.writeFileSync(LABELS_CSV, HEADER + line, { encoding: "utf8" });
    }
    else {
        fs_1.default.appendFileSync(LABELS_CSV, line, { encoding: "utf8" });
    }
}
function readUserLabels() {
    if (!fs_1.default.existsSync(LABELS_CSV)) {
        return [];
    }
    const raw = fs_1.default.readFileSync(LABELS_CSV, "utf8");
    const lines = raw.trim().split("\n");
    if (lines.length < 2)
        return [];
    const records = [];
    for (let i = 1; i < lines.length; i++) {
        const parts = parseCsvLine(lines[i]);
        if (parts.length >= 5) {
            records.push({
                formula: parts[0],
                curieTcK: Number(parts[1]) || 0,
                synagonia: parts[2] || undefined,
                source: parts[3] || undefined,
                comment: parts[4] || undefined,
                createdAt: parts[5] ?? "",
                clientIp: parts[6] || undefined
            });
        }
    }
    return records;
}
function parseCsvLine(line) {
    const out = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
            inQuotes = !inQuotes;
        }
        else if (inQuotes) {
            cur += c;
        }
        else if (c === ",") {
            out.push(cur);
            cur = "";
        }
        else {
            cur += c;
        }
    }
    out.push(cur);
    return out;
}
function appendUserClassification(record) {
    if (!fs_1.default.existsSync(DATA_DIR)) {
        fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
    }
    const isNewFile = !fs_1.default.existsSync(CLASSIFICATIONS_CSV);
    const line = [
        record.formula,
        record.magneticClass,
        record.createdAt,
        record.clientIp ?? ""
    ].join(",") + "\n";
    if (isNewFile) {
        fs_1.default.writeFileSync(CLASSIFICATIONS_CSV, CLASS_HEADER + line, { encoding: "utf8" });
    }
    else {
        fs_1.default.appendFileSync(CLASSIFICATIONS_CSV, line, { encoding: "utf8" });
    }
}
function readUserClassifications() {
    if (!fs_1.default.existsSync(CLASSIFICATIONS_CSV))
        return [];
    const raw = fs_1.default.readFileSync(CLASSIFICATIONS_CSV, "utf8");
    const lines = raw.trim().split("\n");
    if (lines.length < 2)
        return [];
    const records = [];
    for (let i = 1; i < lines.length; i++) {
        const parts = parseCsvLine(lines[i]);
        if (parts.length >= 2 && exports.MAGNETIC_CLASSES.includes(parts[1])) {
            records.push({
                formula: parts[0],
                magneticClass: parts[1],
                createdAt: parts[2] ?? "",
                clientIp: parts[3] || undefined
            });
        }
    }
    return records;
}
