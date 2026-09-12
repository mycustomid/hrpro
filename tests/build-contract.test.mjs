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
  ["artikel/index.html", "Artikel"],
  ["artikel/checklist-sewa-perlengkapan-event-corporate/index.html", "Artikel Corporate"],
  ["artikel/cara-memilih-kursi-event/index.html", "Artikel Kursi"],
  ["artikel/panduan-layout-booth-pameran/index.html", "Artikel Booth"],
  ["artikel/sewa-perlengkapan-event-pemerintah/index.html", "Artikel Pemerintah"],
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
    assert.match(source, /<link rel="canonical" href="https:\/\/www\.hrproduction\.id/);
    assert.match(source, /<meta name="description" content="[^"]+"/);
    assert.match(source, /<meta property="og:title" content="[^"]+"/);
    assert.match(source, /<meta property="og:image" content="https:\/\/www\.hrproduction\.id\/og-default\.svg"/);
    assert.match(source, /<meta name="twitter:card" content="summary_large_image"/);
    const title = source.match(/<title>(.*?)<\/title>/)?.[1];
    assert.ok(title, `${label} needs a title`);
    assert.equal(titles.has(title), false, `${label} title must be unique`);
    titles.add(title);
  }
});

test("homepage is positioned as a marketing and booking channel", async () => {
  const source = await html("index.html");
  assert.match(source, /Acara besar/);
  assert.match(source, /Minta Penawaran/);
  assert.match(source, /Lihat Katalog/);
  assert.match(source, /membantu memilih, menyusun, dan memesan/i);
  assert.match(source, /6281387927481/);
  assert.doesNotMatch(source, /Event infrastructure partner/i);
});

test("public build does not expose upstream direct-contact details", async () => {
  const blocked = [
    /0821[ -]?4143[ -]?8080/,
    /0813[ -]?1462[ -]?2349/,
    /0821[ -]?3081[ -]?8342/,
    /rrproduction123@gmail\.com/i,
    /azaremon@gmail\.com/i,
  ];
  for (const [path] of routes) {
    const source = await html(path);
    for (const pattern of blocked) assert.doesNotMatch(source, pattern, `${path} leaks upstream contact`);
  }
});

test("catalog server-renders all products with accessible plan controls", async () => {
  const source = await html("katalog/index.html");
  const productIds = [...source.matchAll(/data-product-id="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(productIds).size, 84);
  assert.match(source, /aria-label="Cari produk"/);
  assert.match(source, /data-filter-group="category"/);
  assert.match(source, /data-filter-group="use"/);
  assert.match(source, /role="dialog"/);
  assert.match(source, /Ketersediaan item dikonfirmasi saat pemesanan/i);
});

test("solution pages contain breadcrumbs and Service schema", async () => {
  for (const [path] of routes.slice(2, 5)) {
    const source = await html(path);
    assert.match(source, /aria-label="Breadcrumb"/);
    assert.match(source, /"@type":"Service"/);
  }
});

test("brand, favicon, manifest, robots, and sitemap assets exist", async () => {
  const required = [
    "favicon.svg",
    "favicon.ico",
    "brand/hr-emblem.png",
    "brand/hr-production-logo.svg",
    "brand/hr-production-logo-inverse.svg",
    "brand/hr-mark.svg",
    "site.webmanifest",
    "robots.txt",
    "og-default.svg",
    "sitemap-index.xml",
  ];
  for (const path of required) {
    assert.equal(existsSync(new URL(path, dist)), true, `missing ${path}`);
  }
  assert.match(await html("robots.txt"), /Sitemap: https:\/\/www\.hrproduction\.id\/sitemap-index\.xml/);
});
