import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dist = new URL("../dist/", import.meta.url);
const routes = [
  ["index.html", "HR Production"],
  ["katalog/index.html", "Katalog"],
  ["event-corporate-pemerintah/index.html", "Corporate"],
  ["exhibition-conference/index.html", "Exhibition"],
  ["wedding-gala/index.html", "Wedding"],
  ["404.html", "404"],
];

async function html(path) {
  return readFile(new URL(path, dist), "utf8");
}

test("build emits every public route", () => {
  for (const [path] of routes) {
    assert.equal(existsSync(new URL(path, dist)), true, `missing ${path}`);
  }
});

test("every route has one H1 and complete social metadata", async () => {
  const titles = new Set();
  for (const [path, label] of routes) {
    const source = await html(path);
    const h1Count = (source.match(/<h1(?:\s|>)/g) || []).length;
    assert.equal(h1Count, 1, `${label} must have one H1`);
    assert.match(source, /<link rel="canonical" href="https:\/\/hrproduction\.id/);
    assert.match(source, /<meta name="description" content="[^"]+"/);
    assert.match(source, /<meta property="og:title" content="[^"]+"/);
    assert.match(source, /<meta property="og:image" content="https:\/\/hrproduction\.id\/og-default\.svg"/);
    assert.match(source, /<meta name="twitter:card" content="summary_large_image"/);
    const title = source.match(/<title>(.*?)<\/title>/)?.[1];
    assert.ok(title, `${label} needs a title`);
    assert.equal(titles.has(title), false, `${label} title must be unique`);
    titles.add(title);
  }
});

test("homepage carries the operational narrative without unsupported claims", async () => {
  const source = await html("index.html");
  assert.match(source, /Acara besar/);
  assert.match(source, /Minta Penawaran/);
  assert.match(source, /Lihat Katalog/);
  assert.match(source, /Brief/);
  assert.match(source, /Selected Inventory|Pilihan inventaris/i);
  assert.doesNotMatch(source, /&lt;\s*1 Jam|<\s*1 Jam/);
  assert.doesNotMatch(source, /vendor terpercaya/i);
});

test("catalog server-renders all inventory with accessible plan controls", async () => {
  const source = await html("katalog/index.html");
  const productIds = [...source.matchAll(/data-product-id="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(productIds).size, 84);
  assert.match(source, /aria-label="Cari produk"/);
  assert.match(source, /data-filter-group="category"/);
  assert.match(source, /data-filter-group="use"/);
  assert.match(source, /role="dialog"/);
  assert.match(source, /estimasi awal/i);
});

test("solution pages contain breadcrumbs and Service schema", async () => {
  for (const [path] of routes.slice(2, 5)) {
    const source = await html(path);
    assert.match(source, /aria-label="Breadcrumb"/);
    assert.match(source, /"@type":"Service"/);
  }
});

test("brand, manifest, robots, and sitemap assets exist", async () => {
  const required = [
    "brand/hr-production-logo.svg",
    "brand/hr-mark.svg",
    "favicon.svg",
    "site.webmanifest",
    "robots.txt",
    "og-default.svg",
    "sitemap-index.xml",
  ];
  for (const path of required) {
    assert.equal(existsSync(new URL(path, dist)), true, `missing ${path}`);
  }
  assert.match(await html("robots.txt"), /Sitemap: https:\/\/hrproduction\.id\/sitemap-index\.xml/);
});
