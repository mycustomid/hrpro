import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
const dist = new URL("../dist/", import.meta.url);
const catalog = JSON.parse(await readFile(new URL("../src/data/catalog.json", import.meta.url), "utf8"));
test("build returns to the original single-page site",()=>{assert.equal(existsSync(new URL("index.html",dist)),true);assert.equal(existsSync(new URL("katalog/index.html",dist)),false);assert.equal(existsSync(new URL("artikel/index.html",dist)),false);});
test("original homepage renders the current RR catalog",async()=>{const source=await readFile(new URL("index.html",dist),"utf8");assert.equal((source.match(/class="product-card"/g)||[]).length,catalog.length);assert.equal(catalog.length,93);assert.match(source,/Daftar Produk/);assert.match(source,/Hubungi untuk harga/);assert.match(source,/6281387927481/);assert.match(source,/class="float-wa"/);});
test("all catalog images are local WebP assets",()=>{assert.equal(catalog.every((item)=>item.image.startsWith("/images/products/")),true);assert.equal(catalog.every((item)=>item.image.endsWith(".webp")),true);for(const item of catalog){assert.equal(existsSync(new URL(item.image.replace(/^\//,""),dist)),true,item.image);}});
