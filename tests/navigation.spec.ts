import { test, expect } from "@playwright/test";

test.describe("Navigation & Routing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".hero-card", { timeout: 10000 });
  });

  test("should navigate to article detail page when clicking hero card", async ({
    page,
  }) => {
    const heroCard = page.locator(".hero-card");
    await heroCard.click();

    // Should navigate to article detail
    await expect(page).toHaveURL(/#\/article\//);

    // Home sections should be hidden
    const homeSections = page.locator("#home-sections");
    await expect(homeSections).toHaveCSS("display", "none");

    // Detail page should be visible
    const detailPage = page.locator("#detail-page");
    await expect(detailPage).toBeVisible();
  });

  test("should navigate to article detail page when clicking news card", async ({
    page,
  }) => {
    const firstCard = page.locator(".news-card").first();
    await firstCard.click();

    await expect(page).toHaveURL(/#\/article\//);

    const detailPage = page.locator("#detail-page");
    await expect(detailPage).toBeVisible();
  });

  test("should display article detail with correct structure", async ({
    page,
  }) => {
    await page.locator(".hero-card").click();
    await page.waitForSelector(".detail-container");

    // Verify detail page structure
    await expect(page.locator(".detail-back")).toBeVisible();
    await expect(page.locator(".detail-category")).toBeVisible();
    await expect(page.locator(".detail-hero-image img")).toBeVisible();
    await expect(page.locator(".detail-title")).not.toBeEmpty();
    await expect(page.locator(".detail-content")).toBeVisible();
    await expect(page.locator(".detail-meta")).toBeVisible();
  });

  test("should navigate back to home from detail page", async ({ page }) => {
    await page.locator(".hero-card").click();
    await page.waitForSelector(".detail-container");

    // Click back button
    await page.locator(".detail-back").click();

    // Should be back on home page
    await expect(page.locator("#home-sections")).toBeVisible();
    await expect(page.locator("#detail-page")).toHaveCSS("display", "none");
  });

  test("should display related articles on detail page", async ({ page }) => {
    await page.locator(".hero-card").click();
    await page.waitForSelector(".detail-container");

    // Check for related articles section
    const relatedSection = page.locator(".detail-related");
    // May or may not have related articles depending on category
    if (await relatedSection.isVisible()) {
      const relatedCards = page.locator(".detail-related-card");
      const count = await relatedCards.count();
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThanOrEqual(3);
    }
  });

  test("should navigate between articles via related articles", async ({
    page,
  }) => {
    await page.locator(".hero-card").click();
    await page.waitForSelector(".detail-container");

    const relatedSection = page.locator(".detail-related");
    if (await relatedSection.isVisible()) {
      const firstRelated = page.locator(".detail-related-card").first();
      await firstRelated.click();

      // Should navigate to a different article
      await expect(page).toHaveURL(/#\/article\//);
      await expect(page.locator(".detail-container")).toBeVisible();
    }
  });

  test("should handle direct article URL navigation", async ({ page }) => {
    await page.goto("/#/article/0");
    await page.waitForSelector(".detail-container", { timeout: 10000 });

    await expect(page.locator(".detail-title")).not.toBeEmpty();
    await expect(page.locator("#home-sections")).toHaveCSS("display", "none");
  });

  test("should handle invalid article ID gracefully", async ({ page }) => {
    await page.goto("/#/article/999");
    await page.waitForTimeout(1000);

    // Should redirect to home page
    await expect(page.locator("#home-sections")).toBeVisible();
    await expect(page.locator("#detail-page")).toHaveCSS("display", "none");
  });

  test("should scroll to top when navigating to article", async ({
    page,
  }) => {
    // Scroll to bottom first
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    await page.locator(".news-card").last().click();
    await page.waitForSelector(".detail-container");

    // Should scroll to top
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeLessThan(50);
  });
});
