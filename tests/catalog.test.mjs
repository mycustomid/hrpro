import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { filterCatalog, formatIDR, normalizeCatalog, normalizeText } from "../src/lib/catalog.mjs";

const source = JSON.parse(
  await readFile(new URL("../src/data/catalog.json", import.meta.url), "utf8"),
);
const products = normalizeCatalog(source);

test("normalizes all inventory records into unique stable product IDs", () => {
  assert.equal(products.length, 84);
  assert.equal(new Set(products.map((item) => item.id)).size, 84);
  assert.equal(products.every((item) => item.price > 0), true);
  assert.deepEqual([...new Set(products.map((item) => item.category))].sort(), [
    "Kursi",
    "Meja",
    "Perlengkapan",
    "Sofa",
  ]);
});

test("uses corrected customer-facing names without mutating source records", () => {
  assert.equal(products.find((item) => item.id === "sofa-scandiv-putih")?.name, "Sofa Scandinavian Putih");
  assert.equal(products.find((item) => item.id === "kursi-sebaguna")?.name, "Kursi Serbaguna");
  assert.equal(source.find((item) => item.image.endsWith("kursi-sebaguna.png"))?.name, "Kursi sebaguna");
});

test("keeps duplicate source names distinct in the event plan", () => {
  const podiums = products.filter((item) => item.sourceName === "Podium");
  assert.equal(podiums.length, 4);
  assert.equal(new Set(podiums.map((item) => item.name)).size, 4);
});

test("filters with AND semantics across query, category, and use case", () => {
  const result = filterCatalog(products, { category: "Kursi", use: "BUMN", query: "vip" });
  assert.equal(result.length > 0, true);
  assert.equal(result.every((item) => item.category === "Kursi"), true);
  assert.equal(result.every((item) => item.tags.includes("BUMN")), true);
  assert.equal(result.every((item) => item.searchText.includes("vip")), true);
});

test("normalizes punctuation and formats Indonesian prices", () => {
  assert.equal(normalizeText("  Pódium—VIP  "), "podium vip");
  assert.equal(formatIDR(125000), "Rp125.000");
});
