import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { filterCatalog, formatIDR, normalizeCatalog, normalizeText } from "../src/lib/catalog.mjs";

const source = JSON.parse(await readFile(new URL("../src/data/catalog.json", import.meta.url), "utf8"));
const products = normalizeCatalog(source);

test("catalog records use unique stable local image IDs", () => {
  assert.equal(products.length >= 50, true);
  assert.equal(new Set(products.map((item) => item.id)).size, products.length);
  assert.equal(products.every((item) => item.image.startsWith("/images/products/") && item.image.endsWith(".webp")), true);
  assert.deepEqual([...new Set(products.map((item) => item.category))].sort(), ["Kursi", "Meja", "Perlengkapan", "Sofa"]);
});

test("RR-sourced products do not invent public prices", () => {
  assert.equal(products.every((item) => item.source === "RR Production"), true);
  assert.equal(products.every((item) => item.price === null), true);
  assert.equal(formatIDR(null), "Hubungi untuk harga");
});

test("filters with AND semantics across query, category, and use case", () => {
  const result = filterCatalog(products, { category: "Kursi", query: "kursi" });
  assert.equal(result.length > 0, true);
  assert.equal(result.every((item) => item.category === "Kursi"), true);
});

test("normalizes punctuation and formats Indonesian prices", () => {
  assert.equal(normalizeText("  Pódium—VIP  "), "podium vip");
  assert.equal(formatIDR(125000), "Rp125.000");
});
