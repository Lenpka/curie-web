import fs from "fs";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const LABELS_CSV = path.join(DATA_DIR, "user_labels.csv");
const CLASSIFICATIONS_CSV = path.join(DATA_DIR, "user_classifications.csv");
const CIFS_CSV = path.join(DATA_DIR, "user_cifs.csv");

/** Новый формат: анизотропия, ось лёгкого намагничивания, имя сохранённого CIF */
export const LABEL_HEADER =
  "formula,Curie_TC_K,synagonia,anisotropy_MJm3,easy_axis,cif_stored_name,source,comment,created_at,client_ip\n";

const CLASS_HEADER = "formula,magnetic_class,created_at,client_ip\n";

export const MAGNETIC_CLASSES = [
  "ferromagnet",
  "antiferromagnet",
  "ferrimagnet",
  "diamagnet",
  "paramagnet"
] as const;

export type MagneticClass = (typeof MAGNETIC_CLASSES)[number];


export interface UserLabelRecord {
  formula: string;
  curieTcK: number;
  synagonia?: string;
  /** K_a, МДж/м³ */
  anisotropyMJm3?: number;
  /** Напр. [001], c-axis, hexagonal basal plane */
  easyAxis?: string;
  /** Имя файла в data/user_cifs/ */
  cifStoredName?: string;
  source?: string;
  comment?: string;
  createdAt: string;
  clientIp?: string;
}

function csvEscapeCell(val: string | number): string {
  const s = String(val);
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

/** Старый CSV (7 колонок данных) → новый заголовок и пустые поля для новых столбцов */
function migrateLabelsCsvIfNeeded(): void {
  if (!fs.existsSync(LABELS_CSV)) return;
  const raw = fs.readFileSync(LABELS_CSV, "utf8");
  const lines = raw.trim().split("\n");
  if (lines.length === 0) return;
  if (lines[0].includes("anisotropy_MJm3")) return;
  const newLines: string[] = [LABEL_HEADER.trim()];
  for (let i = 1; i < lines.length; i++) {
    const parts = parseCsvLine(lines[i]);
    if (parts.length >= 7) {
      const row = [
        parts[0],
        parts[1],
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
  fs.writeFileSync(LABELS_CSV, newLines.join("\n") + "\n", "utf8");
}

export function appendUserLabel(record: UserLabelRecord): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(LABELS_CSV)) {
    migrateLabelsCsvIfNeeded();
  }
  const isNewFile = !fs.existsSync(LABELS_CSV);
  const aniso =
    record.anisotropyMJm3 != null && Number.isFinite(record.anisotropyMJm3)
      ? record.anisotropyMJm3.toFixed(6)
      : "";
  const line =
    [
      csvEscapeCell(record.formula),
      csvEscapeCell(record.curieTcK.toFixed(2)),
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
    fs.writeFileSync(LABELS_CSV, LABEL_HEADER + line, { encoding: "utf8" });
  } else {
    fs.appendFileSync(LABELS_CSV, line, { encoding: "utf8" });
  }
}

export function readUserLabels(): UserLabelRecord[] {
  if (!fs.existsSync(LABELS_CSV)) {
    return [];
  }
  const raw = fs.readFileSync(LABELS_CSV, "utf8");
  const lines = raw.trim().split("\n");
  if (lines.length < 2) return [];
  const headerParts = parseCsvLine(lines[0]);
  const hmap: Record<string, number> = {};
  headerParts.forEach((h, idx) => {
    hmap[h.trim()] = idx;
  });
  const isNew = hmap["anisotropy_MJm3"] !== undefined;
  const records: UserLabelRecord[] = [];
  const g = (parts: string[], key: string) =>
    hmap[key] !== undefined ? (parts[hmap[key]] ?? "").trim() : "";

  for (let i = 1; i < lines.length; i++) {
    const parts = parseCsvLine(lines[i]);
    if (isNew) {
      const anisoRaw = g(parts, "anisotropy_MJm3");
      records.push({
        formula: g(parts, "formula"),
        curieTcK: Number(g(parts, "Curie_TC_K")) || 0,
        synagonia: g(parts, "synagonia") || undefined,
        anisotropyMJm3:
          anisoRaw !== "" && Number.isFinite(Number(anisoRaw))
            ? Number(anisoRaw)
            : undefined,
        easyAxis: g(parts, "easy_axis") || undefined,
        cifStoredName: g(parts, "cif_stored_name") || undefined,
        source: g(parts, "source") || undefined,
        comment: g(parts, "comment") || undefined,
        createdAt: g(parts, "created_at"),
        clientIp: g(parts, "client_ip") || undefined
      });
    } else if (parts.length >= 7) {
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

const CIF_CSV_HEADER =
  "original_name,stored_name,formula,comment,created_at,client_ip\n";

/** Запись в user_cifs.csv (тот же формат, что /api/cif/upload) */
export function appendUserCifMetadata(params: {
  originalName: string;
  storedName: string;
  formula: string;
  comment: string;
  createdAt: string;
  clientIp?: string;
}): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const isNew = !fs.existsSync(CIFS_CSV);
  const line =
    [
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
    fs.writeFileSync(CIFS_CSV, CIF_CSV_HEADER + line, "utf8");
  } else {
    fs.appendFileSync(CIFS_CSV, line, "utf8");
  }
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (inQuotes) {
      cur += c;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

// --- Классификация (формула + тип магнетизма) ---
export interface UserClassificationRecord {
  formula: string;
  magneticClass: MagneticClass;
  createdAt: string;
  clientIp?: string;
}

export function appendUserClassification(record: UserClassificationRecord): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const isNewFile = !fs.existsSync(CLASSIFICATIONS_CSV);
  const line = [
    record.formula,
    record.magneticClass,
    record.createdAt,
    record.clientIp ?? ""
  ].join(",") + "\n";
  if (isNewFile) {
    fs.writeFileSync(CLASSIFICATIONS_CSV, CLASS_HEADER + line, { encoding: "utf8" });
  } else {
    fs.appendFileSync(CLASSIFICATIONS_CSV, line, { encoding: "utf8" });
  }
}

export function readUserClassifications(): UserClassificationRecord[] {
  if (!fs.existsSync(CLASSIFICATIONS_CSV)) return [];
  const raw = fs.readFileSync(CLASSIFICATIONS_CSV, "utf8");
  const lines = raw.trim().split("\n");
  if (lines.length < 2) return [];
  const records: UserClassificationRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = parseCsvLine(lines[i]);
    if (parts.length >= 2 && MAGNETIC_CLASSES.includes(parts[1] as MagneticClass)) {
      records.push({
        formula: parts[0],
        magneticClass: parts[1] as MagneticClass,
        createdAt: parts[2] ?? "",
        clientIp: parts[3] || undefined
      });
    }
  }
  return records;
}

// NOTE: user storage is implemented in `src/db/userStorage.ts` (Postgres).
