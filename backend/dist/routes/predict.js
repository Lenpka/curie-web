"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPredictRoute = registerPredictRoute;
const modelService_1 = require("../services/modelService");
function registerPredictRoute(router) {
    router.post("/predict", async (req, res) => {
        const { formulas } = req.body;
        if (!Array.isArray(formulas) || formulas.length === 0) {
            return res
                .status(400)
                .json({ error: "Field 'formulas' must be a non-empty array of strings" });
        }
        const cleaned = formulas
            .map((f) => (typeof f === "string" ? f.trim() : ""))
            .filter((f) => f.length > 0);
        if (cleaned.length === 0) {
            return res
                .status(400)
                .json({ error: "No valid formula provided after cleanup" });
        }
        try {
            const results = await (0, modelService_1.predictCurieTemperature)(cleaned);
            return res.json({ results });
        }
        catch (err) {
            const e = err;
            if (e?.type === "MODEL_RESPONSE_ERROR") {
                const status = e.status ?? 502;
                const data = (e.data ?? {});
                console.error("Model service responded with error:", status, data);
                if (status === 400 && data.detail?.code === "invalid_formula") {
                    return res.status(400).json({
                        code: "invalid_formula",
                        formula: data.detail.formula,
                        message: data.detail.message,
                        suggestion: data.detail.suggestion ?? null
                    });
                }
                return res.status(status === 200 ? 502 : status).json({
                    error: "Model service error",
                    details: data
                });
            }
            console.error("Model service unavailable", err);
            return res.status(502).json({ error: "Model service unavailable" });
        }
    });
}
