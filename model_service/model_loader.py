"""
Загрузка модели и скейлера, предсказание T_C по списку формул.

Этот модуль опирается на существующий код из train_curie_three_versions.py и predict_curie.py:
- использует BASE_DIR и formula_to_vector из train_curie_three_versions;
- ожидает, что в BASE_DIR лежат curie_model.joblib и curie_scaler.joblib.
"""

from __future__ import annotations

from typing import Iterable, List, Tuple

import joblib
import numpy as np

from train_curie_three_versions import BASE_DIR, formula_to_vector


MODEL_PATH = BASE_DIR + "/curie_model.joblib"
SCALER_PATH = BASE_DIR + "/curie_scaler.joblib"


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
            vec = formula_to_vector(formula)
            x = self.scaler.transform(np.asarray(vec).reshape(1, -1))
            tc_k = float(self.model.predict(x)[0])
            tc_c = tc_k - 273.15
            results.append((formula, tc_k, tc_c))
        return results


curie_model_service = CurieModelService()

