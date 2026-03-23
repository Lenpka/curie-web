"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAGNETIC_CLASSES = exports.LABEL_HEADER = void 0;
exports.appendUserLabel = appendUserLabel;
exports.readUserLabels = readUserLabels;
exports.appendUserCifMetadata = appendUserCifMetadata;
exports.appendUserClassification = appendUserClassification;
exports.readUserClassifications = readUserClassifications;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_DIR = process.env.DATA_DIR || path_1.default.join(process.cwd(), "data");
const LABELS_CSV = path_1.default.join(DATA_DIR, "user_labels.csv");
const CLASSIFICATIONS_CSV = path_1.default.join(DATA_DIR, "user_classifications.csv");
const CIFS_CSV = path_1.default.join(DATA_DIR, "user_cifs.csv");
/**
 * Формат CSV: тип структуры — литературное семейство (As-type sulphides, pyrite-type и т.д.),
 * сингония — кристаллографическая система.
 */
exports.LABEL_HEADER = "formula,Curie_TC_K,structure_type,synagonia,anisotropy_MJm3,easy_axis,cif_stored_name,source,comment,created_at,client_ip\n";
const CLASS_HEADER = "formula,magnetic_class,created_at,client_ip\n";
exports.MAGNETIC_CLASSES = [
    "ferromagnet",
    "antiferromagnet",
    "ferrimagnet",
    "diamagnet",
    "paramagnet"
];
function csvEscapeCell(val) {
    const s = String(val);
    if (/[",\n\r]/.test(s)) {
        return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
}
/** v1: 7 колонок → актуальный заголовок (11 колонок) */
function migrateLabelsV1ToCurrent() {
    const raw = fs_1.default.readFileSync(LABELS_CSV, "utf8");
    const lines = raw.trim().split("\n");
    if (lines.length === 0)
        return;
    const newLines = [exports.LABEL_HEADER.trim()];
    for (let i = 1; i < lines.length; i++) {
        const parts = parseCsvLine(lines[i]);
        if (parts.length >= 7) {
            const row = [
                parts[0],
                parts[1],
                "",
                parts[2] ?? "",
                "",
                "",
                "",
                parts[3] ?? "",
                parts[4] ?? "",
                parts[5] ?? "",
                parts[6] ?? ""
            ].map(csvEscapeCell);
            newLines.push(row.join(","));
        }
    }
    fs_1.default.writeFileSync(LABELS_CSV, newLines.join("\n") + "\n", "utf8");
}
/** v2: 10 колонок без structure_type → вставить пустую колонку после T_C */
function migrateLabelsV2ToCurrent() {
    const raw = fs_1.default.readFileSync(LABELS_CSV, "utf8");
    const lines = raw.trim().split("\n");
    if (lines.length < 2) {
        fs_1.default.writeFileSync(LABELS_CSV, exports.LABEL_HEADER, "utf8");
        return;
    }
    const headerParts = parseCsvLine(lines[0]);
    const hmap = {};
    headerParts.forEach((h, idx) => {
        hmap[h.trim()] = idx;
    });
    const newLines = [exports.LABEL_HEADER.trim()];
    const g = (parts, key) => hmap[key] !== undefined ? (parts[hmap[key]] ?? "").trim() : "";
    for (let i = 1; i < lines.length; i++) {
        const parts = parseCsvLine(lines[i]);
        const row = [
            g(parts, "formula"),
            g(parts, "Curie_TC_K"),
            "",
            g(parts, "synagonia"),
            g(parts, "anisotropy_MJm3"),
            g(parts, "easy_axis"),
            g(parts, "cif_stored_name"),
            g(parts, "source"),
            g(parts, "comment"),
            g(parts, "created_at"),
            g(parts, "client_ip")
        ].map(csvEscapeCell);
        newLines.push(row.join(","));
    }
    fs_1.default.writeFileSync(LABELS_CSV, newLines.join("\n") + "\n", "utf8");
}
/** Привести user_labels.csv к текущей схеме (structure_type). */
function ensureLabelCsvMigrated() {
    if (!fs_1.default.existsSync(LABELS_CSV))
        return;
    const lines = fs_1.default.readFileSync(LABELS_CSV, "utf8").trim().split("\n");
    if (lines.length === 0)
        return;
    const h = lines[0];
    if (h.includes("structure_type"))
        return;
    if (h.includes("anisotropy_MJm3")) {
        migrateLabelsV2ToCurrent();
    }
    else {
        migrateLabelsV1ToCurrent();
    }
}
function appendUserLabel(record) {
    if (!fs_1.default.existsSync(DATA_DIR)) {
        fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs_1.default.existsSync(LABELS_CSV)) {
        ensureLabelCsvMigrated();
    }
    const isNewFile = !fs_1.default.existsSync(LABELS_CSV);
    const aniso = record.anisotropyMJm3 != null && Number.isFinite(record.anisotropyMJm3)
        ? record.anisotropyMJm3.toFixed(6)
        : "";
    const tcCell = record.curieTcK != null && Number.isFinite(record.curieTcK)
        ? record.curieTcK.toFixed(2)
        : "";
    const line = [
        csvEscapeCell(record.formula),
        csvEscapeCell(tcCell),
        csvEscapeCell(record.structureType ?? ""),
        csvEscapeCell(record.synagonia ?? ""),
        csvEscapeCell(aniso),
        csvEscapeCell(record.easyAxis ?? ""),
        csvEscapeCell(record.cifStoredName ?? ""),
        csvEscapeCell(record.source ?? ""),
        csvEscapeCell((record.comment ?? "").replace(/\r?\n/g, " ")),
        csvEscapeCell(record.createdAt),
        csvEscapeCell(record.clientIp ?? "")
    ].join(",") + "\n";
    if (isNewFile) {
        fs_1.default.writeFileSync(LABELS_CSV, exports.LABEL_HEADER + line, { encoding: "utf8" });
    }
    else {
        fs_1.default.appendFileSync(LABELS_CSV, line, { encoding: "utf8" });
    }
}
function readUserLabels() {
    if (!fs_1.default.existsSync(LABELS_CSV)) {
        return [];
    }
    ensureLabelCsvMigrated();
    const raw = fs_1.default.readFileSync(LABELS_CSV, "utf8");
    const lines = raw.trim().split("\n");
    if (lines.length < 2)
        return [];
    const headerParts = parseCsvLine(lines[0]);
    const hmap = {};
    headerParts.forEach((h, idx) => {
        hmap[h.trim()] = idx;
    });
    const isNew = hmap["anisotropy_MJm3"] !== undefined;
    const records = [];
    const g = (parts, key) => hmap[key] !== undefined ? (parts[hmap[key]] ?? "").trim() : "";
    for (let i = 1; i < lines.length; i++) {
        const parts = parseCsvLine(lines[i]);
        if (isNew) {
            const anisoRaw = g(parts, "anisotropy_MJm3");
            const tcStr = g(parts, "Curie_TC_K");
            records.push({
                formula: g(parts, "formula"),
                curieTcK: tcStr !== "" && Number.isFinite(Number(tcStr))
                    ? Number(tcStr)
                    : undefined,
                structureType: g(parts, "structure_type") || undefined,
                synagonia: g(parts, "synagonia") || undefined,
                anisotropyMJm3: anisoRaw !== "" && Number.isFinite(Number(anisoRaw))
                    ? Number(anisoRaw)
                    : undefined,
                easyAxis: g(parts, "easy_axis") || undefined,
                cifStoredName: g(parts, "cif_stored_name") || undefined,
                source: g(parts, "source") || undefined,
                comment: g(parts, "comment") || undefined,
                createdAt: g(parts, "created_at"),
                clientIp: g(parts, "client_ip") || undefined
            });
        }
        else if (parts.length >= 7) {
            const legTc = parts[1]?.trim() ?? "";
            records.push({
                formula: parts[0],
                curieTcK: legTc !== "" && Number.isFinite(Number(legTc))
                    ? Number(legTc)
                    : undefined,
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
const CIF_CSV_HEADER = "original_name,stored_name,formula,comment,created_at,client_ip\n";
/** Запись в user_cifs.csv (тот же формат, что /api/cif/upload) */
function appendUserCifMetadata(params) {
    if (!fs_1.default.existsSync(DATA_DIR))
        fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
    const isNew = !fs_1.default.existsSync(CIFS_CSV);
    const line = [
        params.originalName,
        params.storedName,
        params.formula,
        params.comment,
        params.createdAt,
        params.clientIp ?? ""
    ]
        .map((x) => `"${String(x).replace(/"/g, '""')}"`)
        .join(",") + "\n";
    if (isNew) {
        fs_1.default.writeFileSync(CIFS_CSV, CIF_CSV_HEADER + line, "utf8");
    }
    else {
        fs_1.default.appendFileSync(CIFS_CSV, line, "utf8");
    }
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
// NOTE: user storage is implemented in `src/db/userStorage.ts` (Postgres).
