// ===== State Management =====
let currentLang = localStorage.getItem("lang") || "en";
let newsData = null;

// ===== Theme Management =====
function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
  } else {
    // Follow system preference
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
  // Update nav
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const text = t(key);
    if (text) el.textContent = text;
  });

  // Update placeholder
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    const text = t(key);
    if (text) el.placeholder = text;
  });

  // Re-render news if data is loaded
  if (newsData) {
    renderHero(newsData.featured);
    renderNewsGrid(newsData.articles);
  }
}

function renderHero(article) {
  const hero = document.getElementById("hero-content");
  if (!hero) return;

  const data = article[currentLang];
  hero.innerHTML = `
    <div class="hero-card">
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
      <article class="news-card">
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

// ===== Data Loading =====
async function loadNews() {
  try {
    const response = await fetch("data/news.json");
    newsData = await response.json();
    renderHero(newsData.featured);
    renderNewsGrid(newsData.articles);
    renderCategories();
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

// ===== Initialize =====
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  updateThemeIcon();
  updateLangButton();
  loadNews();
  watchSystemTheme();

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
});
