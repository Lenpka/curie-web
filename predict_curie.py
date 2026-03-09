#!/usr/bin/env python3
"""
Удобный предсказатель температуры Кюри: передаёте формулу(ы) — получаете Tc.

Способы ввода:
  Формулы в аргументах:
    python predict_curie.py Fe3O4
    python predict_curie.py Fe3O4 Nd2Fe14B CoFe2O4

  Файл (одна формула на строку):
    python predict_curie.py -f formulas.txt

  Интерактивный режим (ввод с клавиатуры, Enter без формулы — выход):
    python predict_curie.py -i

  Из stdin (по одной формуле на строку):
    echo -e "Fe3O4\nNd2Fe14B" | python predict_curie.py

  Справка:
    python predict_curie.py --help

Сначала обучите модель: python train_best_curie_model.py
"""
import argparse
import os
import sys
import joblib

from train_curie_three_versions import formula_to_vector, BASE_DIR

MODEL_PATH = os.path.join(BASE_DIR, "curie_model.joblib")
SCALER_PATH = os.path.join(BASE_DIR, "curie_scaler.joblib")


def load_model():
    if not os.path.isfile(MODEL_PATH) or not os.path.isfile(SCALER_PATH):
        print("Модель не найдена. Сначала выполните: python train_best_curie_model.py", file=sys.stderr)
        sys.exit(1)
    return joblib.load(MODEL_PATH), joblib.load(SCALER_PATH)


def predict_tc(formula: str, model, scaler) -> float:
    """Предсказание температуры Кюри (K) по химической формуле."""
    formula = formula.strip()
    if not formula or formula.startswith("#"):
        raise ValueError("Пустая формула")
    vec = formula_to_vector(formula)
    X = scaler.transform(vec.reshape(1, -1))
    return float(model.predict(X)[0])


def run_predictions(formulas, model, scaler, verbose=True):
    """По списку формул возвращает список (formula, tc_k, tc_c); ошибки пропускает или рейзит."""
    results = []
    for formula in formulas:
        formula = formula.strip()
        if not formula or formula.startswith("#"):
            continue
        try:
            tc_k = predict_tc(formula, model, scaler)
            tc_c = tc_k - 273.15
            results.append((formula, tc_k, tc_c))
            if verbose and len(formulas) == 1:
                print(f"Формула: {formula}")
                print(f"Предсказанная T_C: {tc_k:.1f} K  ({tc_c:.1f} °C)")
        except Exception as e:
            if verbose:
                print(f"Ошибка для '{formula}': {e}", file=sys.stderr)
    return results


def main():
    parser = argparse.ArgumentParser(
        description="Предсказание температуры Кюри по химической формуле.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "formulas",
        nargs="*",
        help="Химические формулы через пробел (Fe3O4 Nd2Fe14B ...)",
    )
    parser.add_argument(
        "-f", "--file",
        metavar="FILE",
        help="Файл с формулами (одна на строку)",
    )
    parser.add_argument(
        "-i", "--interactive",
        action="store_true",
        help="Интерактивный ввод (вводите формулу, Enter — следующая, пустая строка — выход)",
    )
    parser.add_argument(
        "-q", "--quiet",
        action="store_true",
        help="Только таблица (без лишнего вывода при нескольких формулах)",
    )
    args = parser.parse_args()

    model, scaler = load_model()

    formulas = []

    if args.interactive:
        print("Вводите формулы (пустая строка — выход). Ctrl+D / Ctrl+C — выход.")
        while True:
            try:
                line = input("Формула: ").strip()
            except EOFError:
                break
            if not line:
                break
            formulas.append(line)
    elif args.file:
        if not os.path.isfile(args.file):
            print(f"Файл не найден: {args.file}", file=sys.stderr)
            sys.exit(1)
        with open(args.file, "r", encoding="utf-8") as f:
            formulas = [line.strip() for line in f if line.strip() and not line.strip().startswith("#")]
    elif args.formulas:
        formulas = [f.strip() for f in args.formulas if f.strip()]
    else:
        # stdin или один запрос
        if sys.stdin.isatty():
            try:
                formula = input("Формула: ").strip()
            except EOFError:
                formula = ""
            if not formula:
                print("Формула не введена.", file=sys.stderr)
                sys.exit(1)
            formulas = [formula]
        else:
            formulas = [line.strip() for line in sys.stdin if line.strip() and not line.strip().startswith("#")]

    if not formulas:
        print("Нет формул для предсказания.", file=sys.stderr)
        sys.exit(1)

    verbose = not args.quiet
    results = run_predictions(formulas, model, scaler, verbose=verbose)

    if not results:
        sys.exit(1)

    if len(results) > 1 or (results and args.quiet):
        # Таблица
        col_f = "Формула"
        col_k = "T_C (K)"
        col_c = "T_C (°C)"
        w_f = max(len(col_f), max(len(r[0]) for r in results), 12)
        print(f"{col_f:<{w_f}}  {col_k:>10}  {col_c:>10}")
        print("-" * (w_f + 24))
        for formula, tc_k, tc_c in results:
            print(f"{formula:<{w_f}}  {tc_k:>10.1f}  {tc_c:>10.1f}")


if __name__ == "__main__":
    main()
