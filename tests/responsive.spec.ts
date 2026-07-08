import { test, expect } from "@playwright/test";

test.describe("Responsive Design", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".hero-card", { timeout: 10000 });
  });

  test("should display correctly on desktop (1920x1080)", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(300);

    // Desktop should show nav links inline
    const navLinks = page.locator(".nav-links");
    await expect(navLinks).toBeVisible();

    // Mobile menu should be hidden
    const mobileMenu = page.locator("#mobile-menu");
    await expect(mobileMenu).not.toBeVisible();

    // News grid should have multiple columns
    const grid = page.locator(".news-grid");
    const gridStyles = await grid.evaluate((el) => ({
      display: getComputedStyle(el).display,
      gridTemplateColumns: getComputedStyle(el).gridTemplateColumns,
    }));
    expect(gridStyles.display).toBe("grid");
  });

  test("should display correctly on tablet (768x1024)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);

    // Should still show nav links on tablet
    const navLinks = page.locator(".nav-links");
    await expect(navLinks).toBeVisible();

    // News grid should adjust columns
    const grid = page.locator(".news-grid");
    const gridColumns = await grid.evaluate(
      (el) => getComputedStyle(el).gridTemplateColumns
    );
    expect(gridColumns).toBeTruthy();
  });

  test("should display correctly on mobile (375x812)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);

    // Should show mobile menu button
    const mobileMenu = page.locator("#mobile-menu");
    await expect(mobileMenu).toBeVisible();

    // Content should not overflow
    const body = page.locator("body");
    const bodyWidth = await body.evaluate((el) => el.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376); // Small tolerance
  });

  test("should have readable text on all viewport sizes", async ({
    page,
  }) => {
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 768, height: 1024 },
      { width: 375, height: 812 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(200);

      // Check hero title is visible and has reasonable font size
      const heroTitle = page.locator(".hero-title");
      if (await heroTitle.isVisible()) {
        const fontSize = await heroTitle.evaluate((el) =>
          parseFloat(getComputedStyle(el).fontSize)
        );
        expect(fontSize).toBeGreaterThanOrEqual(16);
      }
    }
  });

  test("should have proper touch targets on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);

    // Theme toggle should be large enough for touch
    const themeBtn = page.locator("#theme-toggle");
    const themeBox = await themeBtn.boundingBox();
    expect(themeBox!.width).toBeGreaterThanOrEqual(32);
    expect(themeBox!.height).toBeGreaterThanOrEqual(32);

    // Language toggle should be large enough
    const langBtn = page.locator("#lang-toggle");
    const langBox = await langBtn.boundingBox();
    expect(langBox!.width).toBeGreaterThanOrEqual(32);
    expect(langBox!.height).toBeGreaterThanOrEqual(32);
  });

  test("should not have horizontal scroll on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);

    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalScroll).toBe(false);
  });
});
