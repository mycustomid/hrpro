import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dist = new URL("../dist/", import.meta.url);

test("build produces single-page architecture without redesign subroutes", () => {
  assert.equal(existsSync(new URL("index.html", dist)), true);
  assert.equal(existsSync(new URL("katalog/index.html", dist)), false);
  assert.equal(existsSync(new URL("artikel/index.html", dist)), false);
});

test("homepage matches the screenshot-era structure requested by Bos", async () => {
  const source = await readFile(new URL("index.html", dist), "utf8");
  assert.match(source, /SEMUA PERLENGKAPAN EVENT ADA DISINI/);
  assert.match(source, /KATALOG LENGKAP/);
  assert.match(source, /Kursi Tiffany/);
  assert.match(source, /6281387927481/);
});

test("essential assets are bundled in dist output", () => {
  assert.equal(existsSync(new URL("css/style.css", dist)), true);
  assert.equal(existsSync(new URL("css/bootstrap.css", dist)), true);
  assert.equal(existsSync(new URL("js/jquery-2.1.4.min.js", dist)), true);
  assert.equal(existsSync(new URL("images/product/r1.jpg", dist)), true);
});
