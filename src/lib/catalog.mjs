const DISPLAY_NAME_OVERRIDES = new Map([
  ["sofa-scandiv-putih", "Sofa Scandinavian Putih"],
  ["meja-ibm-cover-stretcht", "Meja IBM Cover Stretch"],
  ["meja-cover-stretcht", "Meja Cover Stretch"],
  ["meja-bar-cover-stretcht", "Meja Bar Cover Stretch — Varian 1"],
  ["meja-bar-cover-stretcht-2", "Meja Bar Cover Stretch — Varian 2"],
  ["meja-dealing-alumunium", "Meja Dealing Aluminium"],
  ["meja-scremble-tinggi", "Meja Scramble Tinggi"],
  ["meja-scremble-pendek", "Meja Scramble Pendek"],
  ["kursi-sebaguna", "Kursi Serbaguna"],
  ["kursi-futura-cover", "Kursi Futura Cover — Standar"],
  ["kursi-futura-cover-2", "Kursi Futura Cover — Gala"],
  ["kursi-futura-cover-pita", "Kursi Futura Cover Pita — Varian 1"],
  ["kursi-futura-cover-pita-2", "Kursi Futura Cover Pita — Varian 2"],
  ["podium", "Podium — Varian 1"],
  ["podium-2", "Podium — Varian 2"],
  ["podium-3", "Podium — Varian 3"],
  ["podium-4", "Podium — Varian 4"],
  ["podium-akrilik-sirine", "Podium Akrilik Sirine"],
  ["standing-ac-5pk", "Standing AC 5 PK"],
  ["tenda-sarnafil", "Tenda Sarnafil"],
  ["traffic-cone", "Traffic Cone"],
]);

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
    const name = DISPLAY_NAME_OVERRIDES.get(id) || toDisplayCase(item.name);
    const tags = Array.isArray(item.tags) ? item.tags.map((tag) => toDisplayCase(tag)) : [];
    const description = String(item.description || "").trim();
    const normalized = {
      ...item,
      id,
      sourceName: item.name,
      name,
      tags,
      description,
      price: Number(item.price),
    };
    return {
      ...normalized,
      searchText: normalizeText([name, item.name, item.category, ...tags, description].join(" ")),
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
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value)).replace(/\s/g, "");
}

function toDisplayCase(value = "") {
  const keepUppercase = new Set(["VIP", "VVIP", "BUMN", "AC", "IBM", "HPL", "PK"]);
  return String(value)
    .trim()
    .split(/\s+/)
    .map((word) => {
      const uppercase = word.toUpperCase();
      if (keepUppercase.has(uppercase)) return uppercase;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}
