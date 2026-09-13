import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dist = new URL("../dist/", import.meta.url);
const catalog = JSON.parse(await readFile(new URL("../src/data/catalog.json", import.meta.url), "utf8"));

test("build is the 396-era single-page architecture", () => {
  assert.equal(existsSync(new URL("index.html", dist)), true);
  assert.equal(existsSync(new URL("katalog/index.html", dist)), false);
  assert.equal(existsSync(new URL("artikel/index.html", dist)), false);
});

test("homepage matches the requested 396 visual structure", async () => {
  const source = await readFile(new URL("index.html", dist), "utf8");
  assert.match(source, /Stage &amp; Booth/);
  assert.match(source, /Kelas Kenegaraan/);
  assert.match(source, /Paket Event Unggulan/);
  assert.match(source, /Simulasi Anggaran Event/);
  assert.match(source, /Rencana Kebutuhan Event/);
  assert.match(source, /6281387927481/);
});

test("homepage renders all 84 legacy catalog cards", async () => {
  const source = await readFile(new URL("index.html", dist), "utf8");
  assert.equal((source.match(/class="product-card"/g) || []).length, catalog.length);
  assert.equal(catalog.length, 84);
  assert.match(source, /Referensi Rp/);
});

test("operational ownership claims from the old copy are removed", async () => {
  const source = await readFile(new URL("index.html", dist), "utf8");
  assert.doesNotMatch(source, /Vendor Terpercaya/i);
  assert.doesNotMatch(source, /Armada Pengiriman Tepat Waktu 24\/7/i);
  assert.doesNotMatch(source, /Unit Steril &amp; Siap Pakai/i);
  assert.match(source, /Multi-vendor/i);
});
