// BACKEND ENDPOINT: адрес Node.js API для предсказаний
const apiUrl = "/api/predict";

//Тема
const THEME_KEY = "curie-theme";

// TRANSLATIONS: все текстовые строки интерфейса для RU и EN
const translations = {
  ru: {
    title: "Предсказание температуры Кюри",
    subtitle:
      "Введите формулы (по одной на строку) и получите оценку T\u2093 в K и \u00b0C",
    labelFormulas: "Формулы",
    hint:
      "Одна формула на строку. Пустые строки и строки, начинающиеся с #, игнорируются.",
    btnPredict: "Предсказать T\u2093",
    thFormula: "Формула",
    thTcK: "T\u2093 (K)",
    thTcC: "T\u2093 (\u00b0C)",
    statusIdle: "",
    statusLoading: "Выполняется запрос...",
    statusDone: (n) => `Получено ${n} предсказаний`,
    errorNoFormulas: "Введите хотя бы одну формулу.",
    errorRequest: "Ошибка запроса. Проверьте, что backend запущен.",
    errorInvalidFormula: "Формула «{formula}» не распознана.",
    errorSuggestion: "Возможно, вы имели в виду: {suggestion}",

    // LABEL FORM (RU)
    labelCardTitle: "Добавить разметку (T\u2093, сингония, источник)",
    labelFormulaLabel: "Формула *",
    labelFormulaPh: "Fe3O4, Nd2Fe14B",
    labelTcLabel: "Температура Кюри *",
    labelTcPh: "Например, 785",
    labelTcUnitLabel: "Единицы",
    labelAnisoLabel: "Константа анизотропии (МДж/м³)",
    labelAnisoPh: "Например, 0.85",
    labelSynLabel: "Сингония (необязательно)",
    synOptions: [
      "— не указано —",
      "триклинная",
      "моноклинная",
      "ромбическая",
      "тетрагональная",
      "гексагональная",
      "ромбоэдрическая",
      "кубическая"
    ],
    labelSourceLabel: "Источник (статья, DOI, база)",
    labelSourcePh: "Например, DOI:10.1234/...",
    labelCommentLabel: "Комментарий",
    labelCommentPh:
      "Дополнительные примечания, условия измерений и т.д.",
    btnLabel: "Отправить разметку",
    labelStatusIdle: "",
    labelStatusSuccess: "Разметка отправлена.",
    labelErrorRequired: "Укажите хотя бы формулу и температуру.",
    labelErrorRequest: "Не удалось сохранить разметку."
  },
  en: {
    title: "Curie temperature prediction",
    subtitle:
      "Enter formulas (one per line) to get T\u2093 in K and \u00b0C",
    labelFormulas: "Formulas",
    hint:
      "One formula per line. Empty lines and lines starting with # are ignored.",
    btnPredict: "Predict T\u2093",
    thFormula: "Formula",
    thTcK: "T\u2093 (K)",
    thTcC: "T\u2093 (\u00b0C)",
    statusIdle: "",
    statusLoading: "Request in progress...",
    statusDone: (n) => `Received ${n} predictions`,
    errorNoFormulas: "Enter at least one formula.",
    errorRequest: "Request error. Check that backend is running.",
    errorInvalidFormula: "Formula «{formula}» was not recognized.",
    errorSuggestion: "Did you mean: {suggestion}",

    // LABEL FORM (EN)
    labelCardTitle: "Add annotation (T\u2093, symmetry, source)",
    labelFormulaLabel: "Formula *",
    labelFormulaPh: "Fe3O4, Nd2Fe14B",
    labelTcLabel: "Curie temperature *",
    labelTcPh: "e.g., 785",
    labelTcUnitLabel: "Units",
    labelAnisoLabel: "Anisotropy constant (MJ/m³)",
    labelAnisoPh: "e.g., 0.85",
    labelSynLabel: "Crystal system (optional)",
    synOptions: [
      "— not specified —",
      "triclinic",
      "monoclinic",
      "orthorhombic",
      "tetragonal",
      "hexagonal",
      "rhombohedral",
      "cubic"
    ],
    labelSourceLabel: "Source (paper, DOI, database)",
    labelSourcePh: "e.g., DOI:10.1234/...",
    labelCommentLabel: "Comment",
    labelCommentPh: "Additional notes, measurement conditions, etc.",
    btnLabel: "Submit annotation",
    labelStatusIdle: "",
    labelStatusSuccess: "Annotation submitted.",
    labelErrorRequired: "Please provide at least formula and temperature.",
    labelErrorRequest: "Failed to save annotation."
  }
};

let currentLang = "ru";

// DOM REFERENCES
const els = {
  title: document.getElementById("title-text"),
  subtitle: document.getElementById("subtitle-text"),
  labelFormulas: document.getElementById("label-formulas"),
  hint: document.getElementById("hint-text"),
  btnPredict: document.getElementById("btn-predict"),
  thFormula: document.getElementById("th-formula"),
  thTcK: document.getElementById("th-tc-k"),
  thTcC: document.getElementById("th-tc-c"),
  status: document.getElementById("status"),
  error: document.getElementById("error"),
  textarea: document.getElementById("formulas"),
  table: document.getElementById("results-table"),
  tbody: document.getElementById("results-body"),

  // LABEL FORM
  labelCardTitle: document.getElementById("label-card-title"),
  labelFormulaLabel: document.getElementById("label-formula-label"),
  labelFormulaInput: document.getElementById("label-formula"),
  labelTcLabel: document.getElementById("label-tc-label"),
  labelTcInput: document.getElementById("label-tc-value"),
  labelTcUnitLabel: document.getElementById("label-tc-unit-label"),
  labelTcUnitSelect: document.getElementById("label-tc-unit"),
  labelAnisoLabel: document.getElementById("label-aniso-label"),
  labelAnisoInput: document.getElementById("label-aniso"),
  labelSynLabel: document.getElementById("label-syn-label"),
  labelSynSelect: document.getElementById("label-syn"),
  labelSourceLabel: document.getElementById("label-source-label"),
  labelSourceInput: document.getElementById("label-source"),
  labelCommentLabel: document.getElementById("label-comment-label"),
  labelCommentInput: document.getElementById("label-comment"),
  labelStatus: document.getElementById("label-status"),
  labelError: document.getElementById("label-error"),
  labelButton: document.getElementById("btn-label"),

  // Цвет кнопки
  themeToggle:document.getElementById("theme-toggle")
};

function applyTranslations() {
  const t = translations[currentLang];
  if (els.title) els.title.textContent = t.title;
  if (els.subtitle) els.subtitle.textContent = t.subtitle;
  if (els.labelFormulas) els.labelFormulas.textContent = t.labelFormulas;
  if (els.hint) els.hint.textContent = t.hint;
  if (els.btnPredict)
    els.btnPredict.innerHTML = t.btnPredict.replace(
      "T\u2093",
      "T<sub>C</sub>"
    );
  if (els.thFormula) els.thFormula.textContent = t.thFormula;
  if (els.thTcK)
    els.thTcK.innerHTML = t.thTcK.replace("T\u2093", "T<sub>C</sub>");
  if (els.thTcC)
    els.thTcC.innerHTML = t.thTcC.replace("T\u2093", "T<sub>C</sub>");
  if (els.status) els.status.textContent = t.statusIdle;
  if (els.error) els.error.textContent = "";

  // label form texts
  if (els.labelCardTitle) els.labelCardTitle.textContent = t.labelCardTitle;
  if (els.labelFormulaLabel)
    els.labelFormulaLabel.textContent = t.labelFormulaLabel;
  if (els.labelFormulaInput)
    els.labelFormulaInput.placeholder = t.labelFormulaPh;
  if (els.labelTcLabel) els.labelTcLabel.textContent = t.labelTcLabel;
  if (els.labelTcInput) els.labelTcInput.placeholder = t.labelTcPh;
  if (els.labelTcUnitLabel)
    els.labelTcUnitLabel.textContent = t.labelTcUnitLabel;
  if (els.labelAnisoLabel)
    els.labelAnisoLabel.textContent = t.labelAnisoLabel;
  if (els.labelAnisoInput)
    els.labelAnisoInput.placeholder = t.labelAnisoPh;
  if (els.labelSynLabel) els.labelSynLabel.textContent = t.labelSynLabel;
  if (els.labelSourceLabel)
    els.labelSourceLabel.textContent = t.labelSourceLabel;
  if (els.labelSourceInput)
    els.labelSourceInput.placeholder = t.labelSourcePh;
  if (els.labelCommentLabel)
    els.labelCommentLabel.textContent = t.labelCommentLabel;
  if (els.labelCommentInput)
    els.labelCommentInput.placeholder = t.labelCommentPh;
  if (els.labelButton) els.labelButton.textContent = t.btnLabel;
  if (els.labelStatus) els.labelStatus.textContent = t.labelStatusIdle;
  if (els.labelError) els.labelError.textContent = "";

  // сингония: локализация текста опций
  if (els.labelSynSelect && Array.isArray(t.synOptions)) {
    const opts = els.labelSynSelect.options;
    for (let i = 0; i < opts.length && i < t.synOptions.length; i++) {
      opts[i].textContent = t.synOptions[i];
    }
  }
}
//Смена темы
function applyTheme(theme){
  const body = document.body;
  if(theme==="dark")
  {
    body.classList.add("theme-dark");

  }
  else {
    body.classList.remove("theme-dark");
  }

  if (els.themeToggle) {
    els.themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
  }

}

(function initTheme() {
  const saved = window.localStorage.getItem(THEME_KEY);
  const initial = saved === "dark" ||saved === "light" ? saved : "dark";
  applyTheme(initial);
})();

document
  .querySelectorAll(".lang-toggle button")
  .forEach((btn) => {
    btn.addEventListener("click", () => {
      currentLang = btn.dataset.lang;
      document
        .querySelectorAll(".lang-toggle button")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      applyTranslations();
    });
  });

applyTranslations();
if (els.themeToggle) {
  els.themeToggle.addEventListener("click", () => {
    const current = document.body.classList.contains("theme-dark")
      ? "dark"
      : "light";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    window.localStorage.setItem(THEME_KEY, next);
  });
}
if (els.btnPredict) {
  els.btnPredict.addEventListener("click", async () => {
    const t = translations[currentLang];
    if (els.error) els.error.textContent = "";
    if (els.status) els.status.textContent = "";
    if (els.tbody) els.tbody.innerHTML = "";
    if (els.table) els.table.style.display = "none";

    const raw = (els.textarea && els.textarea.value) || "";
    const lines = raw
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("#"));
    if (lines.length === 0) {
      if (els.error) els.error.textContent = t.errorNoFormulas;
      return;
    }

    if (els.btnPredict) els.btnPredict.disabled = true;
    if (els.status) els.status.textContent = t.statusLoading;

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formulas: lines })
      });
      const data = await res.json().catch(() => ({}));

      // Обработка ошибки если сервер отвечает
      if (!res.ok) {
        if (data.code === "invalid_formula") {
          let msg = t.errorInvalidFormula.replace("{formula}", data.formula || "?");
          if (data.suggestion) {
            msg += " " + t.errorSuggestion.replace("{suggestion}", data.suggestion);
          } else if (data.message) {
            msg += " " + data.message;
          }
          if (els.error) els.error.textContent = msg;
        } else if (data.error === "Model service error") {
          if (els.error) els.error.textContent = (data.details?.detail?.message) || t.errorRequest;
        } else if (data.error === "Model service unavailable") {
          if (els.error) els.error.textContent = t.errorRequest;
        } else {
          if (els.error) els.error.textContent = t.errorRequest;
        }
        return;
      }

      if (
        !data.results ||
        !Array.isArray(data.results) ||
        data.results.length === 0
      ) {
        if (els.status) els.status.textContent = t.statusDone(0);
        return;
      }

      if (els.tbody) {
        data.results.forEach((r) => {
          const tr = document.createElement("tr");
          const tdF = document.createElement("td");
          const tdK = document.createElement("td");
          const tdC = document.createElement("td");
          tdF.textContent = r.formula;
          tdK.textContent = r.Tc_K.toFixed(1);
          tdC.textContent = r.Tc_C.toFixed(1);
          tr.appendChild(tdF);
          tr.appendChild(tdK);
          tr.appendChild(tdC);
          els.tbody.appendChild(tr);
        });
      }
      if (els.table) els.table.style.display = "";
      if (els.status)
        els.status.textContent = t.statusDone(data.results.length);
    } catch (e) {
      console.error(e);
      if (els.error) els.error.textContent = t.errorRequest;
    } finally {
      if (els.btnPredict) els.btnPredict.disabled = false;
    }
  });
}

// Разметка: POST /api/label → backend сохраняет в data/user_labels.csv
const labelApiUrl = "/api/label";
if (els.labelButton) {
  els.labelButton.addEventListener("click", async () => {
    const t = translations[currentLang];
    if (els.labelStatus) els.labelStatus.textContent = "";
    if (els.labelError) els.labelError.textContent = "";

    const formula = els.labelFormulaInput?.value?.trim() ?? "";
    const tcRaw = els.labelTcInput?.value?.trim() ?? "";
    const tcUnit = (els.labelTcUnitSelect?.value === "C" ? "C" : "K");
    const synagonia = els.labelSynSelect?.value?.trim() || undefined;
    const source = els.labelSourceInput?.value?.trim() || undefined;
    const comment = els.labelCommentInput?.value?.trim() || undefined;

    if (!formula) {
      if (els.labelError) els.labelError.textContent = t.labelErrorRequired;
      return;
    }
    const tcNum = parseFloat(tcRaw);
    if (!Number.isFinite(tcNum) || tcNum < 0) {
      if (els.labelError) els.labelError.textContent = t.labelErrorRequired;
      return;
    }

    els.labelButton.disabled = true;
    if (els.labelStatus) els.labelStatus.textContent = t.statusLoading;

    try {
      const res = await fetch(labelApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formula,
          tcValue: tcNum,
          tcUnit,
          synagonia,
          source,
          comment
        })
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.status === "ok") {
        if (els.labelStatus) els.labelStatus.textContent = t.labelStatusSuccess;
        if (els.labelFormulaInput) els.labelFormulaInput.value = "";
        if (els.labelTcInput) els.labelTcInput.value = "";
        if (els.labelAnisoInput) els.labelAnisoInput.value = "";
        if (els.labelSynSelect) els.labelSynSelect.selectedIndex = 0;
        if (els.labelSourceInput) els.labelSourceInput.value = "";
        if (els.labelCommentInput) els.labelCommentInput.value = "";
      } else {
        if (els.labelError) els.labelError.textContent = data.error || t.labelErrorRequest;
      }
    } catch (e) {
      console.error(e);
      if (els.labelError) els.labelError.textContent = t.labelErrorRequest;
    } finally {
      els.labelButton.disabled = false;
    }
  });
}
