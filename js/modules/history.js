// ===== Reading History (localStorage) =====
import * as state from "./state.js";

const HISTORY_KEY = "ai-news-history";
const HISTORY_MAX = 20;

export function getReadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (_e) {
    return [];
  }
}

export function recordRead(article) {
  if (!article) return;
  const lang = state.currentLang;
  const title = article[lang]?.title || article.en?.title || "";
  const excerpt = article[lang]?.excerpt || article.en?.excerpt || "";
  const entry = {
    id: article.id,
    category: article.category,
    image: article.image,
    date: article.date,
    title,
    excerpt,
    ts: Date.now(),
  };
  let hist = getReadHistory().filter((h) => h.id !== article.id);
  hist.unshift(entry);
  if (hist.length > HISTORY_MAX) hist = hist.slice(0, HISTORY_MAX);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
  } catch (_e) {
    // localStorage quota exceeded
  }
}

export function clearReadHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (_e) {
    // ignore
  }
}

window.clearReadHistory = clearReadHistory;
