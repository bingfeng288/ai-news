// ===== State Management =====
let currentLang = localStorage.getItem("lang") || "en";
let newsData = null;

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
  }

  // Re-render detail page if visible
  const hash = window.location.hash;
  if (hash.startsWith("#/article/")) {
    const id = parseInt(hash.split("/")[2]);
    if (!isNaN(id)) {
      renderDetailPage(id);
    }
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

  grid.innerHTML = articles
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
        // Handle bullet points
        if (p.trim().startsWith("- ")) {
          return `<li>${p.trim().substring(2)}</li>`;
        }
        // Handle numbered lists
        if (/^\d+\./.test(p.trim())) {
          return `<li>${p.trim().replace(/^\d+\.\s*/, "")}</li>`;
        }
        return `<p>${p}</p>`;
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

  if (homeSections) homeSections.style.display = "block";
  if (detailPage) detailPage.style.display = "none";

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

  showHomePage();
}

// ===== Data Loading =====
async function loadNews() {
  try {
    const response = await fetch("data/news.json");
    newsData = await response.json();
    renderHero(newsData.featured);
    renderNewsGrid(newsData.articles);
    renderCategories();

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
