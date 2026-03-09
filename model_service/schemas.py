from typing import List

from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    """Запрос к Python-сервису модели: список формул."""

    formulas: List[str] = Field(..., description="Список химических формул для предсказания T_C")


class PredictResult(BaseModel):
    """Результат предсказания для одной формулы."""

    formula: str = Field(..., description="Исходная формула")
    Tc_K: float = Field(..., description="Температура Кюри в кельвинах")
    Tc_C: float = Field(..., description="Температура Кюри в градусах Цельсия")


class PredictResponse(BaseModel):
    """Ответ сервиса: результаты для всех формул."""

    results: List[PredictResult]

