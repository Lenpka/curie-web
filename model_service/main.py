"""
FastAPI-сервис, оборачивающий готовую модель T_C в HTTP-API.

Эндпоинты (MVP):
- GET  /health   — проверка, что сервис жив;
- POST /predict  — предсказание температуры Кюри по списку формул.
"""

from __future__ import annotations

from fastapi import FastAPI, HTTPException

from model_loader import get_curie_model_service
from crabnet_loader import crabnet_model_service
from errors import CurieModelLoadError, InvalidFormulaError
from schemas import PredictRequest, PredictResponse, PredictResult


app = FastAPI(title="Curie Temperature Model Service", version="0.1.0")


@app.get("/health")
def health() -> dict:
    """Простой health-check для оркестратора/бэкенда."""
    return {"status": "ok"}

@app.head("/health")
def health_head() -> dict:
    return {"status": "ok"}

@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest) -> PredictResponse:
    """
    Принимает список формул и возвращает предсказанную температуру Кюри.

    Семантика ошибок (MVP):
    - если список пустой — 400 Bad Request;
    - если хотя бы одна формула невалидна — 400 или пропуск (на твой выбор, реализуешь сам).
    """
    if not request.formulas:
        raise HTTPException(status_code=400, detail="Список формул пуст.")

    try:
        if request.model == "crabnet":
            try:
                tuples = crabnet_model_service.predict_for_formulas(request.formulas)
            except FileNotFoundError as e:
                raise HTTPException(
                    status_code=503,
                    detail={
                        "code": "crabnet_weights_missing",
                        "message": str(e),
                    },
                ) from e
            except RuntimeError as e:
                if "CrabNet не установлен" in str(e):
                    raise HTTPException(
                        status_code=503,
                        detail={"code": "crabnet_dependency", "message": str(e)},
                    ) from e
                raise
        else:
            try:
                tuples = get_curie_model_service().predict_for_formulas(request.formulas)
            except CurieModelLoadError as e:
                raise HTTPException(
                    status_code=503,
                    detail={
                        "code": "sklearn_model_load_failed",
                        "message": str(e),
                    },
                ) from e
    except InvalidFormulaError as inv:
        detail = {
            "code": "invalid_formula",
            "formula": inv.formula,
            "message": str(inv) or "Formula cannot be parsed",
        }
        if getattr(inv, "suggestion", None):
            detail["suggestion"] = inv.suggestion
        raise HTTPException(status_code=400, detail=detail)
    results = [
        PredictResult(formula=f, Tc_K=tc_k, Tc_C=tc_c) for f, tc_k, tc_c in tuples
    ]
    return PredictResponse(results=results)

