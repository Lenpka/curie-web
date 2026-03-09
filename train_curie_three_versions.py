"""
Train Curie temperature (Tc) models in 3 versions:
  1) FM_with_curie.csv — use existing formula mol-vector features.
  2) magnetic_materials_curie_clean.csv — build mol-vector from formula via pymatgen.
  3) Combined dataset (same feature space, both sources).

Фичи — только из формулы (состава), без структуры и расстояний:
  • 103 доли элементов (H..Lr) — атомные доли в составе.
  • 12 производных: Average_Weight, Average_Electronegativity, Total_Electrons,
    Num_Atoms, Avg_Atomic_Number, average_period, avg_magnetic_moment, average_group,
    Entropy, Magnetic_proportion (Fe,Co,Ni,Mn,Cr), Rare_Earth_proportion (La–Lu), L2_norm.
  • 3 обменных (прокси −J S_d·S_f): transition_d_fraction (3d+4d+5d), f_metal_fraction (4f+5f),
    exchange_d_f = transition_d_fraction * f_metal_fraction.

Итого 118 признаков. For each version: fit 5 models, pick the best by validation.
"""
import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.svm import SVR
from sklearn.neighbors import KNeighborsRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

from pymatgen.core import Composition, Element


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FM_CSV = os.path.join(BASE_DIR, "FM_with_curie.csv")
CLEAN_CSV = os.path.join(BASE_DIR, "magnetic_materials_curie_clean.csv")
TARGET_FM = "Mean_TC_K"
TARGET_CLEAN = "Curie_TC_K"
FORMULA_COL = "formula"
NAME_COL = "Normalized_Composition"
RANDOM_STATE = 42
TEST_SIZE = 0.2
CV_FOLDS = 3

# Feature columns in FM (order matters for alignment)
EXCLUDE_COLS = {NAME_COL, TARGET_FM}
DERIVED = {
    "Average_Weight", "Average_Electronegativity", "Total_Electrons", "Num_Atoms",
    "Avg_Atomic_Number", "average_period", "avg_magnetic_moment", "average_group",
    "Entropy", "Magnetic_proportion", "Rare_Earth_proportion", "L2_norm",
}
# Обменное взаимодействие −J S_i·S_j: переходные d-металлы и f-металлы (4f + 5f)
TRANSITION_D = {
    "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn",  # 3d
    "Y", "Zr", "Nb", "Mo", "Tc", "Ru", "Rh", "Pd", "Ag", "Cd",  # 4d
    "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg",        # 5d
}
# 4f (лантаноиды) + 5f (актиноиды)
F_METALS = (
    {"La", "Ce", "Pr", "Nd", "Pm", "Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb", "Lu"}
    | {"Ac", "Th", "Pa", "U", "Np", "Pu", "Am", "Cm", "Bk", "Cf", "Es", "Fm", "Md", "No", "Lr"}
)
EXCHANGE_FEATURE_NAMES = ["transition_d_fraction", "f_metal_fraction", "exchange_d_f"]

# Elements H..Lr as in FM_with_curie header
ELEMENTS = [
    "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne", "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar",
    "K", "Ca", "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn", "Ga", "Ge", "As", "Se", "Br", "Kr",
    "Rb", "Sr", "Y", "Zr", "Nb", "Mo", "Tc", "Ru", "Rh", "Pd", "Ag", "Cd", "In", "Sn", "Sb", "Te", "I", "Xe",
    "Cs", "Ba", "La", "Ce", "Pr", "Nd", "Pm", "Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb", "Lu",
    "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg", "Tl", "Pb", "Bi", "Po", "At", "Rn",
    "Fr", "Ra", "Ac", "Th", "Pa", "U", "Np", "Pu", "Am", "Cm", "Bk", "Cf", "Es", "Fm", "Md", "No", "Lr",
]
RARE_EARTH = {"La", "Ce", "Pr", "Nd", "Pm", "Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb", "Lu"}
MAGNETIC_EL = {"Fe", "Co", "Ni", "Mn", "Cr"}  # common magnetic elements


def compute_exchange_features_from_fracs(fracs: np.ndarray) -> np.ndarray:
    """
    Из вектора долей элементов (103 в порядке ELEMENTS) считает:
      transition_d_fraction, f_metal_fraction, exchange_d_f (прокси −J S_d·S_f).
    fracs: shape (103,) или (N, 103). Возвращает (3,) или (N, 3).
    """
    single = fracs.ndim == 1
    if single:
        fracs = fracs.reshape(1, -1)
    d_frac = np.array([sum(fracs[i, j] for j, el in enumerate(ELEMENTS) if el in TRANSITION_D) for i in range(fracs.shape[0])], dtype=np.float64)
    f_frac = np.array([sum(fracs[i, j] for j, el in enumerate(ELEMENTS) if el in F_METALS) for i in range(fracs.shape[0])], dtype=np.float64)
    exchange_d_f = d_frac * f_frac
    out = np.column_stack([d_frac, f_frac, exchange_d_f])
    return out[0] if single else out


def formula_to_vector(formula: str) -> np.ndarray:
    """
    Build a 118-dim feature vector from chemical formula (same format as FM_with_curie).
    Uses pymatgen Composition: 103 element fractions + 12 derived + 3 exchange (d–f) features.
    """
    comp = Composition(formula)
    n_atoms = comp.num_atoms
    total_weight = comp.weight
    el_amt = comp.get_el_amt_dict()  # element symbol -> count
    total_atoms = sum(el_amt.values()) or 1

    # Element fractions (103)
    fracs = [el_amt.get(el, 0) / total_atoms for el in ELEMENTS]

    # Derived
    avg_weight = total_weight / n_atoms if n_atoms else 0
    total_electrons = 0
    avg_z = 0
    avg_period = 0
    avg_group = 0
    avg_x = 0
    magnetic_prop = 0
    rare_earth_prop = 0
    entropy = 0
    for i, el_str in enumerate(ELEMENTS):
        f = fracs[i]
        if f <= 0:
            continue
        try:
            e = Element(el_str)
            z = e.Z
            total_electrons += f * z
            avg_z += f * z
            avg_x += f * e.X
            avg_period += f * e.row
            avg_group += f * e.group
            if el_str in MAGNETIC_EL:
                magnetic_prop += f
            if el_str in RARE_EARTH:
                rare_earth_prop += f
            entropy -= f * np.log(f + 1e-30)
        except Exception:
            pass

    l2 = np.sqrt(sum(x * x for x in fracs)) or 1e-10

    derived_vec = [
        avg_weight,
        avg_x,
        total_electrons,
        n_atoms,
        avg_z,
        avg_period,
        0.0,  # avg_magnetic_moment — not from composition
        avg_group,
        entropy,
        magnetic_prop,
        rare_earth_prop,
        l2,
    ]
    exchange_vec = compute_exchange_features_from_fracs(np.array(fracs, dtype=np.float64))
    return np.array(fracs + derived_vec + exchange_vec.tolist(), dtype=np.float64)


def get_base_feature_columns():
    """115 колонок из FM_with_curie (103 элемента + 12 производных)."""
    df = pd.read_csv(FM_CSV, nrows=1)
    return [c for c in df.columns if c not in EXCLUDE_COLS]


def get_feature_columns():
    """118 колонок: базовые 115 + transition_d_fraction, f_metal_fraction, exchange_d_f."""
    return get_base_feature_columns() + EXCHANGE_FEATURE_NAMES


FEATURE_COLS = None  # set on first use


def load_fm_data():
    global FEATURE_COLS
    df = pd.read_csv(FM_CSV, low_memory=False)
    base_cols = get_base_feature_columns()
    FEATURE_COLS = get_feature_columns()
    X_base = df[base_cols].replace(np.nan, 0).astype(np.float64).values
    fracs = X_base[:, : len(ELEMENTS)]  # 103 колонки — доли элементов
    X_extra = compute_exchange_features_from_fracs(fracs)
    X = np.hstack([X_base, X_extra])
    y = df[TARGET_FM].values
    return X, y


def load_clean_data():
    global FEATURE_COLS
    if FEATURE_COLS is None:
        FEATURE_COLS = get_feature_columns()
    df = pd.read_csv(CLEAN_CSV, low_memory=False)
    df = df.dropna(subset=[FORMULA_COL, TARGET_CLEAN])
    X_rows = []
    y_list = []
    for _, row in df.iterrows():
        try:
            vec = formula_to_vector(str(row[FORMULA_COL]))
            X_rows.append(vec)
            y_list.append(float(row[TARGET_CLEAN]))
        except Exception:
            continue
    X = np.array(X_rows, dtype=np.float64)
    y = np.array(y_list)
    return X, y


def get_models(n_train=None):
    return [
        ("Ridge", Ridge(alpha=1.0, random_state=RANDOM_STATE)),
        ("RandomForest", RandomForestRegressor(n_estimators=80, max_depth=15, random_state=RANDOM_STATE)),
        ("GradientBoosting", GradientBoostingRegressor(n_estimators=80, max_depth=4, random_state=RANDOM_STATE)),
        ("KNN", KNeighborsRegressor(n_neighbors=15)),
        ("SVR", SVR(kernel="rbf", C=5, epsilon=0.2)),
    ]


def evaluate(X, y, version_name: str):
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE
    )
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)
    # SVR: use subset if training set very large (SVR is O(n^2))
    max_svr = 4000
    if len(X_train_s) > max_svr:
        idx = np.random.RandomState(RANDOM_STATE).choice(len(X_train_s), max_svr, replace=False)
        X_train_svr = X_train_s[idx]
        y_train_svr = y_train[idx]
    else:
        X_train_svr, y_train_svr = X_train_s, y_train

    run_cv = os.environ.get("RUN_CV", "0") == "1"  # set RUN_CV=1 to enable (slower, can hang under nohup)
    results = []
    for name, model in get_models():
        if name == "SVR" and len(X_train_svr) < len(X_train_s):
            model.fit(X_train_svr, y_train_svr)
        else:
            model.fit(X_train_s, y_train)
        y_pred = model.predict(X_test_s)
        r2 = r2_score(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        if run_cv:
            cv_scores = cross_val_score(
                model, X_train_s, y_train, cv=CV_FOLDS, scoring="neg_mean_absolute_error", n_jobs=1
            )
            cv_mae = -cv_scores.mean()
            cv_str = f", CV_MAE={cv_mae:.2f}"
        else:
            cv_mae = None
            cv_str = ""
        results.append({
            "model": name,
            "R2": r2,
            "MAE": mae,
            "RMSE": rmse,
            "CV_MAE": cv_mae,
        })
        print(f"  {name}: R2={r2:.4f}, MAE={mae:.2f}, RMSE={rmse:.2f}{cv_str}")

    best = min(results, key=lambda r: r["MAE"])
    print(f"  -> Best: {best['model']} (MAE={best['MAE']:.2f})")
    return results, best, (X_train_s, X_test_s, y_train, y_test, scaler)


def main():
    print("=" * 60)
    print("Version 1: FM_with_curie.csv (existing mol-vector)")
    print("=" * 60)
    X1, y1 = load_fm_data()
    print(f"  Samples: {len(y1)}, Features: {X1.shape[1]}")
    res1, best1, _ = evaluate(X1, y1, "v1")

    print("\n" + "=" * 60)
    print("Version 2: magnetic_materials_curie_clean.csv (pymatgen vector)")
    print("=" * 60)
    X2, y2 = load_clean_data()
    print(f"  Samples: {len(y2)}, Features: {X2.shape[1]}")
    res2, best2, _ = evaluate(X2, y2, "v2")

    print("\n" + "=" * 60)
    print("Version 3: Combined dataset")
    print("=" * 60)
    X_comb = np.vstack([X1, X2])
    y_comb = np.concatenate([y1, y2])
    print(f"  Samples: {len(y_comb)} (FM={len(y1)} + clean={len(y2)})")
    res3, best3, _ = evaluate(X_comb, y_comb, "v3")

    # Summary table
    print("\n" + "=" * 60)
    print("SUMMARY — Best model per version (test set metrics)")
    print("=" * 60)
    for label, best in [("V1 (FM_only)", best1), ("V2 (clean_only)", best2), ("V3 (combined)", best3)]:
        print(f"  {label}: {best['model']} — R2={best['R2']:.4f}, MAE={best['MAE']:.2f} K, RMSE={best['RMSE']:.2f} K")

    out_path = os.path.join(BASE_DIR, "curie_three_versions_metrics.txt")
    with open(out_path, "w") as f:
        f.write("Version 1 (FM_with_curie)\n")
        for r in res1:
            f.write(f"  {r['model']}: R2={r['R2']:.4f}, MAE={r['MAE']:.2f}, RMSE={r['RMSE']:.2f}\n")
        f.write(f"  Best: {best1['model']}\n\n")
        f.write("Version 2 (magnetic_materials_curie_clean + pymatgen vector)\n")
        for r in res2:
            f.write(f"  {r['model']}: R2={r['R2']:.4f}, MAE={r['MAE']:.2f}, RMSE={r['RMSE']:.2f}\n")
        f.write(f"  Best: {best2['model']}\n\n")
        f.write("Version 3 (combined)\n")
        for r in res3:
            f.write(f"  {r['model']}: R2={r['R2']:.4f}, MAE={r['MAE']:.2f}, RMSE={r['RMSE']:.2f}\n")
        f.write(f"  Best: {best3['model']}\n")
    print(f"\nMetrics written to {out_path}")


if __name__ == "__main__":
    main()
