import { formatIDR } from "./catalog.mjs";

export const PLAN_STORAGE_KEY = "hr-production:event-plan";
export const PLAN_STORAGE_VERSION = 2;

export function calculatePlan(items = []) {
  return items.reduce(
    (summary, item) => {
      const qty = positiveInteger(item.qty);
      const price = Number(item.price);
      summary.units += qty;
      if (Number.isFinite(price) && price > 0) {
        summary.total += price * qty;
        summary.pricedUnits += qty;
      } else {
        summary.unpricedUnits += qty;
      }
      return summary;
    },
    { units: 0, total: 0, pricedUnits: 0, unpricedUnits: 0 },
  );
}

export function parseStoredPlan(raw, catalogById) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.version !== PLAN_STORAGE_VERSION || !Array.isArray(parsed.items)) return [];
    return parsed.items.flatMap((stored) => {
      const product = catalogById.get(stored?.id);
      const qty = positiveInteger(stored?.qty);
      return product && qty > 0 ? [{ ...product, qty }] : [];
    });
  } catch {
    return [];
  }
}

export function serializePlan(items = []) {
  return JSON.stringify({
    version: PLAN_STORAGE_VERSION,
    items: items
      .filter((item) => item?.id && positiveInteger(item.qty) > 0)
      .map((item) => ({ id: item.id, qty: positiveInteger(item.qty) })),
  });
}

export function buildQuoteMessage(items = []) {
  const validItems = items.filter((item) => positiveInteger(item.qty) > 0);
  const { units, total, unpricedUnits } = calculatePlan(validItems);
  const lines = validItems.map((item, index) => {
    const qty = positiveInteger(item.qty);
    const price = Number(item.price);
    const priceText = Number.isFinite(price) && price > 0 ? formatIDR(price * qty) : "harga dikonfirmasi";
    return `${index + 1}. ${item.name} × ${qty} — ${priceText}`;
  });

  const totals = [`Total unit: ${units}`];
  if (total > 0) totals.push(`Subtotal item berharga: ${formatIDR(total)}`);
  if (unpricedUnits > 0) totals.push("Harga final: mohon penawaran");

  return [
    "Halo HR Production, saya ingin meminta penawaran perlengkapan event:",
    "",
    ...lines,
    "",
    ...totals,
    "",
    "Jenis acara:",
    "Tanggal acara:",
    "Lokasi venue:",
    "",
    "Mohon konfirmasi ketersediaan, biaya pengiriman, setup, dan penawaran final.",
  ].join("\n");
}

export function buildWhatsAppUrl(number, items = []) {
  const digits = String(number).replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(buildQuoteMessage(items))}`;
}

function positiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}
