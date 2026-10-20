import { describe, it, expect } from "vitest";
import {
  findArticle,
  filterArticlesByDate,
  isValidEditionDate,
  buildEditionUrl,
} from "../js/utils.js";

// ===== Test Data =====
const mockArticle1 = {
  id: 1,
  date: "2026-07-26",
  category: "llm",
  image: "img1.jpg",
  readTime: 5,
  timeAgo: "2h",
  en: { title: "Article 1", excerpt: "Excerpt 1", content: "Content 1" },
  zh: { title: "文章1", excerpt: "摘要1", content: "内容1" },
};

const mockArticle2 = {
  id: 2,
  date: "2026-07-26",
  category: "cv",
  image: "img2.jpg",
  readTime: 3,
  timeAgo: "4h",
  en: { title: "Article 2", excerpt: "Excerpt 2", content: "Content 2" },
  zh: { title: "文章2", excerpt: "摘要2", content: "内容2" },
};

const mockArticle3 = {
  id: 3,
  date: "2026-07-25",
  category: "llm",
  image: "img3.jpg",
  readTime: 4,
  timeAgo: "1d",
  en: { title: "Article 3", excerpt: "Excerpt 3", content: "Content 3" },
  zh: { title: "文章3", excerpt: "摘要3", content: "内容3" },
};

const mockFeatured = {
  id: 100,
  date: "2026-07-26",
  category: "research",
  image: "featured.jpg",
  readTime: 8,
  timeAgo: "1h",
  en: { title: "Featured", excerpt: "Featured excerpt", content: "Featured content" },
  zh: { title: "头条", excerpt: "头条摘要", content: "头条内容" },
};

const mockNewsData = {
  featured: mockFeatured,
  articles: [mockArticle1, mockArticle2, mockArticle3],
};

// ===== findArticle =====
describe("findArticle", () => {
  it("returns null when newsData is null", () => {
    expect(findArticle(1, null)).toBeNull();
  });

  it("returns the featured article when id matches", () => {
    const result = findArticle(100, mockNewsData);
    expect(result).toBe(mockFeatured);
  });

  it("returns an article from the articles array when id matches", () => {
    const result = findArticle(2, mockNewsData);
    expect(result).toBe(mockArticle2);
  });

  it("returns null when id does not match any article", () => {
    const result = findArticle(999, mockNewsData);
    expect(result).toBeNull();
  });

  it("returns null when newsData has no articles and id does not match featured", () => {
    const data = { featured: mockFeatured };
    const result = findArticle(5, data);
    expect(result).toBeNull();
  });

  it("returns null when newsData has no featured and no matching article", () => {
    const data = { articles: [mockArticle1] };
    const result = findArticle(999, data);
    expect(result).toBeNull();
  });

  it("finds the first article in the array", () => {
    const result = findArticle(1, mockNewsData);
    expect(result).toBe(mockArticle1);
  });

  it("returns null for empty articles array", () => {
    const data = { featured: mockFeatured, articles: [] };
    const result = findArticle(1, data);
    expect(result).toBeNull();
  });
});

// ===== filterArticlesByDate =====
describe("filterArticlesByDate", () => {
  it("returns empty array for non-array input", () => {
    expect(filterArticlesByDate(null, "2026-07-26")).toEqual([]);
    expect(filterArticlesByDate(undefined, "2026-07-26")).toEqual([]);
    expect(filterArticlesByDate("not-array", "2026-07-26")).toEqual([]);
  });

  it("returns all articles when date is null", () => {
    const result = filterArticlesByDate([mockArticle1, mockArticle3], null);
    expect(result).toEqual([mockArticle1, mockArticle3]);
  });

  it("returns all articles when date is empty string", () => {
    const result = filterArticlesByDate([mockArticle1, mockArticle3], "");
    expect(result).toEqual([mockArticle1, mockArticle3]);
  });

  it("filters articles matching the given date", () => {
    const result = filterArticlesByDate(
      [mockArticle1, mockArticle2, mockArticle3],
      "2026-07-26"
    );
    expect(result).toEqual([mockArticle1, mockArticle2]);
  });

  it("returns empty array when no articles match the date", () => {
    const result = filterArticlesByDate(
      [mockArticle1, mockArticle2],
      "2026-01-01"
    );
    expect(result).toEqual([]);
  });

  it("returns a new array (does not mutate original)", () => {
    const original = [mockArticle1, mockArticle3];
    const result = filterArticlesByDate(original, null);
    expect(result).not.toBe(original);
    expect(result).toEqual(original);
  });

  it("handles empty articles array", () => {
    const result = filterArticlesByDate([], "2026-07-26");
    expect(result).toEqual([]);
  });
});

// ===== isValidEditionDate =====
describe("isValidEditionDate", () => {
  it("returns true for a valid date string", () => {
    expect(isValidEditionDate("2026-07-26")).toBe(true);
    expect(isValidEditionDate("2024-01-01")).toBe(true);
    expect(isValidEditionDate("2000-12-31")).toBe(true);
  });

  it("returns false for null or undefined", () => {
    expect(isValidEditionDate(null)).toBe(false);
    expect(isValidEditionDate(undefined)).toBe(false);
  });

  it("returns false for non-string input", () => {
    expect(isValidEditionDate(20260726)).toBe(false);
    expect(isValidEditionDate({})).toBe(false);
  });

  it("returns false for wrong format", () => {
    expect(isValidEditionDate("2026/07/26")).toBe(false);
    expect(isValidEditionDate("26-07-2026")).toBe(false);
    expect(isValidEditionDate("2026-7-26")).toBe(false);
    expect(isValidEditionDate("not-a-date")).toBe(false);
    expect(isValidEditionDate("")).toBe(false);
  });

  it("returns false for invalid calendar dates", () => {
    expect(isValidEditionDate("2026-02-30")).toBe(false);
    expect(isValidEditionDate("2026-13-01")).toBe(false);
    expect(isValidEditionDate("2026-00-15")).toBe(false);
  });

  it("handles leap year correctly", () => {
    expect(isValidEditionDate("2024-02-29")).toBe(true);
    expect(isValidEditionDate("2023-02-29")).toBe(false);
  });
});

// ===== buildEditionUrl =====
describe("buildEditionUrl", () => {
  it("builds correct archive URL for a date string", () => {
    expect(buildEditionUrl("2026-07-26")).toBe("data/archive/2026-07-26.json");
  });

  it("builds correct URL for different dates", () => {
    expect(buildEditionUrl("2024-01-01")).toBe("data/archive/2024-01-01.json");
  });

  it("returns string with data/archive prefix", () => {
    const url = buildEditionUrl("2026-06-15");
    expect(url.startsWith("data/archive/")).toBe(true);
    expect(url.endsWith(".json")).toBe(true);
  });
});
