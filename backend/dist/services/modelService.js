"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictCurieTemperature = predictCurieTemperature;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
// Вызывает Python-сервис модели и возвращает список предсказаний
async function predictCurieTemperature(formulas) {
    const url = `${config_1.config.modelServiceUrl}/predict`;
    try {
        const response = await axios_1.default.post(url, { formulas });
        return response.data.results;
    }
    catch (err) {
        const axErr = err;
        if (axErr.response) {
            throw {
                type: 'MODEL_RESPONSE_ERROR',
                status: axErr.response.status,
                data: axErr.response.data
            };
        }
        throw {
            type: "MODEL_NETWORK_ERROR",
            originalError: err
        };
    }
}
