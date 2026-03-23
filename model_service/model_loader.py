"""
Загрузка модели и скейлера, предсказание T_C по списку формул.

Этот модуль опирается на существующий код из train_curie_three_versions.py и predict_curie.py:
- использует BASE_DIR и formula_to_vector из train_curie_three_versions;
- ожидает, что в BASE_DIR лежат curie_model.joblib и curie_scaler.joblib.

Загрузка sklearn-модели отложена до первого запроса model=rf, чтобы сервис с CrabNet
поднимался даже при несовместимой версии scikit-learn со старым pickle.
"""

from __future__ import annotations

from typing import Iterable, List, Optional, Tuple

from errors import CurieModelLoadError, InvalidFormulaError

import os
import sys

import joblib
import numpy as np

# Добавляем корень репозитория в PYTHONPATH, чтобы видеть train_curie_three_versions.py
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from train_curie_three_versions import BASE_DIR, formula_to_vector


MODEL_PATH = os.path.join(BASE_DIR, "curie_model.joblib")
SCALER_PATH = os.path.join(BASE_DIR, "curie_scaler.joblib")

_curie_instance: Optional["CurieModelService"] = None
_curie_load_error: Optional[str] = None


class CurieModelService:
    """Обёртка над моделью и скейлером для предсказаний по формуле."""

    def __init__(self) -> None:
        self.model, self.scaler = self._load_model_and_scaler()

    @staticmethod
    def _load_model_and_scaler():
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        return model, scaler

    def predict_for_formulas(self, formulas: Iterable[str]) -> List[Tuple[str, float, float]]:
        """
        Делает предсказание T_C по списку формул.

        Возвращает список кортежей (formula, Tc_K, Tc_C).
        Неверные формулы можно либо пропускать, либо поднимать исключение — это решается в HTTP-слое.
        """
        results: List[Tuple[str, float, float]] = []
        for raw_formula in formulas:
            formula = (raw_formula or "").strip()
            if not formula or formula.startswith("#"):
                continue

            try:
                vec = formula_to_vector(formula)
            except Exception as e:
                raise InvalidFormulaError(formula, message=str(e)) from e
            x = self.scaler.transform(np.asarray(vec).reshape(1, -1))
            tc_k = float(self.model.predict(x)[0])
            tc_c = tc_k - 273.15
            results.append((formula, tc_k, tc_c))
        return results


def get_curie_model_service() -> CurieModelService:
    """Ленивая загрузка RandomForest/sklearn: не ломает старт uvicorn при несовместимом pickle."""
    global _curie_instance, _curie_load_error
    if _curie_instance is not None:
        return _curie_instance
    if _curie_load_error is not None:
        raise CurieModelLoadError(_curie_load_error)
    try:
        _curie_instance = CurieModelService()
        return _curie_instance
    except Exception as e:
        _curie_load_error = (
            f"{type(e).__name__}: {e}. "
            "Модель сохранена под другой версией scikit-learn: переобучите и сохраните joblib "
            "текущим sklearn или установите ту же версию sklearn, что при обучении (см. предупреждение pip)."
        )
        raise CurieModelLoadError(_curie_load_error) from e
