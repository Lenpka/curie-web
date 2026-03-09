import axios from "axios";
import { config } from "../config";

export interface PredictResult {
  formula: string;
  Tc_K: number;
  Tc_C: number;
}

export async function predictCurieTemperature(
  formulas: string[]
): Promise<PredictResult[]> {
  const url = `${config.modelServiceUrl}/predict`;
  const response = await axios.post(url, { formulas });
  return response.data.results as PredictResult[];
}

