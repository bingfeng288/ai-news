import { test, expect } from "@playwright/test";

test.describe("Internationalization (i18n)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".hero-card", { timeout: 10000 });
  });

  test("should have a language toggle button", async ({ page }) => {
    const langToggle = page.locator("#lang-toggle");
    await expect(langToggle).toBeVisible();
    await expect(langToggle).toHaveAttribute("aria-label", "Toggle language");
  });

  test("should default to English", async ({ page }) => {
    const langBtn = page.locator("#lang-toggle");
    await expect(langBtn).toContainText("中文");

    // Check English content
    const siteName = page.locator(".nav-logo span").first();
    await expect(siteName).toContainText("AI News");

    const latestTitle = page.locator("#latest .section-title");
    await expect(latestTitle).toContainText("Latest AI News");
  });

  test("should switch to Chinese when clicking language toggle", async ({
    page,
  }) => {
    await page.locator("#lang-toggle").click();
    await page.waitForTimeout(300);

    // Button should now show EN
    const langBtn = page.locator("#lang-toggle");
    await expect(langBtn).toContainText("EN");

    // Check Chinese content
    const siteName = page.locator(".nav-logo span").first();
    await expect(siteName).toContainText("AI 新闻");

    const latestTitle = page.locator("#latest .section-title");
    await expect(latestTitle).toContainText("最新 AI 新闻");
  });

  test("should switch navigation links to Chinese", async ({ page }) => {
    await page.locator("#lang-toggle").click();
    await page.waitForTimeout(300);

    const navLinks = page.locator(".nav-links a");
    await expect(navLinks.nth(0)).toContainText("首页");
    await expect(navLinks.nth(1)).toContainText("最新");
    await expect(navLinks.nth(2)).toContainText("分类");
    await expect(navLinks.nth(3)).toContainText("关于");
  });

  test("should switch categories to Chinese", async ({ page }) => {
    await page.locator("#lang-toggle").click();
    await page.waitForTimeout(300);

    const categoryCards = page.locator(".category-card .category-name");
    const count = await categoryCards.count();
    expect(count).toBe(6);

    // Verify Chinese category names
    await expect(categoryCards.nth(0)).toContainText("大语言模型");
    await expect(categoryCards.nth(1)).toContainText("计算机视觉");
  });

  test("should switch footer content to Chinese", async ({ page }) => {
    await page.locator("#lang-toggle").click();
    await page.waitForTimeout(300);

    const footerAbout = page.locator(".footer-about");
    await expect(footerAbout).toContainText("AI 新闻");

    const quickLinks = page.locator(".footer-section h3").first();
    await expect(quickLinks).toContainText("快速链接");
  });

  test("should switch article content to Chinese", async ({ page }) => {
    // Get English title first
    const heroTitle = await page.locator(".hero-title").textContent();

    // Switch to Chinese
    await page.locator("#lang-toggle").click();
    await page.waitForTimeout(500);

    // Title should be different in Chinese
    const heroTitleZh = await page.locator(".hero-title").textContent();
    expect(heroTitleZh).not.toBe(heroTitle);
  });

  test("should persist language across page reloads", async ({ page }) => {
    await page.locator("#lang-toggle").click();
    await page.waitForTimeout(300);

    // Reload
    await page.reload();
    await page.waitForSelector(".hero-card", { timeout: 10000 });

    // Should still be in Chinese
    const langBtn = page.locator("#lang-toggle");
    await expect(langBtn).toContainText("EN");

    const siteName = page.locator(".nav-logo span").first();
    await expect(siteName).toContainText("AI 新闻");
  });

  test("should toggle back to English from Chinese", async ({ page }) => {
    // Switch to Chinese
    await page.locator("#lang-toggle").click();
    await page.waitForTimeout(300);

    // Switch back to English
    await page.locator("#lang-toggle").click();
    await page.waitForTimeout(300);

    const langBtn = page.locator("#lang-toggle");
    await expect(langBtn).toContainText("中文");

    const siteName = page.locator(".nav-logo span").first();
    await expect(siteName).toContainText("AI News");
  });

  test("should switch detail page content when language changes", async ({
    page,
  }) => {
    // Navigate to article
    await page.locator(".hero-card").click();
    await page.waitForSelector(".detail-container");

    // Get English title
    const titleEn = await page.locator(".detail-title").textContent();

    // Switch to Chinese
    await page.locator("#lang-toggle").click();
    await page.waitForTimeout(500);

    const titleZh = await page.locator(".detail-title").textContent();
    expect(titleZh).not.toBe(titleEn);

    // Back button should be in Chinese
    await expect(page.locator(".detail-back")).toContainText("返回首页");
  });
});
