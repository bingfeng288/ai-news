// ===== Routing =====
import * as state from "./state.js";
import { t } from "./i18n-integration.js";
import { renderHero, renderNewsGrid, renderCategories, renderDetailPage, showHomePage } from "./views.js";
import { loadEdition } from "./data.js";
import { getReadHistory } from "./history.js";

export function handleRoute() {
  const hash = window.location.hash;

  if (hash.startsWith("#/article/")) {
    const id = parseInt(hash.split("/")[2]);
    if (!isNaN(id) && state.newsData) {
      renderDetailPage(id);
      return;
    }
  }

  if (hash === "#/history") {
    renderHistoryPage();
    return;
  }

  showHomePage();
}

export async function renderHistoryPage() {
  const historyPage = document.getElementById("history-page");
  if (!historyPage) return;

  const homeSections = document.getElementById("home-sections");
  const detailPage = document.getElementById("detail-page");
  if (homeSections) homeSections.style.display = "none";
  if (detailPage) detailPage.style.display = "none";
  historyPage.style.display = "block";

  let editions = [];
  try {
    const response = await fetch("data/archive/index.json");
    if (response.ok) editions = await response.json();
  } catch (_e) {
    // archive index unavailable
  }

  const readHistory = getReadHistory();

  historyPage.innerHTML = `
    <div class="history-page">
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">${t("history.title")}</h2>
        </div>

        <div class="history-section">
          <h3 class="history-section-title">${t("history.pastEditions")}</h3>
          ${
            editions.length > 0
              ? `<div class="edition-grid">
                  ${editions
                    .map(
                      (ed) => `
                    <div class="edition-card" onclick="loadEdition('${ed.date}')">
                      <div class="edition-card-header">
                        <span class="edition-date">${ed.date}</span>
                        <span class="edition-count">${t("history.editionArticles").replace("{n}", ed.count)}</span>
                      </div>
                      <button class="edition-view-btn">${t("history.viewEdition")}</button>
                    </div>
                  `
                    )
                    .join("")}
                </div>`
              : `<p class="history-empty">${t("history.emptyEditions")}</p>`
          }
        </div>

        <div class="history-section">
          <h3 class="history-section-title">${t("history.recentlyRead")}</h3>
          ${
            readHistory.length > 0
              ? `<div class="history-grid">
                  ${readHistory
                    .map(
                      (h) => `
                    <div class="history-card" onclick="navigateToArticle(${h.id})">
                      <img src="${h.image}" alt="${h.title}" class="history-card-image" loading="lazy">
                      <div class="history-card-content">
                        <span class="card-category">${t("categories." + h.category)}</span>
                        <h4>${h.title}</h4>
                        <p>${h.excerpt}</p>
                        <span class="history-card-date">${h.date || ""}</span>
                      </div>
                    </div>
                  `
                    )
                    .join("")}
                </div>
                <button class="history-clear-btn" onclick="clearReadHistory(); renderHistoryPage();">${t("history.clearHistory")}</button>`
              : `<p class="history-empty">${t("history.emptyHistory")}</p>`
          }
        </div>
      </div>
    </div>
  `;

  window.scrollTo({ top: 0, behavior: "instant" });
}

export async function handleLoadEdition(date) {
  const data = await loadEdition(date);
  if (!data) return;

  const homeSections = document.getElementById("home-sections");
  const detailPage = document.getElementById("detail-page");
  const historyPage = document.getElementById("history-page");
  if (homeSections) homeSections.style.display = "block";
  if (detailPage) detailPage.style.display = "none";
  if (historyPage) historyPage.style.display = "none";

  renderHero(data.featured);
  renderNewsGrid(data.articles);
  renderCategories();

  const hero = document.getElementById("hero-content");
  if (hero) {
    const banner = document.createElement("div");
    banner.className = "edition-banner";
    banner.innerHTML = `
      <span>${t("history.viewingEdition")} ${date}</span>
      <button class="edition-banner-btn" onclick="backToLatest()">${t("history.backToLatest")}</button>
    `;
    hero.parentNode.insertBefore(banner, hero);
  }

  window.scrollTo({ top: 0, behavior: "instant" });
}

export function backToLatest() {
  if (!state.latestData) return;
  state.resetToLatest();

  const banner = document.querySelector(".edition-banner");
  if (banner) banner.remove();

  renderHero(state.newsData.featured);
  renderNewsGrid(state.newsData.articles);
  renderCategories();
}

window.loadEdition = handleLoadEdition;
window.backToLatest = backToLatest;
window.renderHistoryPage = renderHistoryPage;
