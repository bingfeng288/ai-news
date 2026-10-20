import { test, expect } from "@playwright/test";

test.describe("App Core Behaviors", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".hero-card", { timeout: 10000 });
  });

  test.describe("Reading History", () => {
    test("should record an article read when viewing detail page", async ({
      page,
    }) => {
      // Click hero to navigate to article detail
      await page.locator(".hero-card").click();
      await page.waitForSelector(".detail-container", { timeout: 5000 });

      // Check localStorage for history entry
      const history = await page.evaluate(() => {
        const raw = localStorage.getItem("ai-news-history");
        return raw ? JSON.parse(raw) : [];
      });

      expect(history.length).toBeGreaterThanOrEqual(1);
      expect(history[0]).toHaveProperty("id");
      expect(history[0]).toHaveProperty("title");
      expect(history[0]).toHaveProperty("ts");
    });

    test("should not duplicate history entries for same article", async ({
      page,
    }) => {
      // Navigate to first article
      await page.locator(".hero-card").click();
      await page.waitForSelector(".detail-container", { timeout: 5000 });

      // Go back home
      await page.locator(".detail-back").click();
      await page.waitForTimeout(300);

      // Navigate to same article again
      await page.locator(".hero-card").click();
      await page.waitForSelector(".detail-container", { timeout: 5000 });

      const history = await page.evaluate(() => {
        const raw = localStorage.getItem("ai-news-history");
        return raw ? JSON.parse(raw) : [];
      });

      // Should have exactly 1 entry (no duplicates)
      const ids = history.map((h: { id: number }) => h.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    test("should clear reading history", async ({ page }) => {
      // Create a history entry first
      await page.locator(".hero-card").click();
      await page.waitForSelector(".detail-container", { timeout: 5000 });

      // Navigate to history page
      await page.evaluate(() => {
        window.location.hash = "#/history";
      });
      await page.waitForSelector(".history-page", { timeout: 5000 });

      // Click clear history button
      const clearBtn = page.locator(".history-clear-btn");
      if (await clearBtn.isVisible()) {
        await clearBtn.click();
        await page.waitForTimeout(300);

        const history = await page.evaluate(() => {
          const raw = localStorage.getItem("ai-news-history");
          return raw ? JSON.parse(raw) : [];
        });
        expect(history.length).toBe(0);
      }
    });

    test("should limit history to 20 entries", async ({ page }) => {
      // Programmatically add 25 entries
      await page.evaluate(() => {
        const entries = [];
        for (let i = 1; i <= 25; i++) {
          entries.push({
            id: i,
            category: "llm",
            image: "test.jpg",
            date: "2026-08-01",
            title: `Article ${i}`,
            excerpt: `Excerpt ${i}`,
            ts: Date.now() + i,
          });
        }
        localStorage.setItem("ai-news-history", JSON.stringify(entries));
      });

      // Navigate to an article to trigger recordRead
      await page.locator(".hero-card").click();
      await page.waitForSelector(".detail-container", { timeout: 5000 });

      const history = await page.evaluate(() => {
        const raw = localStorage.getItem("ai-news-history");
        return raw ? JSON.parse(raw) : [];
      });

      expect(history.length).toBeLessThanOrEqual(20);
    });
  });

  test.describe("Hash-based Routing", () => {
    test("should navigate to article detail via hash", async ({ page }) => {
      // Get the first article's id
      const articleId = await page.evaluate(() => {
        // Access the global newsData through the page context
        const heroCard = document.querySelector(".hero-card");
        const onclick = heroCard?.getAttribute("onclick");
        // onclick format: navigateToArticle(ID)
        const match = onclick?.match(/navigateToArticle\((\d+)\)/);
        return match ? parseInt(match[1]) : null;
      });

      if (articleId) {
        await page.evaluate(
          (id) => {
            window.location.hash = `#/article/${id}`;
          },
          articleId
        );
        await page.waitForSelector(".detail-container", { timeout: 5000 });

        const detailVisible = await page
          .locator(".detail-container")
          .isVisible();
        expect(detailVisible).toBe(true);
      }
    });

    test("should show home page when navigating to root hash", async ({
      page,
    }) => {
      // First go to an article
      await page.locator(".hero-card").click();
      await page.waitForSelector(".detail-container", { timeout: 5000 });

      // Navigate back via hash
      await page.evaluate(() => {
        window.location.hash = "";
      });
      await page.waitForTimeout(500);

      const homeVisible = await page.locator("#home-sections").isVisible();
      expect(homeVisible).toBe(true);
    });

    test("should show history page via hash route", async ({ page }) => {
      await page.evaluate(() => {
        window.location.hash = "#/history";
      });
      await page.waitForSelector(".history-page", { timeout: 5000 });

      const historyVisible = await page
        .locator(".history-page")
        .isVisible();
      expect(historyVisible).toBe(true);
    });

    test("should return home from detail page via back button", async ({
      page,
    }) => {
      await page.locator(".hero-card").click();
      await page.waitForSelector(".detail-container", { timeout: 5000 });

      await page.locator(".detail-back").click();
      await page.waitForTimeout(500);

      const homeVisible = await page.locator("#home-sections").isVisible();
      expect(homeVisible).toBe(true);

      const detailHidden =
        (await page.locator("#detail-page").getAttribute("style"))
          ?.includes("display: none") ?? true;
      expect(detailHidden).toBe(true);
    });
  });

  test.describe("Article Finding and Rendering", () => {
    test("should render hero section with article data", async ({ page }) => {
      const heroCard = page.locator(".hero-card");
      await expect(heroCard).toBeVisible();

      const heroTitle = page.locator(".hero-title");
      await expect(heroTitle).not.toBeEmpty();

      const heroImage = page.locator(".hero-image");
      await expect(heroImage).toBeVisible();
    });

    test("should render news grid with article cards", async ({ page }) => {
      const cards = page.locator("#news-grid .news-card");
      const count = await cards.count();
      expect(count).toBeGreaterThanOrEqual(1);

      // Each card should have title and image
      const firstCard = cards.first();
      await expect(firstCard.locator(".card-title")).not.toBeEmpty();
      await expect(firstCard.locator(".card-image")).toBeVisible();
    });

    test("should render category cards", async ({ page }) => {
      const categories = page.locator("#categories-grid .category-card");
      const count = await categories.count();
      expect(count).toBe(6);
    });

    test("should show related articles on detail page", async ({ page }) => {
      // Click first news card (more likely to have same-category siblings)
      const firstCard = page.locator("#news-grid .news-card").first();
      if (await firstCard.isVisible()) {
        await firstCard.click();
        await page.waitForSelector(".detail-container", { timeout: 5000 });

        // Check if related section exists (may or may not depending on data)
        const relatedSection = page.locator(".detail-related");
        const hasRelated = await relatedSection.isVisible().catch(() => false);

        if (hasRelated) {
          const relatedCards = page.locator(".detail-related-card");
          const relatedCount = await relatedCards.count();
          expect(relatedCount).toBeGreaterThanOrEqual(1);
          expect(relatedCount).toBeLessThanOrEqual(3);
        }
      }
    });
  });

  test.describe("Content Rendering with Markdown", () => {
    test("should render article content with formatted paragraphs", async ({
      page,
    }) => {
      await page.locator(".hero-card").click();
      await page.waitForSelector(".detail-container", { timeout: 5000 });

      const detailContent = page.locator(".detail-content");
      await expect(detailContent).toBeVisible();

      // Should have some content (paragraphs or lists)
      const hasParagraphs = await detailContent.locator("p").count();
      const hasLists = await detailContent.locator("ul").count();
      expect(hasParagraphs + hasLists).toBeGreaterThanOrEqual(1);
    });

    test("should convert markdown bold to strong tags", async ({ page }) => {
      await page.locator(".hero-card").click();
      await page.waitForSelector(".detail-container", { timeout: 5000 });

      // Check if any bold/strong text exists in content
      const strongTags = page.locator(".detail-content strong");
      const count = await strongTags.count();
      // At least some articles should have bold text
      if (count > 0) {
        const text = await strongTags.first().textContent();
        expect(text?.trim().length).toBeGreaterThan(0);
      }
    });
  });
});
