// ===== State Management =====
export let currentLang = localStorage.getItem("lang") || "en";
export let newsData = null;
export let latestData = null;
export let viewingEdition = null;

export function setCurrentLang(lang) {
  currentLang = lang;
  localStorage.setItem("lang", lang);
}

export function setNewsData(data) {
  newsData = data;
}

export function setLatestData(data) {
  latestData = data;
  newsData = data;
}

export function setViewingEdition(date) {
  viewingEdition = date;
}

export function resetToLatest() {
  if (latestData) {
    newsData = latestData;
    viewingEdition = null;
  }
}

export function navigateToArticle(id) {
  window.location.hash = `#/article/${id}`;
}

window.navigateToArticle = navigateToArticle;
