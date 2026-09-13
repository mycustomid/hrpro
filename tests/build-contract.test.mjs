import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dist = new URL("../dist/", import.meta.url);
const catalog = JSON.parse(await readFile(new URL("../src/data/catalog.json", import.meta.url), "utf8"));

test("build is the original commit 11 single-page architecture", () => {
  assert.equal(existsSync(new URL("index.html", dist)), true);
  assert.equal(existsSync(new URL("katalog/index.html", dist)), false);
  assert.equal(existsSync(new URL("artikel/index.html", dist)), false);
});

test("homepage matches the commit 11 visual structure", async () => {
  const source = await readFile(new URL("index.html", dist), "utf8");
  assert.match(source, /Katalog Rental Event yang Rapi, Lengkap, dan Siap Pakai/);
  assert.match(source, /Info Cepat/);
  assert.match(source, /Daftar Produk/);
  assert.match(source, /Katalog 2025\/2026/);
  assert.match(source, /6281387927481/);
});

test("homepage renders all 84 legacy catalog cards", async () => {
  const source = await readFile(new URL("index.html", dist), "utf8");
  assert.equal((source.match(/class="product-card"/g) || []).length, catalog.length);
  assert.equal(catalog.length, 84);
});
