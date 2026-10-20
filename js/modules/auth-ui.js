// ===== Auth UI =====
import { t } from "./i18n-integration.js";

let authMode = "login";

export function updateAuthUI() {
  const authBtn = document.getElementById("auth-btn");
  const userMenu = document.getElementById("user-menu");
  if (!authBtn || !userMenu) return;

  if (window.currentUser) {
    authBtn.style.display = "none";
    userMenu.style.display = "block";
    document.getElementById("user-email").textContent = window.currentUser.email;
    document.getElementById("user-avatar").textContent =
      window.currentUser.email[0].toUpperCase();
    const checkbox = document.getElementById("subscription-checkbox");
    if (checkbox && window.currentProfile) {
      checkbox.checked = window.currentProfile.is_subscribed;
    }
    const langSelect = document.getElementById("email-lang-select");
    if (langSelect && window.currentProfile) {
      langSelect.value = window.currentProfile.language || "en";
    }
  } else {
    authBtn.style.display = "block";
    userMenu.style.display = "none";
  }
  renderNewsletterSection();
}

export function renderNewsletterSection() {
  const container = document.getElementById("newsletter-container");
  if (!container) return;

  if (window.currentUser && window.currentProfile) {
    const subscribed = window.currentProfile.is_subscribed;
    container.innerHTML = `
      <h2 class="newsletter-title">${t("sections.newsletter")}</h2>
      <p class="newsletter-desc">${subscribed ? t("auth.subscribed") : t("auth.notSubscribed")}</p>
      <div class="newsletter-status">
        <button class="newsletter-btn" id="newsletter-toggle-btn">
          ${subscribed ? t("auth.unsubscribeBtn") : t("auth.subscribeBtn")}
        </button>
      </div>
    `;
    document
      .getElementById("newsletter-toggle-btn")
      ?.addEventListener("click", async () => {
        const btn = document.getElementById("newsletter-toggle-btn");
        btn.disabled = true;
        await window.toggleSubscription(!window.currentProfile.is_subscribed);
        btn.disabled = false;
        updateAuthUI();
      });
  } else {
    container.innerHTML = `
      <h2 class="newsletter-title">${t("sections.newsletter")}</h2>
      <p class="newsletter-desc">${t("sections.newsletterDesc")}</p>
      <form class="newsletter-form" id="newsletter-form">
        <input type="email" class="newsletter-input" placeholder="${t("sections.emailPlaceholder")}" />
        <button type="submit" class="newsletter-btn">${t("sections.subscribe")}</button>
      </form>
    `;
    document
      .getElementById("newsletter-form")
      ?.addEventListener("submit", (e) => {
        e.preventDefault();
        openAuthModal("register");
      });
  }
}

export function openAuthModal(mode) {
  authMode = mode;
  const modal = document.getElementById("auth-modal");
  const title = document.getElementById("auth-modal-title");
  const submitBtn = document.getElementById("auth-submit-btn");
  const switchText = document.getElementById("auth-switch-text");
  const switchLink = document.getElementById("auth-switch-link");
  const errorEl = document.getElementById("auth-error");
  const successEl = document.getElementById("auth-success");

  errorEl.style.display = "none";
  successEl.style.display = "none";
  document.getElementById("auth-email").value = "";
  document.getElementById("auth-password").value = "";

  if (mode === "login") {
    title.textContent = t("auth.loginTitle");
    submitBtn.textContent = t("auth.loginAction");
    switchText.textContent = t("auth.noAccount");
    switchLink.textContent = t("auth.register");
  } else {
    title.textContent = t("auth.registerTitle");
    submitBtn.textContent = t("auth.registerAction");
    switchText.textContent = t("auth.hasAccount");
    switchLink.textContent = t("auth.login");
  }

  modal.style.display = "flex";
}

export function closeAuthModal() {
  document.getElementById("auth-modal").style.display = "none";
}

export function initAuthUI() {
  document.getElementById("auth-btn")?.addEventListener("click", () => {
    openAuthModal("login");
  });

  document.getElementById("auth-modal-close")?.addEventListener("click", closeAuthModal);
  document.getElementById("auth-modal")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeAuthModal();
  });

  document.getElementById("auth-switch-link")?.addEventListener("click", () => {
    openAuthModal(authMode === "login" ? "register" : "login");
  });

  document.getElementById("auth-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value;
    const errorEl = document.getElementById("auth-error");
    const successEl = document.getElementById("auth-success");
    const submitBtn = document.getElementById("auth-submit-btn");

    errorEl.style.display = "none";
    successEl.style.display = "none";
    submitBtn.disabled = true;
    submitBtn.textContent =
      authMode === "login" ? t("auth.loggingIn") : t("auth.registering");

    if (authMode === "login") {
      const { error } = await window.signIn(email, password);
      if (error) {
        errorEl.textContent = t("auth.errorInvalid");
        errorEl.style.display = "block";
      } else {
        closeAuthModal();
      }
    } else {
      const { error } = await window.signUp(email, password);
      if (error) {
        errorEl.textContent = error.message.includes("already registered")
          ? t("auth.errorExists")
          : error.message;
        errorEl.style.display = "block";
      } else {
        successEl.textContent = t("auth.checkEmail");
        successEl.style.display = "block";
      }
    }

    submitBtn.disabled = false;
    submitBtn.textContent =
      authMode === "login" ? t("auth.loginAction") : t("auth.registerAction");
  });

  document.getElementById("user-menu-trigger")?.addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("user-dropdown")?.classList.toggle("active");
  });

  document.addEventListener("click", () => {
    document.getElementById("user-dropdown")?.classList.remove("active");
  });

  document.getElementById("subscription-checkbox")?.addEventListener("change", async (e) => {
    await window.toggleSubscription(e.target.checked);
    renderNewsletterSection();
  });

  document.getElementById("email-lang-select")?.addEventListener("change", async (e) => {
    await window.updateEmailLanguage(e.target.value);
  });

  document.getElementById("logout-btn")?.addEventListener("click", () => {
    window.signOut();
  });
}

window.updateAuthUI = updateAuthUI;
window.openAuthModal = openAuthModal;
