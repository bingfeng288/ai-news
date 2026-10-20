// ===== i18n Integration =====
import * as state from "./state.js";

export function t(key) {
  const keys = key.split(".");
  let value = window.translations[state.currentLang];
  for (const k of keys) {
    value = value?.[k];
  }
  return value || key;
}

export function updateContent() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const text = t(key);
    if (text) el.textContent = text;
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    const text = t(key);
    if (text) el.placeholder = text;
  });

  // Trigger re-render callback (wired by app.js)
  if (window.__rerenderCallback) {
    window.__rerenderCallback();
  }
}

export function toggleLanguage() {
  const newLang = state.currentLang === "en" ? "zh" : "en";
  state.setCurrentLang(newLang);
  updateContent();
  updateLangButton();
}

export function updateLangButton() {
  const langBtn = document.getElementById("lang-toggle");
  if (langBtn) {
    langBtn.textContent = state.currentLang === "en" ? "中文" : "EN";
  }
}
