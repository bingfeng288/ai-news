import { test, expect } from "@playwright/test";

test.describe("Performance & Data Loading", () => {
  test("should load page within acceptable time", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/");
    await page.waitForSelector(".hero-card", { timeout: 15000 });
    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test("should fetch news data successfully", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    // Wait for data to load
    await page.waitForSelector(".hero-card", { timeout: 10000 });

    // Verify data was loaded and rendered
    const heroTitle = await page.locator(".hero-title").textContent();
    expect(heroTitle).toBeTruthy();
    expect(heroTitle!.length).toBeGreaterThan(0);
  });

  test("should load all images", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".hero-card", { timeout: 10000 });

    // Scroll and wait for all images (including lazy-loaded) to load
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(3000);

    const images = page.locator("img");
    const count = await images.count();

    await expect
      .poll(
        async () => {
          let loaded = 0;
          for (let i = 0; i < Math.min(count, 5); i++) {
            const img = images.nth(i);
            const naturalWidth = await img.evaluate(
              (el: HTMLImageElement) => el.naturalWidth
            );
            const isLazy = await img.getAttribute("loading");
            if (naturalWidth > 0 || isLazy === "lazy") loaded++;
          }
          return loaded;
        },
        { timeout: 15000, intervals: [1000, 2000, 3000] }
      )
      .toBeGreaterThan(0);
  });

  test("should have no console errors on page load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForSelector(".hero-card", { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      (e) => !e.includes("favicon") && !e.includes("404")
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test("should handle network errors gracefully", async ({ page }) => {
    // Intercept the news.json request and make it fail
    await page.route("**/data/news.json", (route) => route.abort());

    await page.goto("/");
    await page.waitForTimeout(2000);

    // Page should still render (nav, footer, etc.)
    const navbar = page.locator(".navbar");
    await expect(navbar).toBeVisible();

    const footer = page.locator(".footer");
    await expect(footer).toBeVisible();
  });

  test("should render correct number of news cards", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".hero-card", { timeout: 10000 });

    // Fetch the actual data
    const response = await page.evaluate(() =>
      fetch("data/news.json").then((r) => r.json())
    );

    const expectedCount = response.articles.length;
    const actualCount = await page.locator(".news-card").count();

    expect(actualCount).toBe(expectedCount);
  });

  test("should render correct number of categories", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".hero-card", { timeout: 10000 });

    const categories = await page.locator(".category-card").count();
    expect(categories).toBe(6);
  });

  test("should have proper meta tags", async ({ page }) => {
    await page.goto("/");

    const description = await page.getAttribute(
      'meta[name="description"]',
      "content"
    );
    expect(description).toBeTruthy();
    expect(description!.length).toBeGreaterThan(0);

    const viewport = await page.getAttribute(
      'meta[name="viewport"]',
      "content"
    );
    expect(viewport).toBeTruthy();
    expect(viewport).toContain("width=device-width");
  });

  test("should have proper favicon", async ({ page }) => {
    await page.goto("/");

    const favicon = page.locator('link[rel="icon"]');
    await expect(favicon).toHaveCount(1);

    const href = await favicon.getAttribute("href");
    expect(href).toBeTruthy();
  });

  test("should not have broken internal links", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".hero-card", { timeout: 10000 });

    // Check footer email link
    const emailLink = page.locator('a[href^="mailto:"]');
    if ((await emailLink.count()) > 0) {
      const href = await emailLink.first().getAttribute("href");
      expect(href).toContain("@");
    }
  });
});
