import assert from "node:assert/strict";
import test from "node:test";

import {
  buildQuoteMessage,
  buildWhatsAppUrl,
  calculatePlan,
  parseStoredPlan,
  serializePlan,
} from "../src/lib/quote.mjs";

const catalog = [
  { id: "kursi-tiffany-gold", name: "Kursi Tiffany Gold", price: null },
  { id: "podium-acara-resmi", name: "Podium Acara Resmi", price: null },
  { id: "priced-example", name: "Priced Example", price: 25000 },
];
const byId = new Map(catalog.map((item) => [item.id, item]));

test("calculates units and separates priced from unpriced items", () => {
  assert.deepEqual(
    calculatePlan([
      { ...catalog[0], qty: 4 },
      { ...catalog[2], qty: 2 },
    ]),
    { units: 6, total: 50000, pricedUnits: 2, unpricedUnits: 4 },
  );
});

test("rejects corrupted, obsolete, and unknown persisted items", () => {
  assert.deepEqual(parseStoredPlan("not-json", byId), []);
  assert.deepEqual(parseStoredPlan(JSON.stringify({ version: 2, items: [] }), byId), []);
  assert.deepEqual(
    parseStoredPlan(JSON.stringify({ version: 1, items: [{ id: "kursi-tiffany-gold", qty: 2 }] }), byId),
    [],
  );
  assert.deepEqual(
    parseStoredPlan(JSON.stringify({ version: 2, items: [{ id: "unknown", qty: 2 }] }), byId),
    [],
  );
});

test("restores only positive integer quantities from version 2 storage", () => {
  const raw = JSON.stringify({
    version: 2,
    items: [
      { id: "kursi-tiffany-gold", qty: 4 },
      { id: "podium-acara-resmi", qty: -1 },
    ],
  });
  assert.deepEqual(parseStoredPlan(raw, byId), [{ ...catalog[0], qty: 4 }]);
});

test("serializes a minimal versioned plan", () => {
  assert.equal(
    serializePlan([{ ...catalog[0], qty: 3 }]),
    JSON.stringify({ version: 2, items: [{ id: "kursi-tiffany-gold", qty: 3 }] }),
  );
});

test("builds a quotation message without inventing RR prices", () => {
  const message = buildQuoteMessage([{ ...catalog[0], qty: 4 }]);
  assert.match(message, /Kursi Tiffany Gold × 4 — harga dikonfirmasi/i);
  assert.match(message, /Harga final: mohon penawaran/i);
  assert.match(message, /Jenis acara:/);
  assert.match(message, /Tanggal acara:/);
  assert.match(message, /Lokasi venue:/);
  assert.match(message, /konfirmasi ketersediaan/i);
});

test("builds a safely encoded HR Production WhatsApp URL", () => {
  const url = buildWhatsAppUrl("+62 813-8792-7481", [{ ...catalog[1], qty: 1 }]);
  assert.match(url, /^https:\/\/wa\.me\/6281387927481\?text=/);
  assert.equal(url.includes(" "), false);
  assert.equal(
    decodeURIComponent(new URL(url).searchParams.get("text")),
    buildQuoteMessage([{ ...catalog[1], qty: 1 }]),
  );
});
