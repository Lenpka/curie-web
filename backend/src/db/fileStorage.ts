import fs from "fs";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const LABELS_CSV = path.join(DATA_DIR, "user_labels.csv");
const CLASSIFICATIONS_CSV = path.join(DATA_DIR, "user_classifications.csv");

const HEADER =
  "formula,Curie_TC_K,synagonia,source,comment,created_at,client_ip\n";
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
  source?: string;
  comment?: string;
  createdAt: string;
  clientIp?: string;
}

export function appendUserLabel(record: UserLabelRecord): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const isNewFile = !fs.existsSync(LABELS_CSV);
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
    fs.writeFileSync(LABELS_CSV, HEADER + line, { encoding: "utf8" });
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
  const records: UserLabelRecord[] = [];
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

