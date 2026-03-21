import { appendUserLabel } from "../db/fileStorage";

export interface RawLabelPayload {
  formula: string;
  tcValue: number;
  tcUnit: "K" | "C";
  /** Семейство структуры (NiAs-type, pyrite-structure disulphides, …) */
  structureType?: string;
  synagonia?: string;
  /** K_a, МДж/м³ */
  anisotropyMJm3?: number;
  easyAxis?: string;
  cifStoredName?: string;
  source?: string;
  comment?: string;
  clientIp?: string;
}

export function saveUserLabel(payload: RawLabelPayload): void {
  const {
    formula,
    tcValue,
    tcUnit,
    structureType,
    synagonia,
    anisotropyMJm3,
    easyAxis,
    cifStoredName,
    source,
    comment,
    clientIp
  } = payload;

  const curieTcK = tcUnit === "K" ? tcValue : tcValue + 273.15;
  const createdAt = new Date().toISOString();

  appendUserLabel({
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
