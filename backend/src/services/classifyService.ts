import {
  appendUserClassification,
  MAGNETIC_CLASSES,
  type MagneticClass
} from "../db/fileStorage";

export function saveUserClassification(payload: {
  formula: string;
  magneticClass: string;
  clientIp?: string;
}): void {
  const formula = payload.formula.trim();
  if (!formula) throw new Error("FORMULA_REQUIRED");
  const raw = payload.magneticClass?.trim().toLowerCase();
  if (!raw || !MAGNETIC_CLASSES.includes(raw as MagneticClass)) {
    throw new Error("INVALID_CLASS");
  }
  appendUserClassification({
    formula,
    magneticClass: raw as MagneticClass,
    createdAt: new Date().toISOString(),
    clientIp: payload.clientIp
  });
}
