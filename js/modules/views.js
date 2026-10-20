// ===== Content Rendering =====
import * as state from "./state.js";
import { t } from "./i18n-integration.js";
import { recordRead } from "./history.js";
import { findArticle as findArticlePure, filterArticlesByDate } from "../utils.js";

export function renderHero(article) {
  const hero = document.getElementById("hero-content");
  if (!hero) return;

  const data = article[state.currentLang];
  hero.innerHTML = `
    <div class="hero-card" onclick="navigateToArticle(${article.id})">
      <img src="${article.image}" alt="${data.title}" class="hero-image" loading="eager">
      <div class="hero-overlay">
        <span class="hero-badge">${t("hero.badge")}</span>
        <h1 class="hero-title">${data.title}</h1>
        <p class="hero-excerpt">${data.excerpt}</p>
        <div class="hero-meta">
          <span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${article.readTime} ${t("time.minRead")}
          </span>
          <span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${article.timeAgo} ${t("time.hoursAgo")}
          </span>
        </div>
      </div>
    </div>
  `;
}

export function renderNewsGrid(articles) {
  const grid = document.getElementById("news-grid");
  if (!grid) return;

  const today = state.newsData?.featured?.date;
  const todaysArticles = filterArticlesByDate(articles, today);

  grid.innerHTML = todaysArticles
    .map((article) => {
      const data = article[state.currentLang];
      return `
      <article class="news-card" onclick="navigateToArticle(${article.id})">
        <div class="card-image-wrapper">
          <img src="${article.image}" alt="${data.title}" class="card-image" loading="lazy">
          <span class="card-category">${t("categories." + article.category)}</span>
        </div>
        <div class="card-content">
          <h3 class="card-title">${data.title}</h3>
          <p class="card-excerpt">${data.excerpt}</p>
          <div class="card-meta">
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${article.readTime} ${t("time.minRead")}
            </span>
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${article.timeAgo} ${t("time.hoursAgo")}
            </span>
          </div>
        </div>
      </article>
    `;
    })
    .join("");
}

export function renderCategories() {
  const grid = document.getElementById("categories-grid");
  if (!grid) return;

  const categories = [
    { key: "llm", icon: "🤖" },
    { key: "cv", icon: "👁️" },
    { key: "robotics", icon: "🦾" },
    { key: "ethics", icon: "⚖️" },
    { key: "healthcare", icon: "🏥" },
    { key: "research", icon: "🔬" },
  ];

  grid.innerHTML = categories
    .map(
      (cat) => `
    <div class="category-card">
      <div class="category-icon">${cat.icon}</div>
      <div>
        <div class="category-name">${t("categories." + cat.key)}</div>
      </div>
    </div>
  `
    )
    .join("");
}

export function findArticle(id) {
  return findArticlePure(id, state.newsData);
}

export function renderDetailPage(id) {
  const article = findArticle(id);
  if (!article) {
    showHomePage();
    return;
  }

  recordRead(article);

  const data = article[state.currentLang];
  const homeSections = document.getElementById("home-sections");
  const detailPage = document.getElementById("detail-page");

  if (homeSections) homeSections.style.display = "none";
  if (detailPage) {
    detailPage.style.display = "block";

    const contentHtml = data.content
      .split("\n")
      .filter((p) => p.trim())
      .map((p) => {
        const line = p.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        if (p.trim().startsWith("- ")) {
          return `<li>${line.trim().substring(2)}</li>`;
        }
        if (/^\d+\./.test(p.trim())) {
          return `<li>${line.trim().replace(/^\d+\.\s*/, "")}</li>`;
        }
        return `<p>${line}</p>`;
      })
      .join("")
      .replace(/<\/li><li>/g, "</li><li>")
      .replace(/<li>/g, (match, offset, str) => {
        const prevChar = str.substring(Math.max(0, offset - 5), offset);
        if (!prevChar.includes("</li>") && !prevChar.includes("<ul>")) {
          return "<ul><li>";
        }
        return match;
      })
      .replace(/<\/li>(?![\s\S]*<li>)/g, "</li></ul>");

    const relatedArticles = state.newsData.articles
      .filter((a) => a.category === article.category && a.id !== article.id)
      .slice(0, 3);

    detailPage.innerHTML = `
      <div class="detail-container">
        <div class="detail-header">
          <button class="detail-back" onclick="showHomePage()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
            ${t("detail.backToHome")}
          </button>
          <span class="detail-category">${t("categories." + article.category)}</span>
        </div>

        <div class="detail-hero-image">
          <img src="${article.image}" alt="${data.title}" loading="eager">
        </div>

        <div class="detail-body">
          <h1 class="detail-title">${data.title}</h1>
          <div class="detail-meta">
            <span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${article.date || "2026-06-09"}
            </span>
            <span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${article.readTime} ${t("time.minRead")}
            </span>
            <span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${article.timeAgo} ${t("time.hoursAgo")}
            </span>
          </div>
          <div class="detail-content">
            ${contentHtml}
          </div>
        </div>

        ${
          relatedArticles.length > 0
            ? `
        <div class="detail-related">
          <h2 class="detail-related-title">${t("detail.relatedNews")}</h2>
          <div class="detail-related-grid">
            ${relatedArticles
              .map((ra) => {
                const rd = ra[state.currentLang];
                return `
                <div class="detail-related-card" onclick="navigateToArticle(${ra.id})">
                  <img src="${ra.image}" alt="${rd.title}" class="detail-related-image" loading="lazy">
                  <div class="detail-related-content">
                    <span class="card-category">${t("categories." + ra.category)}</span>
                    <h3>${rd.title}</h3>
                    <p>${rd.excerpt}</p>
                  </div>
                </div>
              `;
              })
              .join("")}
          </div>
        </div>
        `
            : ""
        }
      </div>
    `;

    window.scrollTo({ top: 0, behavior: "instant" });
  }
}

export function showHomePage() {
  const homeSections = document.getElementById("home-sections");
  const detailPage = document.getElementById("detail-page");
  const historyPage = document.getElementById("history-page");
  const editionBanner = document.querySelector(".edition-banner");

  if (homeSections) homeSections.style.display = "block";
  if (detailPage) detailPage.style.display = "none";
  if (historyPage) historyPage.style.display = "none";
  if (editionBanner) editionBanner.remove();

  state.resetToLatest();
  if (state.newsData) {
    renderHero(state.newsData.featured);
    renderNewsGrid(state.newsData.articles);
    renderCategories();
  }

  history.pushState("", document.title, window.location.pathname + window.location.search);
}

window.showHomePage = showHomePage;
