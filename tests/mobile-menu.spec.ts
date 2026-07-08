import { test, expect } from "@playwright/test";

test.describe("Mobile Menu", () => {
  test.use({ viewport: { width: 375, height: 812 } }); // iPhone X size

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".hero-card", { timeout: 10000 });
  });

  test("should display mobile menu button on small screens", async ({
    page,
  }) => {
    const menuBtn = page.locator("#mobile-menu");
    await expect(menuBtn).toBeVisible();
    await expect(menuBtn).toHaveAttribute("aria-label", "Menu");
  });

  test("should toggle mobile menu when clicking button", async ({ page }) => {
    const menuBtn = page.locator("#mobile-menu");
    const navLinks = page.locator(".nav-links");

    // Menu should be closed initially
    await expect(menuBtn).not.toHaveClass(/active/);

    // Click to open
    await menuBtn.click();
    await expect(menuBtn).toHaveClass(/active/);
    await expect(navLinks).toHaveClass(/mobile-open/);

    // Click to close
    await menuBtn.click();
    await expect(menuBtn).not.toHaveClass(/active/);
    await expect(navLinks).not.toHaveClass(/mobile-open/);
  });

  test("should close mobile menu when clicking a nav link", async ({
    page,
  }) => {
    const menuBtn = page.locator("#mobile-menu");
    const navLinks = page.locator(".nav-links");

    // Open menu
    await menuBtn.click();
    await expect(navLinks).toHaveClass(/mobile-open/);

    // Click a link
    await navLinks.locator("a").first().click();
    await page.waitForTimeout(300);

    // Menu should close
    await expect(navLinks).not.toHaveClass(/mobile-open/);
    await expect(menuBtn).not.toHaveClass(/active/);
  });

  test("should have hamburger icon with 3 spans", async ({ page }) => {
    const menuBtn = page.locator("#mobile-menu");
    const spans = menuBtn.locator("span");
    await expect(spans).toHaveCount(3);
  });

  test("should display nav links vertically when menu is open", async ({
    page,
  }) => {
    const menuBtn = page.locator("#mobile-menu");
    await menuBtn.click();

    const navLinks = page.locator(".nav-links");
    await expect(navLinks).toHaveClass(/mobile-open/);

    // All links should be visible
    const links = navLinks.locator("a");
    const count = await links.count();
    expect(count).toBe(4);

    for (let i = 0; i < count; i++) {
      await expect(links.nth(i)).toBeVisible();
    }
  });
});
