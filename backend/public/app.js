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
    labelModelPick: "Модель",
    btnPredictRf: "RandomForest",
    btnPredictCrabnet: "CrabNet",
    thFormula: "Формула",
    thTcK: "T\u2093 (K)",
    thTcC: "T\u2093 (\u00b0C)",
    statusIdle: "",
    statusLoading: "Выполняется запрос...",
    statusDone: (n) => `Получено ${n} предсказаний`,
    errorNoFormulas: "Введите хотя бы одну формулу.",
    errorRequest: "Ошибка запроса. Проверьте, что backend запущен.",
    errorCrabnet503: "CrabNet недоступен: проверьте веса и зависимости на Python-сервисе.",
    errorModel503: "Сервис модели (503). Подробности ниже.",
    errorInvalidFormula: "Формула «{formula}» не распознана.",
    errorSuggestion: "Возможно, вы имели в виду: {suggestion}",

    // LABEL FORM (RU)
    labelCardTitle: "Данные по формуле",
    labelCardHint:
      "Обязательна только формула. T\u2093 и остальные поля — по желанию.",
    labelOptionalSummary:
      "Дополнительно: тип структуры, анизотропия, сингония, CIF, ось",
    labelOptionalHint:
      "Тип структуры вводите сами. Сингония — кристаллографическая система. CIF — по желанию.",
    labelStructureLabel: "Тип структуры",
    labelStructurePh: "",
    labelEasyAxisLabel: "Ось лёгкого намагничивания",
    labelEasyAxisPh: "Например: [001], c-axis, в плоскости базиса…",
    labelCifLabel: "Файл структуры (.cif)",
    labelFormulaLabel: "Формула *",
    labelFormulaPh: "Fe3O4, Nd2Fe14B",
    labelTcLabel: "Температура Кюри",
    labelTcPh: "Например, 785",
    labelTcUnitLabel: "Единицы",
    labelAnisoLabel: "Константа анизотропии K_a (МДж/м³)",
    labelAnisoPh: "Например, 0.85",
    labelAnisoHint:
      "В справочниках (табл. 11.1 и др.) K\u2081 часто в кДж/м³: значение в МДж/м³ = (кДж/м³) \u00f7 1000. Допускаются отрицательные K\u2081.",
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
    btnLabel: "Сохранить данные по формуле",
    cifBulkTitle: "Массовая загрузка CIF",
    cifBulkHint:
      "Несколько файлов без формы выше — только для зарегистрированных пользователей (нужна авторизация).",
    cifBulkFilesHint:
      "Можно загрузить один или несколько CIF. Для одной формулы с полной карточкой удобнее форма «Данные по формуле».",
    labelStatusIdle: "",
    labelStatusSuccess: "Разметка отправлена.",
    labelErrorRequired: "Укажите формулу.",
    labelErrorRequest: "Не удалось сохранить разметку.",

    // CLASSIFY FORM (RU)
    classifyCardTitle: "Классификация по типу магнетизма",
    classifyFormulaLabel: "Формула *",
    classifyClassLabel: "Тип магнетизма *",
    classifyPlaceholder: "— выберите —",
    classifyOptions: {
      ferromagnet: "Ферромагнетик",
      antiferromagnet: "Антиферромагнетик",
      ferrimagnet: "Ферримагнетик",
      diamagnet: "Диамагнетик",
      paramagnet: "Парамагнетик"
    },
    btnClassify: "Отправить классификацию",
    classifyStatusSuccess: "Классификация отправлена.",
    classifyErrorRequired: "Укажите формулу и тип магнетизма.",
    classifyErrorRequest: "Не удалось сохранить классификацию."
  },
  en: {
    title: "Curie temperature prediction",
    subtitle:
      "Enter formulas (one per line) to get T\u2093 in K and \u00b0C",
    labelFormulas: "Formulas",
    hint:
      "One formula per line. Empty lines and lines starting with # are ignored.",
    labelModelPick: "Model",
    btnPredictRf: "RandomForest",
    btnPredictCrabnet: "CrabNet",
    thFormula: "Formula",
    thTcK: "T\u2093 (K)",
    thTcC: "T\u2093 (\u00b0C)",
    statusIdle: "",
    statusLoading: "Request in progress...",
    statusDone: (n) => `Received ${n} predictions`,
    errorNoFormulas: "Enter at least one formula.",
    errorRequest: "Request error. Check that backend is running.",
    errorCrabnet503: "CrabNet unavailable: check weights and Python service dependencies.",
    errorModel503: "Model service returned 503. Details below.",
    errorInvalidFormula: "Formula «{formula}» was not recognized.",
    errorSuggestion: "Did you mean: {suggestion}",

    // LABEL FORM (EN)
    labelCardTitle: "Data by formula",
    labelCardHint:
      "Only the formula is required. T\u2093 and other fields are optional.",
    labelOptionalSummary:
      "Optional: structure type, anisotropy, crystal system, CIF, easy axis",
    labelOptionalHint:
      "Structure type: enter your own text. Crystal system = symmetry class. CIF optional.",
    labelStructureLabel: "Structure type",
    labelStructurePh: "",
    labelEasyAxisLabel: "Easy magnetization axis",
    labelEasyAxisPh: "e.g. [001], c-axis, in the basal plane…",
    labelCifLabel: "Structure file (.cif)",
    labelFormulaLabel: "Formula *",
    labelFormulaPh: "Fe3O4, Nd2Fe14B",
    labelTcLabel: "Curie temperature",
    labelTcPh: "e.g., 785",
    labelTcUnitLabel: "Units",
    labelAnisoLabel: "Anisotropy constant (MJ/m³)",
    labelAnisoPh: "e.g., 0.85",
    labelSynLabel: "Crystal system (symmetry)",
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
    btnLabel: "Save formula data",
    cifBulkTitle: "Bulk CIF upload",
    cifBulkHint:
      "Multiple files without the form above — signed-in users only.",
    cifBulkFilesHint:
      "Upload one or many CIFs. For a full per-formula card, use «Data by formula» above.",
    labelStatusIdle: "",
    labelStatusSuccess: "Annotation submitted.",
    labelErrorRequired: "Please enter a formula.",
    labelErrorRequest: "Failed to save annotation.",

    // CLASSIFY FORM (EN)
    classifyCardTitle: "Classification by magnetic type",
    classifyFormulaLabel: "Formula *",
    classifyClassLabel: "Magnetic type *",
    classifyPlaceholder: "— select —",
    classifyOptions: {
      ferromagnet: "Ferromagnet",
      antiferromagnet: "Antiferromagnet",
      ferrimagnet: "Ferrimagnet",
      diamagnet: "Diamagnet",
      paramagnet: "Paramagnet"
    },
    btnClassify: "Submit classification",
    classifyStatusSuccess: "Classification submitted.",
    classifyErrorRequired: "Please provide formula and magnetic type.",
    classifyErrorRequest: "Failed to save classification."
  }
};

let currentLang = "ru";

// DOM REFERENCES
const els = {
  title: document.getElementById("title-text"),
  subtitle: document.getElementById("subtitle-text"),
  labelFormulas: document.getElementById("label-formulas"),
  hint: document.getElementById("hint-text"),
  labelModelPick: document.getElementById("label-model-pick"),
  btnPredictRf: document.getElementById("btn-predict-rf"),
  btnPredictCrabnet: document.getElementById("btn-predict-crabnet"),
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
  labelAnisoHint: document.getElementById("label-aniso-hint"),
  labelStructureLabel: document.getElementById("label-structure-label"),
  labelStructureInput: document.getElementById("label-structure-type"),
  labelSynLabel: document.getElementById("label-syn-label"),
  labelSynSelect: document.getElementById("label-syn"),
  labelSourceLabel: document.getElementById("label-source-label"),
  labelSourceInput: document.getElementById("label-source"),
  labelCommentLabel: document.getElementById("label-comment-label"),
  labelCommentInput: document.getElementById("label-comment"),
  labelCardHint: document.getElementById("label-card-hint"),
  labelOptionalSummary: document.getElementById("label-optional-summary"),
  labelOptionalHint: document.getElementById("label-optional-hint"),
  labelEasyAxisLabel: document.getElementById("label-easy-axis-label"),
  labelEasyAxisInput: document.getElementById("label-easy-axis"),
  labelCifLabel: document.getElementById("label-cif-label"),
  labelCifInput: document.getElementById("label-cif"),
  labelStatus: document.getElementById("label-status"),
  labelError: document.getElementById("label-error"),
  labelButton: document.getElementById("btn-label"),
  cifBulkTitle: document.getElementById("cif-bulk-title"),
  cifBulkHint: document.getElementById("cif-bulk-hint"),
  cifBulkFilesHint: document.getElementById("cif-bulk-files-hint"),

  themeToggle: document.getElementById("theme-toggle"),

  // Auth
  authButtons: document.getElementById("auth-buttons"),
  userInfo: document.getElementById("user-info"),
  userEmail: document.getElementById("user-email"),
  linkAdmin: document.getElementById("link-admin"),
  btnLogout: document.getElementById("btn-logout"),
  btnShowLogin: document.getElementById("btn-show-login"),
  btnShowRegister: document.getElementById("btn-show-register"),
  authCard: document.getElementById("auth-card"),
  authTabLogin: document.getElementById("auth-tab-login"),
  authTabRegister: document.getElementById("auth-tab-register"),
  authFormLogin: document.getElementById("auth-form-login"),
  authFormRegister: document.getElementById("auth-form-register"),
  loginEmail: document.getElementById("login-email"),
  loginPassword: document.getElementById("login-password"),
  authErrorLogin: document.getElementById("auth-error-login"),
  btnLogin: document.getElementById("btn-login"),
  registerEmail: document.getElementById("register-email"),
  registerPassword: document.getElementById("register-password"),
  authErrorRegister: document.getElementById("auth-error-register"),
  btnRegister: document.getElementById("btn-register"),

  // Classify form
  classifyCardTitle: document.getElementById("classify-card-title"),
  classifyFormulaLabel: document.getElementById("classify-formula-label"),
  classifyFormulaInput: document.getElementById("classify-formula"),
  classifyClassLabel: document.getElementById("classify-class-label"),
  classifyClassSelect: document.getElementById("classify-class"),
  classifyStatus: document.getElementById("classify-status"),
  classifyError: document.getElementById("classify-error"),
  btnClassify: document.getElementById("btn-classify"),

  // CIF upload
  cifFilesInput: document.getElementById("cif-files"),
  cifFormulaInput: document.getElementById("cif-formula"),
  cifCommentInput: document.getElementById("cif-comment"),
  cifStatus: document.getElementById("cif-status"),
  cifError: document.getElementById("cif-error"),
  btnUploadCif: document.getElementById("btn-upload-cif")
};

const fetchOpts = { credentials: "include" };

function updateAuthUI(user) {
  if (els.authButtons) els.authButtons.style.display = user ? "none" : "flex";
  if (els.userInfo) els.userInfo.style.display = user ? "flex" : "none";
  if (user && els.userEmail) els.userEmail.textContent = user.email;
  if (els.linkAdmin) els.linkAdmin.style.display = user && user.role === "admin" ? "inline-block" : "none";
}

async function loadAuth() {
  try {
    const res = await fetch("/api/auth/me", fetchOpts);
    const data = await res.json().catch(() => ({}));
    const user = res.ok && data.user ? data.user : null;
    updateAuthUI(user);
    return user;
  } catch (e) {
    updateAuthUI(null);
    return null;
  }
}

function showAuthCard(mode) {
  if (!els.authCard) return;
  els.authCard.style.display = "block";
  const isLogin = mode === "login";
  if (els.authFormLogin) els.authFormLogin.style.display = isLogin ? "block" : "none";
  if (els.authFormRegister) els.authFormRegister.style.display = isLogin ? "none" : "block";
  if (els.authTabLogin) els.authTabLogin.classList.toggle("active", isLogin);
  if (els.authTabRegister) els.authTabRegister.classList.toggle("active", !isLogin);
  if (els.authErrorLogin) els.authErrorLogin.textContent = "";
  if (els.authErrorRegister) els.authErrorRegister.textContent = "";
}

function applyTranslations() {
  const t = translations[currentLang];
  if (els.title) els.title.textContent = t.title;
  if (els.subtitle) els.subtitle.textContent = t.subtitle;
  if (els.labelFormulas) els.labelFormulas.textContent = t.labelFormulas;
  if (els.hint) els.hint.textContent = t.hint;
  if (els.labelModelPick) els.labelModelPick.textContent = t.labelModelPick;
  if (els.btnPredictRf) els.btnPredictRf.textContent = t.btnPredictRf;
  if (els.btnPredictCrabnet) els.btnPredictCrabnet.textContent = t.btnPredictCrabnet;
  if (els.thFormula) els.thFormula.textContent = t.thFormula;
  if (els.thTcK)
    els.thTcK.innerHTML = t.thTcK.replace("T\u2093", "T<sub>C</sub>");
  if (els.thTcC)
    els.thTcC.innerHTML = t.thTcC.replace("T\u2093", "T<sub>C</sub>");
  if (els.status) els.status.textContent = t.statusIdle;
  if (els.error) els.error.textContent = "";

  // label form texts
  if (els.labelCardTitle) els.labelCardTitle.textContent = t.labelCardTitle;
  if (els.labelCardHint) {
    els.labelCardHint.innerHTML = t.labelCardHint.replace(
      /T\u2093/g,
      "T<sub>C</sub>"
    );
  }
  if (els.labelOptionalSummary) els.labelOptionalSummary.textContent = t.labelOptionalSummary;
  if (els.labelOptionalHint) els.labelOptionalHint.textContent = t.labelOptionalHint;
  if (els.labelStructureLabel)
    els.labelStructureLabel.textContent = t.labelStructureLabel;
  if (els.labelStructureInput) {
    els.labelStructureInput.placeholder = t.labelStructurePh || "";
  }
  if (els.labelFormulaLabel)
    els.labelFormulaLabel.textContent = t.labelFormulaLabel;
  if (els.labelFormulaInput)
    els.labelFormulaInput.placeholder = t.labelFormulaPh;
  if (els.labelTcLabel) els.labelTcLabel.textContent = t.labelTcLabel;
  if (els.labelTcInput) els.labelTcInput.placeholder = t.labelTcPh;
  if (els.labelTcUnitLabel)
    els.labelTcUnitLabel.textContent = t.labelTcUnitLabel;
  if (els.labelAnisoLabel)
    els.labelAnisoLabel.innerHTML = t.labelAnisoLabel.replace(
      /K_a/g,
      "K<sub>a</sub>"
    );
  if (els.labelAnisoInput)
    els.labelAnisoInput.placeholder = t.labelAnisoPh;
  if (els.labelAnisoHint && t.labelAnisoHint)
    els.labelAnisoHint.textContent = t.labelAnisoHint;
  if (els.labelEasyAxisLabel)
    els.labelEasyAxisLabel.textContent = t.labelEasyAxisLabel;
  if (els.labelEasyAxisInput)
    els.labelEasyAxisInput.placeholder = t.labelEasyAxisPh;
  if (els.labelCifLabel) els.labelCifLabel.textContent = t.labelCifLabel;
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
  if (els.cifBulkTitle) els.cifBulkTitle.textContent = t.cifBulkTitle;
  if (els.cifBulkHint) els.cifBulkHint.textContent = t.cifBulkHint;
  if (els.cifBulkFilesHint) {
    els.cifBulkFilesHint.innerHTML = t.cifBulkFilesHint.replace(
      /T\u2093/g,
      "T<sub>C</sub>"
    );
  }
  if (els.labelStatus) els.labelStatus.textContent = t.labelStatusIdle;
  if (els.labelError) els.labelError.textContent = "";

  // сингония: локализация текста опций
  if (els.labelSynSelect && Array.isArray(t.synOptions)) {
    const opts = els.labelSynSelect.options;
    for (let i = 0; i < opts.length && i < t.synOptions.length; i++) {
      opts[i].textContent = t.synOptions[i];
    }
  }

  // classify form
  if (els.classifyCardTitle) els.classifyCardTitle.textContent = t.classifyCardTitle;
  if (els.classifyFormulaLabel) els.classifyFormulaLabel.textContent = t.classifyFormulaLabel;
  if (els.classifyClassLabel) els.classifyClassLabel.textContent = t.classifyClassLabel;
  if (els.classifyClassSelect && t.classifyOptions) {
    const opts = els.classifyClassSelect.options;
    if (opts[0]) opts[0].textContent = t.classifyPlaceholder || "—";
    const vals = ["ferromagnet", "antiferromagnet", "ferrimagnet", "diamagnet", "paramagnet"];
    for (let i = 0; i < vals.length && opts[i + 1]; i++) {
      opts[i + 1].textContent = t.classifyOptions[vals[i]] || vals[i];
    }
  }
  if (els.btnClassify) els.btnClassify.textContent = t.btnClassify;
  if (els.classifyStatus) els.classifyStatus.textContent = "";
  if (els.classifyError) els.classifyError.textContent = "";
}
// Смена темы: dark = theme-dark, light = theme-light
function applyTheme(theme) {
  const body = document.body;
  body.classList.toggle("theme-dark", theme === "dark");
  body.classList.toggle("theme-light", theme === "light");
  if (els.themeToggle) {
    els.themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
  }
}

(function initTheme() {
  let saved = window.localStorage.getItem(THEME_KEY);
  if (saved !== "dark" && saved !== "light") saved = "dark";
  window.localStorage.setItem(THEME_KEY, saved);
  applyTheme(saved);
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

(function initAuth() {
  loadAuth();
  if (els.btnShowLogin) els.btnShowLogin.addEventListener("click", () => showAuthCard("login"));
  if (els.btnShowRegister) els.btnShowRegister.addEventListener("click", () => showAuthCard("register"));
  if (els.authTabLogin) els.authTabLogin.addEventListener("click", () => showAuthCard("login"));
  if (els.authTabRegister) els.authTabRegister.addEventListener("click", () => showAuthCard("register"));
  if (els.btnLogin) {
    els.btnLogin.addEventListener("click", async () => {
      const email = els.loginEmail?.value?.trim() ?? "";
      const password = els.loginPassword?.value ?? "";
      if (els.authErrorLogin) els.authErrorLogin.textContent = "";
      if (!email || !password) {
        if (els.authErrorLogin) els.authErrorLogin.textContent = "Введите email и пароль.";
        return;
      }
      els.btnLogin.disabled = true;
      try {
        const res = await fetch("/api/auth/login", {
          ...fetchOpts,
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          els.authCard.style.display = "none";
          updateAuthUI(data.user);
        } else {
          if (els.authErrorLogin) els.authErrorLogin.textContent = data.error || "Ошибка входа.";
        }
      } catch (e) {
        if (els.authErrorLogin) els.authErrorLogin.textContent = "Ошибка сети.";
      } finally {
        els.btnLogin.disabled = false;
      }
    });
  }
  if (els.btnRegister) {
    els.btnRegister.addEventListener("click", async () => {
      const email = els.registerEmail?.value?.trim() ?? "";
      const password = els.registerPassword?.value ?? "";
      if (els.authErrorRegister) els.authErrorRegister.textContent = "";
      if (!email || !password) {
        if (els.authErrorRegister) els.authErrorRegister.textContent = "Введите email и пароль.";
        return;
      }
      if (password.length < 6) {
        if (els.authErrorRegister) els.authErrorRegister.textContent = "Пароль не менее 6 символов.";
        return;
      }
      els.btnRegister.disabled = true;
      try {
        const res = await fetch("/api/auth/register", {
          ...fetchOpts,
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          els.authCard.style.display = "none";
          updateAuthUI(data.user);
        } else {
          if (els.authErrorRegister) els.authErrorRegister.textContent = data.error || "Ошибка регистрации.";
        }
      } catch (e) {
        if (els.authErrorRegister) els.authErrorRegister.textContent = "Ошибка сети.";
      } finally {
        els.btnRegister.disabled = false;
      }
    });
  }
  if (els.btnLogout) {
    els.btnLogout.addEventListener("click", async () => {
      await fetch("/api/auth/logout", { ...fetchOpts, method: "POST" });
      updateAuthUI(null);
    });
  }
})();

function wirePredictButton(btn, model) {
  if (!btn) return;
  btn.addEventListener("click", async () => {
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

    if (els.btnPredictRf) els.btnPredictRf.disabled = true;
    if (els.btnPredictCrabnet) els.btnPredictCrabnet.disabled = true;
    if (els.status) els.status.textContent = t.statusLoading;

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formulas: lines, model })
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.code === "invalid_formula") {
          let msg = t.errorInvalidFormula.replace("{formula}", data.formula || "?");
          if (data.suggestion) {
            msg += " " + t.errorSuggestion.replace("{suggestion}", data.suggestion);
          } else if (data.message) {
            msg += " " + data.message;
          }
          if (els.error) els.error.textContent = msg;
        } else if (res.status === 503) {
          const inner = data.details?.detail ?? data.detail;
          const msg =
            inner && typeof inner === "object" && inner.message ? inner.message : "";
          const prefix =
            inner?.code === "crabnet_weights_missing" || inner?.code === "crabnet_dependency"
              ? t.errorCrabnet503
              : t.errorModel503;
          if (els.error) {
            els.error.textContent = msg ? `${prefix} ${msg}` : prefix;
          }
        } else if (data.error === "Model service error") {
          const d = data.details?.detail;
          if (els.error) {
            els.error.textContent =
              (typeof d === "object" && d?.message) || (typeof d === "string" ? d : "") || t.errorRequest;
          }
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
      if (els.btnPredictRf) els.btnPredictRf.disabled = false;
      if (els.btnPredictCrabnet) els.btnPredictCrabnet.disabled = false;
    }
  });
}

wirePredictButton(els.btnPredictRf, "rf");
wirePredictButton(els.btnPredictCrabnet, "crabnet");

// Разметка: POST /api/label → backend сохраняет в data/user_labels.csv
const labelApiUrl = "/api/label";
if (els.labelButton) {
  els.labelButton.addEventListener("click", async () => {
    const t = translations[currentLang];
    if (els.labelStatus) els.labelStatus.textContent = "";
    if (els.labelError) els.labelError.textContent = "";

    const formula = els.labelFormulaInput?.value?.trim() ?? "";
    const tcRaw = els.labelTcInput?.value?.trim() ?? "";
    const tcUnit = els.labelTcUnitSelect?.value === "C" ? "C" : "K";
    const tcNum =
      tcRaw !== "" && Number.isFinite(parseFloat(tcRaw)) ? parseFloat(tcRaw) : undefined;
    const structureType = els.labelStructureInput?.value?.trim() || undefined;
    const synagonia = els.labelSynSelect?.value?.trim() || undefined;
    const source = els.labelSourceInput?.value?.trim() || undefined;
    const comment = els.labelCommentInput?.value?.trim() || undefined;
    const anisoRaw = els.labelAnisoInput?.value?.trim() ?? "";
    const easyAxis = els.labelEasyAxisInput?.value?.trim() || undefined;
    const cifFile = els.labelCifInput?.files?.[0] ?? null;

    if (!formula) {
      if (els.labelError) els.labelError.textContent = t.labelErrorRequired;
      return;
    }

    els.labelButton.disabled = true;
    if (els.labelStatus) els.labelStatus.textContent = t.statusLoading;

    try {
      const fd = new FormData();
      fd.append("formula", formula);
      if (tcNum !== undefined) {
        fd.append("tcValue", String(tcNum));
        fd.append("tcUnit", tcUnit);
      }
      if (structureType) fd.append("structureType", structureType);
      if (synagonia) fd.append("synagonia", synagonia);
      if (source) fd.append("source", source);
      if (comment) fd.append("comment", comment);
      if (anisoRaw !== "") {
        const a = parseFloat(anisoRaw);
        if (Number.isFinite(a)) fd.append("anisotropy", String(a));
      }
      if (easyAxis) fd.append("easyAxis", easyAxis);
      if (cifFile) fd.append("cif", cifFile, cifFile.name);

      const res = await fetch(labelApiUrl, {
        method: "POST",
        body: fd
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.status === "ok") {
        if (els.labelStatus) els.labelStatus.textContent = t.labelStatusSuccess;
        if (els.labelFormulaInput) els.labelFormulaInput.value = "";
        if (els.labelTcInput) els.labelTcInput.value = "";
        if (els.labelAnisoInput) els.labelAnisoInput.value = "";
        if (els.labelEasyAxisInput) els.labelEasyAxisInput.value = "";
        if (els.labelStructureInput) els.labelStructureInput.value = "";
        if (els.labelSynSelect) els.labelSynSelect.selectedIndex = 0;
        if (els.labelSourceInput) els.labelSourceInput.value = "";
        if (els.labelCommentInput) els.labelCommentInput.value = "";
        if (els.labelCifInput) els.labelCifInput.value = "";
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

// Классификация: POST /api/classify
if (els.btnClassify) {
  els.btnClassify.addEventListener("click", async () => {
    const t = translations[currentLang];
    if (els.classifyStatus) els.classifyStatus.textContent = "";
    if (els.classifyError) els.classifyError.textContent = "";

    const formula = els.classifyFormulaInput?.value?.trim() ?? "";
    const magneticClass = els.classifyClassSelect?.value?.trim() ?? "";

    if (!formula || !magneticClass) {
      if (els.classifyError) els.classifyError.textContent = t.classifyErrorRequired;
      return;
    }

    els.btnClassify.disabled = true;
    if (els.classifyStatus) els.classifyStatus.textContent = t.statusLoading;

    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formula, magneticClass })
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.status === "ok") {
        if (els.classifyStatus) els.classifyStatus.textContent = t.classifyStatusSuccess;
        if (els.classifyFormulaInput) els.classifyFormulaInput.value = "";
        if (els.classifyClassSelect) els.classifyClassSelect.selectedIndex = 0;
      } else {
        if (els.classifyError) els.classifyError.textContent = data.error || t.classifyErrorRequest;
      }
    } catch (e) {
      console.error(e);
      if (els.classifyError) els.classifyError.textContent = t.classifyErrorRequest;
    } finally {
      els.btnClassify.disabled = false;
    }
  });
}

// CIF upload: POST /api/cif/upload
if (els.btnUploadCif) {
  els.btnUploadCif.addEventListener("click", async () => {
    const files = els.cifFilesInput?.files;
    if (els.cifError) els.cifError.textContent = "";
    if (els.cifStatus) els.cifStatus.textContent = "";

    if (!files || files.length === 0) {
      if (els.cifError) els.cifError.textContent = "Выберите хотя бы один .cif файл.";
      return;
    }

    // Простая валидация расширения
    const validFiles = Array.from(files).filter((f) => (f.name || "").toLowerCase().endsWith(".cif"));
    if (validFiles.length === 0) {
      if (els.cifError) els.cifError.textContent = "Нужны файлы с расширением .cif.";
      return;
    }

    els.btnUploadCif.disabled = true;
    if (els.cifStatus) els.cifStatus.textContent = "Загрузка...";

    try {
      const formData = new FormData();
      validFiles.forEach((f) => formData.append("files", f, f.name));
      const formula = els.cifFormulaInput?.value?.trim() ?? "";
      const comment = els.cifCommentInput?.value?.trim() ?? "";
      if (formula) formData.append("formula", formula);
      if (comment) formData.append("comment", comment);

      const res = await fetch("/api/cif/upload", {
        ...fetchOpts,
        method: "POST",
        body: formData
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.status === "ok") {
        if (els.cifStatus) els.cifStatus.textContent = "CIF файлы загружены.";
        if (els.cifFilesInput) els.cifFilesInput.value = "";
        if (els.cifFormulaInput) els.cifFormulaInput.value = "";
        if (els.cifCommentInput) els.cifCommentInput.value = "";
      } else {
        if (els.cifError) els.cifError.textContent = data.error || "Не удалось загрузить CIF.";
      }
    } catch (e) {
      console.error(e);
      if (els.cifError) els.cifError.textContent = "Ошибка сети при загрузке CIF.";
    } finally {
      els.btnUploadCif.disabled = false;
    }
  });
}
