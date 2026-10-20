// ===== Main Application Entry Point =====
import { initTheme, toggleTheme, updateThemeIcon, watchSystemTheme } from "./modules/theme.js";
import { toggleLanguage, updateLangButton, updateContent } from "./modules/i18n-integration.js";
import { renderHero, renderNewsGrid, renderCategories, renderDetailPage } from "./modules/views.js";
import { loadNews } from "./modules/data.js";
import { handleRoute } from "./modules/router.js";
import { initAuthUI, renderNewsletterSection } from "./modules/auth-ui.js";
import * as state from "./modules/state.js";

// Wire up re-render callback for i18n
window.__rerenderCallback = () => {
  // The newsletter/subscription block is generated dynamically by
  // renderNewsletterSection(), so [data-i18n] does not cover it.
  // Re-render it here or it keeps the previous language until reload.
  renderNewsletterSection();

  if (state.newsData) {
    renderHero(state.newsData.featured);
    renderNewsGrid(state.newsData.articles);
    renderCategories();

    const hash = window.location.hash;
    if (hash.startsWith("#/article/")) {
      const id = parseInt(hash.split("/")[2]);
      if (!isNaN(id)) {
        renderDetailPage(id);
      }
    }

    const historyPage = document.getElementById("history-page");
    if (historyPage && historyPage.style.display !== "none") {
      window.renderHistoryPage();
    }
  }
};

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  updateThemeIcon();
  updateLangButton();
  updateContent();
  loadNews().then(() => {
    handleRoute();
  });
  watchSystemTheme();
  initMobileMenu();
  window.initAuth();
  initAuthUI();

  document.getElementById("theme-toggle")?.addEventListener("click", toggleTheme);
  document.getElementById("lang-toggle")?.addEventListener("click", toggleLanguage);

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

  window.addEventListener("hashchange", handleRoute);

  const historyLink = document.querySelector('.nav-links a[href="#/history"]');
  if (historyLink) {
    historyLink.addEventListener("click", function (e) {
      e.preventDefault();
      window.renderHistoryPage();
      window.location.hash = "#/history";
    });
  }
});

function initMobileMenu() {
  const menuBtn = document.getElementById("mobile-menu");
  const navLinks = document.querySelector(".nav-links");
  if (!menuBtn || !navLinks) return;

  menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("mobile-open");
    menuBtn.classList.toggle("active");
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("mobile-open");
      menuBtn.classList.remove("active");
    });
  });
}
