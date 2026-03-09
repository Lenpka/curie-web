import fs from "fs";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const LABELS_CSV = path.join(DATA_DIR, "user_labels.csv");

const HEADER =
  "formula,Curie_TC_K,synagonia,source,comment,created_at,client_ip\n";

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

