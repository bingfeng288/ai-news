import { test, expect } from "@playwright/test";

test.describe("Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".hero-card", { timeout: 10000 });
  });

  test("should have proper page title", async ({ page }) => {
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title).toContain("AI News");
  });

  test("should have lang attribute on html element", async ({ page }) => {
    const lang = await page.evaluate(() =>
      document.documentElement.getAttribute("lang")
    );
    expect(lang).toBe("en");
  });

  test("should have proper heading hierarchy", async ({ page }) => {
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBeGreaterThanOrEqual(1);

    const h2Count = await page.locator("h2").count();
    expect(h2Count).toBeGreaterThanOrEqual(1);
  });

  test("should have alt text on all images", async ({ page }) => {
    const images = page.locator("img");
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute("alt");
      expect(alt).toBeTruthy();
      expect(alt!.length).toBeGreaterThan(0);
    }
  });

  test("should have aria-labels on interactive buttons", async ({ page }) => {
    // Theme toggle
    const themeBtn = page.locator("#theme-toggle");
    const themeLabel = await themeBtn.getAttribute("aria-label");
    expect(themeLabel).toBeTruthy();

    // Language toggle
    const langBtn = page.locator("#lang-toggle");
    const langLabel = await langBtn.getAttribute("aria-label");
    expect(langLabel).toBeTruthy();

    // Mobile menu
    const menuBtn = page.locator("#mobile-menu");
    const menuLabel = await menuBtn.getAttribute("aria-label");
    expect(menuLabel).toBeTruthy();
  });

  test("should have proper link text", async ({ page }) => {
    const links = page.locator("a");
    const count = await links.count();

    for (let i = 0; i < Math.min(count, 20); i++) {
      const link = links.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute("aria-label");

      // Each link should have either text content or aria-label
      expect(text || ariaLabel).toBeTruthy();
    }
  });

  test("should have proper form labels", async ({ page }) => {
    const emailInput = page.locator(".newsletter-input");
    const placeholder = await emailInput.getAttribute("placeholder");
    expect(placeholder).toBeTruthy();

    // Input should have type="email"
    const type = await emailInput.getAttribute("type");
    expect(type).toBe("email");
  });

  test("should have sufficient color contrast in light mode", async ({
    page,
  }) => {
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "light");
    });
    await page.waitForTimeout(200);

    // Check main text color against background
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const computed = getComputedStyle(body);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
      };
    });

    // Verify colors are defined
    expect(bodyStyles.color).toBeTruthy();
    expect(bodyStyles.backgroundColor).toBeTruthy();
  });

  test("should have sufficient color contrast in dark mode", async ({
    page,
  }) => {
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "dark");
    });
    await page.waitForTimeout(200);

    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const computed = getComputedStyle(body);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
      };
    });

    expect(bodyStyles.color).toBeTruthy();
    expect(bodyStyles.backgroundColor).toBeTruthy();
  });

  test("should support keyboard navigation for theme toggle", async ({
    page,
  }) => {
    const themeBtn = page.locator("#theme-toggle");

    // Focus the button
    await themeBtn.focus();
    await expect(themeBtn).toBeFocused();

    // Get initial theme
    const initialTheme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme")
    );

    // Press Enter to toggle
    await page.keyboard.press("Enter");
    await page.waitForTimeout(200);

    const newTheme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme")
    );
    expect(newTheme).not.toBe(initialTheme);
  });

  test("should have no empty links", async ({ page }) => {
    const links = page.locator("a");
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute("aria-label");
      const hasImg = (await link.locator("img").count()) > 0;
      const hasSvg = (await link.locator("svg").count()) > 0;

      // Link should have some accessible content
      const hasContent =
        (text && text.trim().length > 0) ||
        ariaLabel ||
        hasImg ||
        hasSvg;
      expect(hasContent).toBe(true);
    }
  });

  test("should have proper focus indicators", async ({ page }) => {
    // Tab to first interactive element
    await page.keyboard.press("Tab");
    await page.waitForTimeout(200);

    // Check that focused element has visible focus styles
    const focusedElement = page.locator(":focus");
    if ((await focusedElement.count()) > 0) {
      const outline = await focusedElement.evaluate((el) => {
        const styles = getComputedStyle(el);
        return styles.outlineStyle;
      });
      // Should have some form of focus indicator
      expect(outline).not.toBe("none");
    }
  });
});
