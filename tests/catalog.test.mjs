import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const catalog = JSON.parse(await readFile(new URL("../src/data/catalog.json", import.meta.url), "utf8"));

test("legacy marketing catalog contains the pre-RR product set", () => {
  assert.equal(catalog.length, 84);
  assert.deepEqual([...new Set(catalog.map((item) => item.category))].sort(), ["Kursi", "Meja", "Perlengkapan", "Sofa"]);
  assert.equal(catalog.every((item) => (typeof item.price === "string" && item.price.startsWith("Rp")) || (typeof item.price === "number" && item.price > 0)), true);
  assert.equal(catalog.every((item) => item.image.startsWith("/images/products/") && item.image.endsWith(".png")), true);
  assert.equal(catalog.some((item) => item.name === "Sofa Oval VIP"), true);
  assert.equal(catalog.some((item) => item.name === "Kursi Cobra"), true);
});

test("every catalog image exists in the restored product folder", () => {
  for (const item of catalog) {
    assert.equal(existsSync(new URL(`../public${item.image}`, import.meta.url)), true, item.image);
  }
});

test("catalog has no RR source coupling", () => {
  assert.equal(catalog.some((item) => item.source === "RR Production"), false);
  assert.equal(JSON.stringify(catalog).includes("rr-production.com"), false);
});
