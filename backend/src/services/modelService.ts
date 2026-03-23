import axios, {AxiosError} from "axios";
import { config } from "../config";

export interface PredictResult {
  formula: string;
  Tc_K: number;
  Tc_C: number;
}

export type PredictModelBackend = "rf" | "crabnet";

// Вызывает Python-сервис модели и возвращает список предсказаний
export async function predictCurieTemperature(
  formulas: string[],
  model: PredictModelBackend = "rf"
): Promise<PredictResult[]> {
  const url = `${config.modelServiceUrl}/predict`;
  try{
    const response = await axios.post(url, { formulas, model }, { timeout: 90000 });
    return response.data.results as PredictResult[];

  }
  catch (err){
    const axErr = err as AxiosError;

    if (axErr.response)
    {
      throw{
        type: 'MODEL_RESPONSE_ERROR' as const,
        status: axErr.response.status,
        data: axErr.response.data
      };
    }
    throw {
      type: "MODEL_NETWORK_ERROR" as const,
      originalError: err
    };
  }
}