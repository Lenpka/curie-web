"""
CrabNet: загрузка UnnamedModel.pth и предсказание T_C (K) по формулам.

Веса: CRABNET_WEIGHTS_PATH или model_service/weights/UnnamedModel.pth,
либо UnnamedModel.pth в корне репозитория.
"""

from __future__ import annotations

import os
import sys
from typing import Iterable, List, Tuple

from errors import InvalidFormulaError

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_WEIGHTS = os.path.join(MODEL_DIR, "weights", "UnnamedModel.pth")
ROOT_FALLBACK = os.path.join(REPO_ROOT, "UnnamedModel.pth")


def _infer_subcrab_kwargs(weights: dict) -> dict:
    """
    Восстанавливает kwargs для SubCrab по state_dict (разные прогоны CrabNet
    используют разные d_model, N, dim_feedforward, out_hidden).
    """
    sd = weights
    d_model = int(sd["encoder.embed.fc_mat2vec.weight"].shape[0])
    layer_ids: list[int] = []
    for k in sd:
        if k.startswith("encoder.transformer_encoder.layers."):
            parts = k.split(".")
            if len(parts) > 3 and parts[3].isdigit():
                layer_ids.append(int(parts[3]))
    n_layers = max(layer_ids) + 1 if layer_ids else 3
    dim_ff = int(sd["encoder.transformer_encoder.layers.0.linear1.weight"].shape[0])
    out_dims = int(sd["output_nn.fc_out.weight"].shape[0])
    out_hidden: list[int] = []
    i = 0
    while f"output_nn.fcs.{i}.weight" in sd:
        out_hidden.append(int(sd[f"output_nn.fcs.{i}.weight"].shape[0]))
        i += 1
    if not out_hidden:
        out_hidden = [1024, 512, 256, 128]
    in_proj = sd["encoder.transformer_encoder.layers.0.self_attn.in_proj_weight"]
    assert in_proj.shape[1] == d_model
    # Часто 4 головы при d_model, делящемся на 4
    heads = 4 if d_model % 4 == 0 else 2
    return {
        "out_dims": out_dims,
        "d_model": d_model,
        "d_extend": 0,
        "N": n_layers,
        "heads": heads,
        "pe_resolution": 5000,
        "ple_resolution": 5000,
        "dim_feedforward": dim_ff,
        "out_hidden": out_hidden,
    }


def _resolve_weights_path() -> str:
    env = os.environ.get("CRABNET_WEIGHTS_PATH", "").strip()
    if env and os.path.isfile(env):
        return env
    if os.path.isfile(DEFAULT_WEIGHTS):
        return DEFAULT_WEIGHTS
    if os.path.isfile(ROOT_FALLBACK):
        return ROOT_FALLBACK
    return DEFAULT_WEIGHTS


class CrabNetModelService:
    """Ленивая загрузка CrabNet (torch) — только при первом запросе crabnet."""

    def __init__(self) -> None:
        self._cb = None

    def _ensure(self):
        if self._cb is not None:
            return self._cb
        try:
            import torch
            from crabnet.crabnet_ import CrabNet
            from crabnet.kingcrab import SubCrab
        except ImportError as e:
            raise RuntimeError(
                "CrabNet не установлен. Установите зависимости: pip install -r requirements.txt"
            ) from e

        path = _resolve_weights_path()
        if not os.path.isfile(path):
            raise FileNotFoundError(
                f"Файл весов CrabNet не найден: {path}. "
                "Положите UnnamedModel.pth в model_service/weights/ или задайте CRABNET_WEIGHTS_PATH."
            )

        force_cpu = os.environ.get("CRABNET_FORCE_CPU", "1").lower() in ("1", "true", "yes")
        cb = CrabNet(
            model_name="UnnamedModel",
            verbose=False,
            save=False,
            force_cpu=force_cpu,
        )
        network = torch.load(path, map_location=cb.compute_device, weights_only=False)
        if not isinstance(network, dict) or "weights" not in network:
            raise ValueError(
                "Ожидался словарь чекпоинта CrabNet с ключами weights, scaler_state, model_name. "
                "Проверьте файл UnnamedModel.pth."
            )
        arch = _infer_subcrab_kwargs(network["weights"])
        cb.out_dims = arch["out_dims"]
        cb.N = arch["N"]
        cb.d_model = arch["d_model"]
        cb.dim_feedforward = arch["dim_feedforward"]
        cb.out_hidden = arch["out_hidden"]
        cb.model = SubCrab(
            compute_device=cb.compute_device,
            out_dims=arch["out_dims"],
            d_model=arch["d_model"],
            d_extend=arch["d_extend"],
            N=arch["N"],
            heads=arch["heads"],
            pe_resolution=arch["pe_resolution"],
            ple_resolution=arch["ple_resolution"],
            emb_scaler=cb.emb_scaler,
            pos_scaler=cb.pos_scaler,
            pos_scaler_log=cb.pos_scaler_log,
            dim_feedforward=arch["dim_feedforward"],
            dropout=cb.dropout,
            out_hidden=arch["out_hidden"],
        ).to(cb.compute_device)
        cb.load_network(network)
        self._cb = cb
        return cb

    def predict_for_formulas(self, formulas: Iterable[str]) -> List[Tuple[str, float, float]]:
        import numpy as np
        import pandas as pd

        cb = self._ensure()
        rows: List[str] = []
        for raw in formulas:
            f = (raw or "").strip()
            if not f or f.startswith("#"):
                continue
            rows.append(f)
        if not rows:
            return []

        # target нужен колонке для внутреннего load_data; значения не используются при predict
        df = pd.DataFrame({"formula": rows, "target": np.zeros(len(rows), dtype=np.float64)})

        try:
            raw_out = cb.predict(test_df=df, return_uncertainty=False)
        except Exception as e:
            raise InvalidFormulaError(rows[0] if rows else "?", message=str(e)) from e

        if isinstance(raw_out, tuple):
            pred_arr = raw_out[0]
        else:
            pred_arr = raw_out

        pred_arr = np.asarray(pred_arr).reshape(-1)
        if pred_arr.shape[0] != len(rows):
            raise RuntimeError(
                f"CrabNet: ожидалось {len(rows)} предсказаний, получено {pred_arr.shape[0]}"
            )

        out: List[Tuple[str, float, float]] = []
        for formula, tc_k in zip(rows, pred_arr):
            tc_k = float(tc_k)
            tc_c = tc_k - 273.15
            out.append((formula, tc_k, tc_c))
        return out


crabnet_model_service = CrabNetModelService()
