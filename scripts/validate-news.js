#!/usr/bin/env node

/**
 * Validates data/news.json against data/news.schema.json
 *
 * Usage: node scripts/validate-news.js [path-to-news.json] [path-to-schema.json]
 *
 * Exit codes:
 *   0 — validation passed
 *   1 — validation failed or runtime error
 */

const fs = require("fs");
const path = require("path");

// ── Resolve paths ────────────────────────────────────────────────────────────
const root = path.resolve(__dirname, "..");
const newsPath = process.argv[2] || path.join(root, "data", "news.json");
const schemaPath =
  process.argv[3] || path.join(root, "data", "news.schema.json");

// ── Load files ───────────────────────────────────────────────────────────────
let newsData, schema;
try {
  newsData = JSON.parse(fs.readFileSync(newsPath, "utf8"));
} catch (err) {
  console.error(`✗ Failed to read news data: ${newsPath}`);
  console.error(err.message);
  process.exit(1);
}

try {
  schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
} catch (err) {
  console.error(`✗ Failed to read schema: ${schemaPath}`);
  console.error(err.message);
  process.exit(1);
}

// ── Validate ─────────────────────────────────────────────────────────────────
let Ajv;
try {
  // ajv is expected to be installed as a devDependency
  Ajv = require("ajv");
} catch {
  console.error(
    '✗ ajv is not installed. Run: npm install --save-dev ajv ajv-formats'
  );
  process.exit(1);
}

const addFormats = require("ajv-formats");

const ajv = new Ajv({ allErrors: true, verbose: true });
addFormats(ajv);

const validate = ajv.compile(schema);
const valid = validate(newsData);

// ── Report ───────────────────────────────────────────────────────────────────
if (valid) {
  const articleCount = Array.isArray(newsData.articles)
    ? newsData.articles.length
    : 0;
  console.log(
    `✓ news.json is valid (${articleCount} articles, schema: news.schema.json)`
  );
  process.exit(0);
} else {
  console.error("✗ news.json validation failed:\n");
  for (const err of validate.errors || []) {
    const loc = err.instancePath || "(root)";
    console.error(`  ${loc}  ${err.message}`);
    if (err.params) {
      const detail = Object.entries(err.params)
        .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
        .join(", ");
      if (detail) console.error(`    (${detail})`);
    }
  }
  console.error(
    `\n  Total errors: ${validate.errors.length}`
  );
  process.exit(1);
}
