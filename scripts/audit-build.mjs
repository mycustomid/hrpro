import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = join(root, "dist");
const source = await readFile(join(dist, "index.html"), "utf8");

assert.match(source, /SEMUA PERLENGKAPAN EVENT ADA DISINI/, "must have target screenshot headline");
assert.match(source, /KATALOG LENGKAP/, "must have yellow catalog button");
assert.match(source, /Kursi Tiffany/, "must render favorite products");
assert.match(source, /6281387927481/, "must use official marketing number");

assert.equal(existsSync(join(dist, "css", "style.css")), true, "css/style.css must exist");
assert.equal(existsSync(join(dist, "css", "bootstrap.css")), true, "css/bootstrap.css must exist");
assert.equal(existsSync(join(dist, "js", "jquery-2.1.4.min.js")), true, "jquery must exist");
assert.equal(existsSync(join(dist, "images", "product", "r1.jpg")), true, "product r1 image must exist");

console.log("screenshot-design audit passed: authentic HRproduction layout verified.");
