import { formatIDR } from "./catalog.mjs";

export const PLAN_STORAGE_KEY = "hr-production:event-plan";
export const PLAN_STORAGE_VERSION = 1;

export function calculatePlan(items = []) {
  return items.reduce(
    (summary, item) => {
      const qty = positiveInteger(item.qty);
      summary.units += qty;
      summary.total += Number(item.price || 0) * qty;
      return summary;
    },
    { units: 0, total: 0 },
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
  const { units, total } = calculatePlan(validItems);
  const lines = validItems.map(
    (item, index) => `${index + 1}. ${item.name} × ${positiveInteger(item.qty)} — ${formatIDR(Number(item.price) * positiveInteger(item.qty))}`,
  );

  return [
    "Halo HR Production, saya ingin meminta penawaran perlengkapan event:",
    "",
    ...lines,
    "",
    `Total unit: ${units}`,
    `Total estimasi awal: ${formatIDR(total)}`,
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
