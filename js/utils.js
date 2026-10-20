// ===== Pure Utility Functions =====
// Extracted from app.js modules for unit testing — no DOM or state dependencies

/**
 * Find an article by id in the news data structure.
 * @param {number} id - Article id to search for
 * @param {object|null} newsData - The news data object with featured and articles
 * @returns {object|null} The found article or null
 */
export function findArticle(id, newsData) {
  if (!newsData) return null;
  if (newsData.featured && newsData.featured.id === id) return newsData.featured;
  if (!newsData.articles) return null;
  return newsData.articles.find((a) => a.id === id) || null;
}

/**
 * Filter articles by date string.
 * @param {Array} articles - Array of article objects
 * @param {string|null} date - Date string to filter by (e.g. "2026-07-26")
 * @returns {Array} Filtered articles matching the date, or all articles if date is falsy
 */
export function filterArticlesByDate(articles, date) {
  if (!Array.isArray(articles)) return [];
  if (!date) return [...articles];
  return articles.filter((a) => a.date === date);
}

/**
 * Validate an edition date string (YYYY-MM-DD format).
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} Whether the date is a valid calendar date
 */
export function isValidEditionDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr + "T00:00:00");
  if (isNaN(date.getTime())) return false;
  const [year, month, day] = dateStr.split("-").map(Number);
  return (
    date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day
  );
}

/**
 * Build the archive URL for a given edition date.
 * @param {string} date - Edition date string
 * @returns {string} The archive JSON file path
 */
export function buildEditionUrl(date) {
  return "data/archive/" + date + ".json";
}
