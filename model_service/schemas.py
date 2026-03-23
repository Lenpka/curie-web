from typing import List, Literal

from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    """Запрос к Python-сервису модели: список формул и выбор бэкенда."""

    formulas: List[str] = Field(..., description="Список химических формул для предсказания T_C")
    model: Literal["rf", "crabnet"] = Field(
        "rf",
        description="rf — sklearn RandomForest (curie_model.joblib); crabnet — UnnamedModel.pth",
    )


class PredictResult(BaseModel):
    """Результат предсказания для одной формулы."""

    formula: str = Field(..., description="Исходная формула")
    Tc_K: float = Field(..., description="Температура Кюри в кельвинах")
    Tc_C: float = Field(..., description="Температура Кюри в градусах Цельсия")


class PredictResponse(BaseModel):
    """Ответ сервиса: результаты для всех формул."""

    results: List[PredictResult]

