import assert from "node:assert/strict";
import test from "node:test";
import { buildWhatsAppUrl } from "../src/lib/quote.mjs";

test("marketing WhatsApp URL is encoded and uses the current number", () => {
  const url = buildWhatsAppUrl("+62 813-8792-7481", [{ id: "sample", name: "Sofa VIP", price: 150000, qty: 1 }]);
  assert.match(url, /^https:\/\/wa\.me\/6281387927481\?text=/);
  assert.equal(url.includes(" "), false);
});
