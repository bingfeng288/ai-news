// ===== State Management =====
let currentLang = localStorage.getItem("lang") || "en";
let newsData = null;
let latestData = null; // always the most recent edition
let viewingEdition = null; // date string of edition being viewed, or null

// ===== Theme Management =====
function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
  } else {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    document.documentElement.setAttribute(
      "data-theme",
      prefersDark ? "dark" : "light"
    );
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  updateThemeIcon();
}

function updateThemeIcon() {
  const themeBtn = document.getElementById("theme-toggle");
  if (!themeBtn) return;
  const isDark =
    document.documentElement.getAttribute("data-theme") === "dark";
  themeBtn.innerHTML = isDark
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
}

// ===== Language Management =====
function toggleLanguage() {
  currentLang = currentLang === "en" ? "zh" : "en";
  localStorage.setItem("lang", currentLang);
  updateContent();
  updateLangButton();
}

function updateLangButton() {
  const langBtn = document.getElementById("lang-toggle");
  if (langBtn) {
    langBtn.textContent = currentLang === "en" ? "中文" : "EN";
  }
}

function t(key) {
  const keys = key.split(".");
  let value = translations[currentLang];
  for (const k of keys) {
    value = value?.[k];
  }
  return value || key;
}

// ===== Reading History (localStorage) =====
const HISTORY_KEY = "ai-news-history";
const HISTORY_MAX = 20;

function getReadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function recordRead(article) {
  if (!article) return;
  const lang = currentLang;
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
  } catch (e) {}
}

function clearReadHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (e) {}
}

// ===== Content Rendering =====
function updateContent() {
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

  if (newsData) {
    renderHero(newsData.featured);
    renderNewsGrid(newsData.articles);
    renderCategories();
  }

  // Re-render detail page if visible
  const hash = window.location.hash;
  if (hash.startsWith("#/article/")) {
    const id = parseInt(hash.split("/")[2]);
    if (!isNaN(id)) {
      renderDetailPage(id);
    }
  }

  // Re-render history page if visible
  const historyPage = document.getElementById("history-page");
  if (historyPage && historyPage.style.display !== "none") {
    renderHistoryPage();
  }
}

function renderHero(article) {
  const hero = document.getElementById("hero-content");
  if (!hero) return;

  const data = article[currentLang];
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

function renderNewsGrid(articles) {
  const grid = document.getElementById("news-grid");
  if (!grid) return;

  // Only show today's articles (matching the featured date)
  const today = newsData && newsData.featured && newsData.featured.date;
  const todaysArticles = today
    ? articles.filter((a) => a.date === today)
    : articles;

  grid.innerHTML = todaysArticles
    .map((article) => {
      const data = article[currentLang];
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

function renderCategories() {
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

// ===== Article Detail Page =====
function findArticle(id) {
  if (!newsData) return null;
  if (newsData.featured.id === id) return newsData.featured;
  return newsData.articles.find((a) => a.id === id) || null;
}

function navigateToArticle(id) {
  window.location.hash = `#/article/${id}`;
}

function renderDetailPage(id) {
  const article = findArticle(id);
  if (!article) {
    showHomePage();
    return;
  }

  recordRead(article);

  const data = article[currentLang];
  const homeSections = document.getElementById("home-sections");
  const detailPage = document.getElementById("detail-page");

  if (homeSections) homeSections.style.display = "none";
  if (detailPage) {
    detailPage.style.display = "block";

    // Format content paragraphs
    const contentHtml = data.content
      .split("\n")
      .filter((p) => p.trim())
      .map((p) => {
        // Convert markdown bold **text** to <strong>text</strong>
        let line = p.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        // Handle bullet points
        if (p.trim().startsWith("- ")) {
          return `<li>${line.trim().substring(2)}</li>`;
        }
        // Handle numbered lists
        if (/^\d+\./.test(p.trim())) {
          return `<li>${line.trim().replace(/^\d+\.\s*/, "")}</li>`;
        }
        return `<p>${line}</p>`;
      })
      .join("")
      .replace(/<\/li><li>/g, "</li><li>")
      .replace(/<li>/g, (match, offset, str) => {
        // Wrap consecutive <li> in <ul> if not already
        const prevChar = str.substring(Math.max(0, offset - 5), offset);
        if (!prevChar.includes("</li>") && !prevChar.includes("<ul>")) {
          return "<ul><li>";
        }
        return match;
      })
      .replace(/<\/li>(?![\s\S]*<li>)/g, "</li></ul>");

    // Get related articles (same category, different id)
    const relatedArticles = newsData.articles
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
                const rd = ra[currentLang];
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

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function showHomePage() {
  const homeSections = document.getElementById("home-sections");
  const detailPage = document.getElementById("detail-page");
  const historyPage = document.getElementById("history-page");
  const editionBanner = document.querySelector(".edition-banner");

  if (homeSections) homeSections.style.display = "block";
  if (detailPage) detailPage.style.display = "none";
  if (historyPage) historyPage.style.display = "none";
  if (editionBanner) editionBanner.remove();

  // Reset to latest edition
  if (latestData) {
    newsData = latestData;
    viewingEdition = null;
    renderHero(newsData.featured);
    renderNewsGrid(newsData.articles);
    renderCategories();
  }

  // Clear the hash without triggering a new hashchange
  history.pushState("", document.title, window.location.pathname + window.location.search);
}

// ===== Routing =====
function handleRoute() {
  const hash = window.location.hash;

  if (hash.startsWith("#/article/")) {
    const id = parseInt(hash.split("/")[2]);
    if (!isNaN(id) && newsData) {
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

// ===== Edition Viewing =====
async function loadEdition(date) {
  try {
    const response = await fetch("data/archive/" + date + ".json");
    if (!response.ok) throw new Error("Failed to load edition " + date);
    newsData = await response.json();
    viewingEdition = date;

    const homeSections = document.getElementById("home-sections");
    const detailPage = document.getElementById("detail-page");
    const historyPage = document.getElementById("history-page");
    if (homeSections) homeSections.style.display = "block";
    if (detailPage) detailPage.style.display = "none";
    if (historyPage) historyPage.style.display = "none";

    renderHero(newsData.featured);
    renderNewsGrid(newsData.articles);
    renderCategories();

    // Add banner
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

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    console.error("Failed to load edition:", error);
  }
}

function backToLatest() {
  if (!latestData) return;
  newsData = latestData;
  viewingEdition = null;

  // Remove banner
  const banner = document.querySelector(".edition-banner");
  if (banner) banner.remove();

  renderHero(newsData.featured);
  renderNewsGrid(newsData.articles);
  renderCategories();
}

// ===== History Page =====
async function renderHistoryPage() {
  const historyPage = document.getElementById("history-page");
  if (!historyPage) return;

  const homeSections = document.getElementById("home-sections");
  const detailPage = document.getElementById("detail-page");
  if (homeSections) homeSections.style.display = "none";
  if (detailPage) detailPage.style.display = "none";
  historyPage.style.display = "block";

  // Load archive index
  let editions = [];
  try {
    const response = await fetch("data/archive/index.json");
    if (response.ok) editions = await response.json();
  } catch (e) {}

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

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ===== Data Loading =====
async function loadNews() {
  try {
    const response = await fetch("data/news.json");
    newsData = await response.json();
    latestData = newsData;
    renderHero(newsData.featured);
    renderNewsGrid(newsData.articles);
    renderCategories();
    updateContent();

    // Handle initial route after data loads
    handleRoute();
  } catch (error) {
    console.error("Failed to load news:", error);
  }
}

// ===== System Theme Listener =====
function watchSystemTheme() {
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      if (!localStorage.getItem("theme")) {
        document.documentElement.setAttribute(
          "data-theme",
          e.matches ? "dark" : "light"
        );
        updateThemeIcon();
      }
    });
}

// ===== Mobile Menu =====
function initMobileMenu() {
  const menuBtn = document.getElementById("mobile-menu");
  const navLinks = document.querySelector(".nav-links");
  if (!menuBtn || !navLinks) return;

  menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("mobile-open");
    menuBtn.classList.toggle("active");
  });

  // Close menu when clicking a link
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("mobile-open");
      menuBtn.classList.remove("active");
    });
  });
}

// ===== Initialize =====
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  updateThemeIcon();
  updateLangButton();
  loadNews();
  watchSystemTheme();
  initMobileMenu();

  // Theme toggle
  document
    .getElementById("theme-toggle")
    ?.addEventListener("click", toggleTheme);

  // Language toggle
  document
    .getElementById("lang-toggle")
    ?.addEventListener("click", toggleLanguage);

  // Navbar scroll effect
  window.addEventListener("scroll", () => {
    const navbar = document.querySelector(".navbar");
    if (navbar) {
      if (window.scrollY > 20) {
        navbar.style.boxShadow = "0 4px 20px var(--shadow)";
      } else {
        navbar.style.boxShadow = "none";
      }
    }
  });

  // Hash-based routing
  window.addEventListener("hashchange", handleRoute);
});
