export function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function productIdFromImage(image) {
  const filename = String(image).split("/").pop() || "product";
  return filename.replace(/\.[^.]+$/, "");
}

export function normalizeCatalog(items = []) {
  return items.map((item) => {
    const id = productIdFromImage(item.image);
    const name = String(item.name || "").trim();
    const tags = Array.isArray(item.tags) ? item.tags.map((tag) => String(tag).trim()).filter(Boolean) : [];
    const description = String(item.description || "").trim();
    const rawPrice = Number(item.price);
    const price = Number.isFinite(rawPrice) && rawPrice > 0 ? rawPrice : null;
    const normalized = {
      ...item,
      id,
      sourceName: item.name,
      name,
      tags,
      description,
      price,
    };
    return {
      ...normalized,
      searchText: normalizeText([name, item.category, ...tags, description].join(" ")),
    };
  });
}

export function filterCatalog(items, filters = {}) {
  const query = normalizeText(filters.query);
  const category = normalizeText(filters.category);
  const use = normalizeText(filters.use);
  const isAll = (value) => !value || value === "semua" || value === "all";

  return items.filter((item) => {
    const matchesQuery = !query || item.searchText.includes(query);
    const matchesCategory = isAll(category) || normalizeText(item.category) === category;
    const matchesUse = isAll(use) || item.tags.some((tag) => normalizeText(tag) === use);
    return matchesQuery && matchesCategory && matchesUse;
  });
}

export function formatIDR(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "Hubungi untuk harga";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(number).replace(/\s/g, "");
}
