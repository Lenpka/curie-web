#!/usr/bin/env python3
"""
Веб-сайт для предсказания температуры Кюри по химической формуле.

Запуск:
  conda activate model_test_old   # или окружение с моделью
  streamlit run curie_web_app.py

Откройте в браузере http://localhost:8501
"""
import os
import sys
import io
import csv
from datetime import datetime

try:
    import streamlit as st
except ImportError:
    print("Установите streamlit:  pip install streamlit", file=sys.stderr)
    sys.exit(1)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SUBMISSIONS_CSV = os.path.join(BASE_DIR, "user_submissions_curie.csv")
SUBMISSIONS_HEADER = ["formula", "Curie_TC_K", "synagonia", "source", "comment", "submitted_at"]
SYNAGONIA_OPTIONS = ["", "триклинная", "моноклинная", "ромбическая", "тетрагональная", "гексагональная", "ромбоэдрическая", "кубическая"]
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
os.chdir(BASE_DIR)

from predict_curie import load_model, run_predictions


def append_submission(formula: str, tc_k: float, synagonia: str, source: str, comment: str) -> None:
    """Добавляет одну запись в CSV разметки от пользователей."""
    file_exists = os.path.isfile(SUBMISSIONS_CSV)
    with open(SUBMISSIONS_CSV, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(SUBMISSIONS_HEADER)
        writer.writerow([
            formula.strip(),
            round(tc_k, 2),
            (synagonia or "").strip(),
            (source or "").strip(),
            (comment or "").strip(),
            datetime.now().isoformat(),
        ])


# Стили — тёмная тема, акцент на контенте
st.markdown("""
<style>
    .stApp { max-width: 720px; margin: 0 auto; padding: 2rem 1rem; }
    .hero {
        text-align: center;
        padding: 1.5rem 0 2rem;
        border-bottom: 1px solid var(--default-border-color, #eee);
        margin-bottom: 2rem;
    }
    .hero h1 { font-size: 1.85rem; margin-bottom: 0.35rem; }
    .hero p { color: var(--text-color-secondary, #666); font-size: 0.95rem; }
    .result-card {
        background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
        color: white;
        padding: 1.5rem 2rem;
        border-radius: 12px;
        text-align: center;
        margin: 1rem 0;
        box-shadow: 0 4px 14px rgba(0,0,0,0.15);
    }
    .result-card .formula { font-size: 1.4rem; font-weight: 600; margin-bottom: 0.5rem; }
    .result-card .tc { font-size: 2rem; font-weight: 700; }
    .result-card .unit { font-size: 0.9rem; opacity: 0.9; }
    .quick-formula { margin: 0.25rem; }
</style>
""", unsafe_allow_html=True)


def main():
    st.set_page_config(
        page_title="Температура Кюри — предсказание по формуле",
        page_icon="🧲",
        layout="centered",
        initial_sidebar_state="collapsed",
    )

    st.markdown('<div class="hero"><h1>🧲 Предсказание температуры Кюри</h1><p>Введите химическую формулу — получите оценку T_C в кельвинах и градусах Цельсия</p></div>', unsafe_allow_html=True)

    # Кэш модели, чтобы не грузить при каждом нажатии
    @st.cache_resource
    def get_model():
        return load_model()

    mode = st.radio(
        "Режим",
        ["Одна формула", "Несколько формул", "Добавить разметку"],
        horizontal=True,
        label_visibility="collapsed",
    )

    if mode == "Добавить разметку":
        st.markdown("**Предложите данные для обучения:** формула, температура Кюри и при желании сингония и источник. После проверки разметка попадёт в датасет для дообучения модели.")
        with st.form("submission_form"):
            formula_sub = st.text_input("Формула *", placeholder="Fe3O4, Nd2Fe14B, ...").strip()
            col_tc, col_unit = st.columns(2)
            with col_tc:
                tc_value = st.number_input("Температура Кюри *", min_value=0.0, max_value=2000.0, value=850.0, step=1.0, format="%.1f")
            with col_unit:
                tc_unit = st.selectbox("Единица", ["K", "°C"], key="tc_unit")
            synagonia = st.selectbox("Сингония", SYNAGONIA_OPTIONS, key="synagonia")
            source = st.text_input("Источник (статья, база, DOI, ссылка)", placeholder="DOI, URL или название источника").strip()
            comment = st.text_area("Комментарий (необязательно)", placeholder="Дополнительные признаки или примечания", height=80).strip()
            submitted = st.form_submit_button("Отправить разметку")
        if submitted:
            if not formula_sub:
                st.warning("Укажите формулу.")
            else:
                tc_k = tc_value if tc_unit == "K" else tc_value + 273.15
                try:
                    from train_curie_three_versions import formula_to_vector
                    formula_to_vector(formula_sub)
                except Exception as e:
                    st.error(f"Формула не распознана: {e}. Проверьте формат (например, Fe3O4).")
                else:
                    try:
                        append_submission(formula_sub, tc_k, synagonia, source, comment)
                        st.success("Разметка отправлена. После проверки она будет добавлена в данные для обучения.")
                    except Exception as e:
                        st.error(f"Ошибка сохранения: {e}")
        st.caption(f"Все отправки сохраняются в файл `user_submissions_curie.csv` в каталоге проекта. Проверьте его и при необходимости объедините с обучающими данными.")

    elif mode == "Одна формула":
        prefill = st.session_state.pop("quick_formula", "")
        formula = st.text_input(
            "Химическая формула",
            value=prefill,
            placeholder="Например: Fe3O4, Nd2Fe14B, CoFe2O4",
            label_visibility="collapsed",
            key="single_formula",
        ).strip()

        st.caption("Примеры:")
        ex_cols = st.columns(5)
        examples = ["Fe3O4", "Nd2Fe14B", "CoFe2O4", "Fe", "Gd"]
        for col, ex in zip(ex_cols, examples):
            with col:
                if st.button(ex, key=f"ex_{ex}", use_container_width=True):
                    st.session_state["quick_formula"] = ex

        do_predict = st.button("Предсказать T_C", type="primary", use_container_width=True)

        if do_predict:
            if not formula:
                st.warning("Введите формулу.")
            else:
                try:
                    model, scaler = get_model()
                    results = run_predictions([formula], model, scaler, verbose=False)
                    if results:
                        f, tc_k, tc_c = results[0]
                        st.markdown(f"""
                        <div class="result-card">
                            <div class="formula">{f}</div>
                            <div class="tc">{tc_k:.1f} <span class="unit">K</span></div>
                            <div class="unit">{tc_c:.1f} °C</div>
                        </div>
                        """, unsafe_allow_html=True)
                    else:
                        st.error(f"Не удалось обработать формулу «{formula}». Проверьте формат (например, Fe3O4, Nd2Fe14B).")
                except FileNotFoundError:
                    st.error("Модель не найдена. Убедитесь, что в каталоге есть curie_model.joblib и curie_scaler.joblib.")
                except Exception as e:
                    st.error(f"Ошибка: {e}")

    else:
        formulas_raw = st.text_area(
            "Формулы (по одной на строку)",
            height=120,
            placeholder="Fe3O4\nNd2Fe14B\nCoFe2O4",
            help="Пустые строки и строки с # игнорируются.",
        )
        uploaded = st.file_uploader("Или загрузите файл", type=["txt", "csv"])
        if uploaded is not None:
            formulas_raw = uploaded.read().decode("utf-8", errors="replace")

        col1, col2, _ = st.columns([1, 1, 2])
        with col1:
            do_predict = st.button("Предсказать T_C", type="primary", key="multi")
        with col2:
            st.download_button(
                "Скачать пример (10 формул)",
                data="Fe3O4\nNd2Fe14B\nCoFe2O4\nFe\nNi\nGd\nSmCo5\nMnBi\nCrO2\nY3Fe5O12",
                file_name="formulas_example.txt",
                mime="text/plain",
                key="dl_example",
            )

        if do_predict:
            lines = [s.strip() for s in formulas_raw.strip().splitlines() if s.strip() and not s.strip().startswith("#")]
            if not lines:
                st.warning("Введите или загрузите хотя бы одну формулу.")
            else:
                try:
                    model, scaler = get_model()
                    results = run_predictions(lines, model, scaler, verbose=False)
                    if not results:
                        st.warning("Ни одна формула не обработана. Проверьте формат.")
                    else:
                        failed = len(lines) - len(results)
                        if failed:
                            st.info(f"Обработано {len(results)} из {len(lines)}; {failed} с ошибками.")
                        st.dataframe(
                            [{"Формула": f, "T_C (K)": f"{tc_k:.1f}", "T_C (°C)": f"{tc_c:.1f}"} for f, tc_k, tc_c in results],
                            use_container_width=True,
                            hide_index=True,
                        )
                        buf = io.StringIO()
                        buf.write("formula,Tc_K,Tc_C\n")
                        for f, tc_k, tc_c in results:
                            buf.write(f"{f},{tc_k:.2f},{tc_c:.2f}\n")
                        st.download_button("Скачать CSV", data=buf.getvalue(), file_name="curie_predictions.csv", mime="text/csv", key="dl_csv")
                except FileNotFoundError:
                    st.error("Модель не найдена. Проверьте наличие curie_model.joblib и curie_scaler.joblib.")
                except Exception as e:
                    st.error(f"Ошибка: {e}")

    with st.expander("О модели"):
        st.markdown("""
        **Вход:** химическая формула (Fe₃O₄, Nd₂Fe₁₄B и т.д.).  
        **Выход:** предсказанная температура Кюри (K и °C).

        **Признаки (118):** только из состава — доли элементов, средняя масса, электроотрицательность, доля магнитных (Fe, Co, Ni, Mn, Cr), редкоземельных, обменные прокси d–f.  
        Модель: Random Forest, обучена на ~28k соединений.
        """)


if __name__ == "__main__":
    main()
