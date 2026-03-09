import { appendUserLabel } from "../db/fileStorage";

export interface RawLabelPayload {
  formula: string;
  tcValue: number;
  tcUnit: "K" | "C";
  synagonia?: string;
  source?: string;
  comment?: string;
  clientIp?: string;
}

export function saveUserLabel(payload: RawLabelPayload): void {
  const { formula, tcValue, tcUnit, synagonia, source, comment, clientIp } =
    payload;

  const curieTcK = tcUnit === "K" ? tcValue : tcValue + 273.15;
  const createdAt = new Date().toISOString();

  appendUserLabel({
    formula: formula.trim(),
    curieTcK,
    synagonia,
    source,
    comment,
    createdAt,
    clientIp
  });
}

