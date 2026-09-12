import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = join(root, "dist");
const htmlFiles = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (extname(entry.name) === ".html") htmlFiles.push(path);
  }
}

await walk(dist);
assert.equal(htmlFiles.length, 6, "expected six public HTML routes");

for (const file of htmlFiles) {
  const source = await readFile(file, "utf8");
  const relative = file.slice(dist.length + 1);
  assert.equal((source.match(/<h1(?:\s|>)/g) || []).length, 1, `${relative}: expected one H1`);
  assert.equal((source.match(/<link rel="canonical"/g) || []).length, 1, `${relative}: expected one canonical`);
  assert.match(source, /<meta name="description" content="[^\"]{40,}/, `${relative}: missing useful description`);
  assert.doesNotMatch(source, /<\s*1 Jam|vendor terpercaya|stok tersedia|real.time availability/i, `${relative}: contains unsupported claim`);

  const ids = [...source.matchAll(/\sid="([^\"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${relative}: duplicate HTML id`);

  const localUrls = [...source.matchAll(/(?:href|src)="([^\"]+)"/g)].map((match) => match[1]).filter((url) => url.startsWith("/") && !url.startsWith("//"));
  for (const url of localUrls) {
    const pathname = url.split(/[?#]/)[0];
    if (!pathname || pathname === "/") continue;
    const target = join(dist, pathname.replace(/^\//, ""));
    const resolves = existsSync(target) || existsSync(`${target}.html`) || existsSync(join(target, "index.html"));
    assert.equal(resolves, true, `${relative}: unresolved local asset/link ${pathname}`);
  }
}

const catalog = await readFile(join(dist, "katalog", "index.html"), "utf8");
const products = [...catalog.matchAll(/data-product-id="([^\"]+)"/g)].map((match) => match[1]);
assert.equal(products.length, 84, "catalog must render 84 product nodes");
assert.equal(new Set(products).size, 84, "catalog product IDs must be unique");
assert.equal(existsSync(join(dist, "robots.txt")), true, "robots.txt missing");
assert.equal(existsSync(join(dist, "sitemap-index.xml")), true, "sitemap index missing");
assert.equal(existsSync(join(dist, "brand", "hr-production-logo.svg")), true, "brand logo missing");
assert.equal(existsSync(join(dist, "favicon.svg")), true, "favicon missing");

console.log(`Build audit passed: ${htmlFiles.length} routes, ${products.length} products, local links/assets resolved.`);
