"""
FastAPI-сервис, оборачивающий готовую модель T_C в HTTP-API.

Эндпоинты (MVP):
- GET  /health   — проверка, что сервис жив;
- POST /predict  — предсказание температуры Кюри по списку формул.
"""

from __future__ import annotations

from fastapi import FastAPI, HTTPException

from model_service.model_loader import curie_model_service
from model_service.schemas import PredictRequest, PredictResponse, PredictResult


app = FastAPI(title="Curie Temperature Model Service", version="0.1.0")


@app.get("/health")
def health() -> dict:
    """Простой health-check для оркестратора/бэкенда."""
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

    # Базовая реализация: пробрасывает исключения наверх.
    tuples = curie_model_service.predict_for_formulas(request.formulas)
    results = [
        PredictResult(formula=f, Tc_K=tc_k, Tc_C=tc_c) for f, tc_k, tc_c in tuples
    ]
    return PredictResponse(results=results)

