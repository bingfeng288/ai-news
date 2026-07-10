import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the dynamic content to load
    await page.waitForSelector(".hero-card", { timeout: 10000 });
  });

  test("should load the homepage successfully", async ({ page }) => {
    await expect(page).toHaveTitle(/AI News/);
  });

  test("should display the navigation bar", async ({ page }) => {
    const navbar = page.locator(".navbar");
    await expect(navbar).toBeVisible();

    const logo = page.locator(".nav-logo");
    await expect(logo).toBeVisible();
    await expect(logo).toContainText("AI News");

    const navLinks = page.locator(".nav-links a");
    await expect(navLinks).toHaveCount(5);
  });

  test("should display the hero section with featured article", async ({
    page,
  }) => {
    const heroCard = page.locator(".hero-card");
    await expect(heroCard).toBeVisible();

    const heroTitle = page.locator(".hero-title");
    await expect(heroTitle).not.toBeEmpty();

    const heroExcerpt = page.locator(".hero-excerpt");
    await expect(heroExcerpt).not.toBeEmpty();

    const heroImage = page.locator(".hero-image");
    await expect(heroImage).toBeVisible();
  });

  test("should display the latest news section with articles", async ({
    page,
  }) => {
    const sectionTitle = page.locator("#latest .section-title");
    await expect(sectionTitle).toContainText("Latest AI News");

    const newsCards = page.locator(".news-card");
    const count = await newsCards.count();
    expect(count).toBeGreaterThan(0);

    // Verify each card has required elements
    for (let i = 0; i < Math.min(count, 3); i++) {
      const card = newsCards.nth(i);
      await expect(card.locator(".card-title")).not.toBeEmpty();
      await expect(card.locator(".card-excerpt")).not.toBeEmpty();
      await expect(card.locator(".card-image")).toBeVisible();
      await expect(card.locator(".card-category")).not.toBeEmpty();
    }
  });

  test("should display the categories section", async ({ page }) => {
    const sectionTitle = page.locator("#categories .section-title");
    await expect(sectionTitle).toContainText("Browse by Category");

    const categoryCards = page.locator(".category-card");
    const count = await categoryCards.count();
    expect(count).toBe(6);
  });

  test("should display the newsletter section", async ({ page }) => {
    const newsletter = page.locator(".newsletter");
    await expect(newsletter).toBeVisible();

    const emailInput = page.locator(".newsletter-input");
    await expect(emailInput).toBeVisible();

    const subscribeBtn = page.locator(".newsletter-btn");
    await expect(subscribeBtn).toContainText("Subscribe");
  });

  test("should display the footer", async ({ page }) => {
    const footer = page.locator(".footer");
    await expect(footer).toBeVisible();

    await expect(page.locator(".footer-brand")).toBeVisible();
    await expect(page.locator(".footer-about")).not.toBeEmpty();

    const footerSections = page.locator(".footer-section");
    await expect(footerSections).toHaveCount(3);
  });

  test("should have working scroll behavior on navbar", async ({ page }) => {
    const navbar = page.locator(".navbar");

    // Initially no shadow
    await expect(navbar).toHaveCSS("box-shadow", "none");

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 100));
    await page.waitForTimeout(300);

    // After scroll, shadow should appear
    const boxShadow = await navbar.evaluate(
      (el) => getComputedStyle(el).boxShadow
    );
    expect(boxShadow).not.toBe("none");
  });
});
