const fetchOpts = { credentials: "include" };
const THEME_KEY = "curie-theme";

function showMsg(text, type) {
  const el = document.getElementById("message");
  if (!el) return;
  el.className = "msg " + (type || "info");
  el.textContent = text;
  el.style.display = "block";
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s ?? "";
  return div.innerHTML;
}

function renderLabelsTable(labels) {
  const wrap = document.getElementById("labels-table-wrap");
  if (!wrap) return;
  if (!labels || labels.length === 0) {
    wrap.innerHTML = "<p class=\"msg info\">Записей пока нет.</p>";
    return;
  }
  let html =
    "<table><thead><tr><th>Формула</th><th>T<sub>C</sub> (K)</th><th>Тип структуры</th><th>K<sub>a</sub> (МДж/м³)</th><th>Ось лёгкого намагничивания</th><th>CIF (файл)</th><th>Сингония</th><th>Источник</th><th>Комментарий</th><th>Дата</th></tr></thead><tbody>";
  labels.forEach((r) => {
    const ka =
      r.anisotropyMJm3 != null && Number.isFinite(Number(r.anisotropyMJm3))
        ? Number(r.anisotropyMJm3).toFixed(4)
        : "";
    html +=
      "<tr><td>" +
      escapeHtml(r.formula) +
      "</td><td>" +
      (r.curieTcK != null ? Number(r.curieTcK).toFixed(2) : "") +
      "</td><td>" +
      escapeHtml(r.structureType || "") +
      "</td><td>" +
      escapeHtml(ka) +
      "</td><td>" +
      escapeHtml(r.easyAxis || "") +
      "</td><td>" +
      escapeHtml(r.cifStoredName || "") +
      "</td><td>" +
      escapeHtml(r.synagonia || "") +
      "</td><td>" +
      escapeHtml(r.source || "") +
      "</td><td>" +
      escapeHtml(r.comment || "") +
      "</td><td>" +
      escapeHtml(r.createdAt || "") +
      "</td></tr>";
  });
  wrap.innerHTML = html + "</tbody></table>";
}

function renderClassifyTable(list) {
  const wrap = document.getElementById("classify-table-wrap");
  if (!wrap) return;
  if (!list || list.length === 0) {
    wrap.innerHTML = "<p class=\"msg info\">Записей пока нет.</p>";
    return;
  }
  let html = "<table><thead><tr><th>Формула</th><th>Тип магнетизма</th><th>Дата</th></tr></thead><tbody>";
  list.forEach((r) => {
    html += "<tr><td>" + escapeHtml(r.formula) + "</td><td>" + escapeHtml(r.magneticClass || "") + "</td><td>" + escapeHtml(r.createdAt || "") + "</td></tr>";
  });
  wrap.innerHTML = html + "</tbody></table>";
}

async function loadData() {
  const msgEl = document.getElementById("message");
  if (msgEl) msgEl.style.display = "none";
  try {
    const [labelsRes, classRes] = await Promise.all([
      fetch("/api/labels", fetchOpts),
      fetch("/api/classifications", fetchOpts)
    ]);
    if (labelsRes.status === 401 || labelsRes.status === 403) {
      showMsg("Войдите под учётной записью администратора.", "error");
      const labelsWrap = document.getElementById("labels-table-wrap");
      const classWrap = document.getElementById("classify-table-wrap");
      if (labelsWrap) labelsWrap.innerHTML = "<p><a href=\"/\">Перейти на главную</a> и войти.</p>";
      if (classWrap) classWrap.innerHTML = "";
      return;
    }
    if (!labelsRes.ok) {
      showMsg("Ошибка загрузки разметки: " + labelsRes.status, "error");
      return;
    }
    const labelsData = await labelsRes.json().catch(() => ({}));
    renderLabelsTable(labelsData.labels || []);

    if (!classRes.ok) {
      const classWrap = document.getElementById("classify-table-wrap");
      if (classWrap) classWrap.innerHTML = "<p class=\"msg info\">Не удалось загрузить классификации.</p>";
    } else {
      const classData = await classRes.json().catch(() => ({}));
      renderClassifyTable(classData.classifications || []);
    }
  } catch (e) {
    showMsg("Ошибка сети.", "error");
  }
}

async function downloadCsv(url, filename) {
  try {
    const res = await fetch(url, fetchOpts);
    if (res.status === 401 || res.status === 403) {
      showMsg("Доступ только для администратора.", "error");
      return;
    }
    if (!res.ok) {
      showMsg("Ошибка загрузки CSV: " + res.status, "error");
      return;
    }
    const text = await res.text();
    if (!text) {
      showMsg("Пустой CSV.", "error");
      return;
    }
    const blob = new Blob(["\uFEFF" + text], {
      type: "text/csv;charset=utf-8"
    });
    const urlObj = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = urlObj;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(urlObj);
    }, 200);
  } catch (e) {
    showMsg("Ошибка скачивания CSV.", "error");
  }
}

function applyAdminTheme(theme) {
  document.body.classList.toggle("theme-dark", theme === "dark");
  document.body.classList.toggle("theme-light", theme === "light");
  const btn = document.getElementById("admin-theme-toggle");
  if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const theme = saved === "light" || saved === "dark" ? saved : "dark";
  localStorage.setItem(THEME_KEY, theme);
  applyAdminTheme(theme);
}

function init() {
  initTheme();
  loadData();

  const btnRefresh = document.getElementById("btn-refresh");
  if (btnRefresh) btnRefresh.addEventListener("click", loadData);

  const btnDownloadLabels = document.getElementById("btn-download-labels-csv");
  if (btnDownloadLabels) {
    btnDownloadLabels.addEventListener("click", () => {
      downloadCsv("/api/labels?format=csv", "user_labels.csv");
    });
  }

  const btnDownloadClassify = document.getElementById("btn-download-classify-csv");
  if (btnDownloadClassify) {
    btnDownloadClassify.addEventListener("click", () => {
      downloadCsv("/api/classifications?format=csv", "user_classifications.csv");
    });
  }

  const btnTheme = document.getElementById("admin-theme-toggle");
  if (btnTheme) {
    btnTheme.addEventListener("click", () => {
      const isDark = document.body.classList.contains("theme-dark");
      const next = isDark ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      applyAdminTheme(next);
    });
  }
}

document.addEventListener("DOMContentLoaded", init);

