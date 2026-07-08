import { test, expect } from "@playwright/test";

test.describe("Theme Switching", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".hero-card", { timeout: 10000 });
  });

  test("should have a theme toggle button", async ({ page }) => {
    const themeToggle = page.locator("#theme-toggle");
    await expect(themeToggle).toBeVisible();
    await expect(themeToggle).toHaveAttribute("aria-label", "Toggle theme");
  });

  test("should initialize with a theme", async ({ page }) => {
    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme")
    );
    expect(["light", "dark"]).toContain(theme);
  });

  test("should switch from light to dark theme", async ({ page }) => {
    // Set light theme first
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    });
    await page.waitForTimeout(200);

    // Click toggle
    await page.locator("#theme-toggle").click();
    await page.waitForTimeout(200);

    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme")
    );
    expect(theme).toBe("dark");

    // Verify localStorage
    const savedTheme = await page.evaluate(() => localStorage.getItem("theme"));
    expect(savedTheme).toBe("dark");
  });

  test("should switch from dark to light theme", async ({ page }) => {
    // Set dark theme first
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    });
    await page.waitForTimeout(200);

    // Click toggle
    await page.locator("#theme-toggle").click();
    await page.waitForTimeout(200);

    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme")
    );
    expect(theme).toBe("light");

    const savedTheme = await page.evaluate(() => localStorage.getItem("theme"));
    expect(savedTheme).toBe("light");
  });

  test("should update theme icon when toggling", async ({ page }) => {
    // Set light theme
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "light");
    });
    await page.waitForTimeout(200);

    // Light theme should show moon icon (dark mode toggle)
    let icon = await page.locator("#theme-toggle svg").innerHTML();
    expect(icon).toContain("M21 12.79"); // moon path

    // Switch to dark
    await page.locator("#theme-toggle").click();
    await page.waitForTimeout(200);

    // Dark theme should show sun icon
    icon = await page.locator("#theme-toggle svg").innerHTML();
    expect(icon).toContain("circle cx"); // sun circle
  });

  test("should persist theme across page reloads", async ({ page }) => {
    // Set dark theme
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    });

    // Reload page
    await page.reload();
    await page.waitForSelector(".hero-card", { timeout: 10000 });

    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme")
    );
    expect(theme).toBe("dark");
  });

  test("should apply correct CSS variables for dark theme", async ({
    page,
  }) => {
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "dark");
    });
    await page.waitForTimeout(200);

    const bgColor = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    );

    // Dark theme background should be dark
    expect(bgColor).not.toBe("rgb(255, 255, 255)");
  });

  test("should apply correct CSS variables for light theme", async ({
    page,
  }) => {
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "light");
    });
    await page.waitForTimeout(200);

    const bgColor = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    );

    // Light theme background should be light
    expect(bgColor).toBe("rgb(255, 255, 255)");
  });
});
