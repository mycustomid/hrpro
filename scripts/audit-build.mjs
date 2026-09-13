import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = join(root, "dist");
const source = await readFile(join(dist, "index.html"), "utf8");
const catalog = JSON.parse(await readFile(join(root, "src", "data", "catalog.json"), "utf8"));

assert.equal(catalog.length, 84, "expected pre-RR 84-product catalog");
assert.equal((source.match(/class="product-card"/g) || []).length, 84, "all products must render");
assert.match(source, /Katalog Rental Event yang Rapi, Lengkap, dan Siap Pakai/);
assert.match(source, /Info Cepat/);
assert.match(source, /6281387927481/);
assert.doesNotMatch(source, /rr-production\.com/i);

for (const item of catalog) {
  assert.equal(existsSync(join(dist, item.image.replace(/^\//, ""))), true, item.image);
}

console.log("commit-11 audit passed: 84 legacy products, original single-page catalog.");
