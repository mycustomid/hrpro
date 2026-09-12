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
  { id: "kursi-tiffany-gold", name: "Kursi Tiffany Gold", price: 25000 },
  { id: "podium", name: "Podium", price: 350000 },
];
const byId = new Map(catalog.map((item) => [item.id, item]));

test("calculates total units and estimated value", () => {
  assert.deepEqual(
    calculatePlan([{ ...catalog[0], qty: 4 }, { ...catalog[1], qty: 1 }]),
    { units: 5, total: 450000 },
  );
});

test("rejects corrupted, obsolete, and unknown persisted items", () => {
  assert.deepEqual(parseStoredPlan("not-json", byId), []);
  assert.deepEqual(parseStoredPlan(JSON.stringify({ version: 2, items: [] }), byId), []);
  assert.deepEqual(
    parseStoredPlan(JSON.stringify({ version: 1, items: [{ id: "unknown", qty: 2 }] }), byId),
    [],
  );
});

test("restores only positive integer quantities from storage", () => {
  const raw = JSON.stringify({
    version: 1,
    items: [
      { id: "kursi-tiffany-gold", qty: 4 },
      { id: "podium", qty: -1 },
    ],
  });
  assert.deepEqual(parseStoredPlan(raw, byId), [{ ...catalog[0], qty: 4 }]);
});

test("serializes a minimal versioned plan", () => {
  assert.equal(
    serializePlan([{ ...catalog[0], qty: 3 }]),
    JSON.stringify({ version: 1, items: [{ id: "kursi-tiffany-gold", qty: 3 }] }),
  );
});

test("builds a deterministic Indonesian quotation message", () => {
  const message = buildQuoteMessage([{ ...catalog[0], qty: 4 }]);
  assert.match(message, /Kursi Tiffany Gold × 4 — Rp100\.000/);
  assert.match(message, /Jenis acara:/);
  assert.match(message, /Tanggal acara:/);
  assert.match(message, /Lokasi venue:/);
  assert.match(message, /estimasi awal/i);
});

test("builds a safely encoded WhatsApp URL", () => {
  const url = buildWhatsAppUrl("+62 813-8117-8127", [{ ...catalog[1], qty: 1 }]);
  assert.match(url, /^https:\/\/wa\.me\/6281381178127\?text=/);
  assert.equal(url.includes(" "), false);
  assert.equal(decodeURIComponent(new URL(url).searchParams.get("text")), buildQuoteMessage([{ ...catalog[1], qty: 1 }]));
});
