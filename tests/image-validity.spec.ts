import { test, expect } from "@playwright/test";

test.describe("Image Validity", () => {
  test("all homepage article images should load successfully", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector(".hero-card", { timeout: 10000 });

    // Scroll to bottom to trigger all lazy-loaded images
    await page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight)
    );
    await page.waitForTimeout(3000);

    const articleImages = page.locator(".hero-image, .card-image");
    const count = await articleImages.count();
    expect(count).toBe(10); // 1 hero + 9 cards

    // Retry loop to handle slower image loading on emulated/mobile browsers
    const brokenImages: string[] = [];
    await expect
      .poll(
        async () => {
          brokenImages.length = 0;
          for (let i = 0; i < count; i++) {
            const img = articleImages.nth(i);
            const naturalWidth = await img.evaluate(
              (el: HTMLImageElement) => el.naturalWidth
            );
            const alt = await img.getAttribute("alt");
            const src = await img.getAttribute("src");

            if (naturalWidth === 0) {
              brokenImages.push(
                `[${alt}] src=${src?.split("?")[0].split("/").pop()}`
              );
            }
          }
          return brokenImages;
        },
        { timeout: 15000, intervals: [1000, 2000, 3000] }
      )
      .toHaveLength(0);
  });

  test("no image requests should fail via network", async ({ page }) => {
    const failedRequests: { url: string; failure: string }[] = [];

    page.on("requestfailed", (request) => {
      const url = request.url();
      if (url.includes("unsplash.com")) {
        failedRequests.push({
          url: url.split("?")[0].split("/").pop() || url,
          failure: request.failure()?.errorText || "unknown",
        });
      }
    });

    await page.goto("/");
    await page.waitForSelector(".hero-card", { timeout: 10000 });
    await page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight)
    );
    await page.waitForTimeout(2000);

    expect(
      failedRequests,
      `Failed image network requests:\n${failedRequests.map((r) => `${r.url} => ${r.failure}`).join("\n")}`
    ).toHaveLength(0);
  });

  test("all article images should have meaningful alt text", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector(".hero-card", { timeout: 10000 });

    const articleImages = page.locator(".hero-image, .card-image");
    const count = await articleImages.count();

    for (let i = 0; i < count; i++) {
      const img = articleImages.nth(i);
      const alt = await img.getAttribute("alt");
      expect(alt, `Image at index ${i} is missing alt text`).toBeTruthy();
      expect(
        (alt?.length ?? 0) > 3,
        `Image at index ${i} has suspiciously short alt text: "${alt}"`
      ).toBeTruthy();
    }
  });

  test("hero image should load eagerly at correct dimensions", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector(".hero-card", { timeout: 10000 });

    const heroImg = page.locator(".hero-image");
    await expect(heroImg).toHaveCount(1);

    const loading = await heroImg.getAttribute("loading");
    expect(loading).toBe("eager");

    // Wait for the hero image to actually load
    await expect(heroImg).toHaveAttribute("loading", "eager");
    await heroImg.evaluate((el: HTMLImageElement) => {
      if (el.complete && el.naturalWidth > 0) return;
      return new Promise<void>((resolve) => {
        el.onload = () => resolve();
        el.onerror = () => resolve();
      });
    });

    const naturalWidth = await heroImg.evaluate(
      (el: HTMLImageElement) => el.naturalWidth
    );
    const naturalHeight = await heroImg.evaluate(
      (el: HTMLImageElement) => el.naturalHeight
    );

    expect(naturalWidth).toBeGreaterThan(0);
    expect(naturalHeight).toBeGreaterThan(0);
  });

  test("detail page images should load correctly", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".hero-card", { timeout: 10000 });

    // Click the first article card to go to detail page
    await page.locator(".news-card").first().click();
    await page.waitForURL("**/article/**");
    await page.waitForTimeout(2000);

    // Scroll to trigger lazy images in related articles
    await page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight)
    );
    await page.waitForTimeout(3000);

    const detailImgs = page.locator(
      ".detail-hero img, .detail-related-image"
    );
    const count = await detailImgs.count();

    const brokenImages: string[] = [];

    for (let i = 0; i < count; i++) {
      const img = detailImgs.nth(i);
      const naturalWidth = await img.evaluate(
        (el: HTMLImageElement) => el.naturalWidth
      );
      const alt = await img.getAttribute("alt");

      if (naturalWidth === 0) {
        brokenImages.push(`[${alt}]`);
      }
    }

    expect(
      brokenImages,
      `Broken images on detail page:\n${brokenImages.join("\n")}`
    ).toHaveLength(0);
  });

  test("all unique image URLs should return valid responses", async ({
    page,
  }) => {
    // Fetch all image URLs from the data source
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    const newsData = await page.evaluate(() =>
      fetch("/data/news.json").then((r) => r.json())
    );

    const imageUrls: string[] = [
      newsData.featured.image,
      ...newsData.articles.map((a: { image: string }) => a.image),
    ];
    const uniqueUrls = [...new Set(imageUrls)];

    // Verify each unique image URL responds with 200
    for (const url of uniqueUrls) {
      const imgResponse = await page.evaluate(async (imgUrl: string) => {
        try {
          const resp = await fetch(imgUrl, { method: "HEAD" });
          return { status: resp.status, ok: resp.ok };
        } catch {
          return { status: 0, ok: false };
        }
      }, url);

      const photoId = url.split("?")[0].split("/").pop();
      expect(
        imgResponse.ok,
        `Image ${photoId} returned status ${imgResponse.status}`
      ).toBe(true);
    }
  });
});
