import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = join(root, "dist");
const source = await readFile(join(dist, "index.html"), "utf8");
const catalog = JSON.parse(await readFile(join(root, "src", "data", "catalog.json"), "utf8"));

assert.equal((source.match(/<h1(?:\s|>)/g) || []).length, 1, "homepage needs one H1");
assert.equal((source.match(/class="product-card"/g) || []).length, catalog.length, "all RR products must render");
assert.equal(catalog.length, 93, "expected 93 RR products");
assert.match(source, /6281387927481/, "marketing WhatsApp missing");
assert.match(source, /class="float-wa"/, "original floating WhatsApp missing");
assert.doesNotMatch(source, /Event infrastructure partner|Knowledge base|Operational brief/i, "redesign copy leaked into original site");

for (const item of catalog) {
  const image = join(dist, item.image.replace(/^\//, ""));
  assert.equal(existsSync(image), true, `missing ${item.image}`);
}

console.log(`Original-design audit passed: ${catalog.length} RR products rendered.`);
