import { normalizeText, formatIDR } from "../lib/catalog.mjs";
import { PLAN_STORAGE_KEY, parseStoredPlan, serializePlan, calculatePlan, buildWhatsAppUrl } from "../lib/quote.mjs";

const productNodes = [...document.querySelectorAll("[data-product]")];
const catalog = productNodes.map((node) => ({ id: node.dataset.productId, name: node.querySelector("[data-product-name]")?.dataset.productName || "Produk", price: Number(node.querySelector("[data-product-price]")?.dataset.productPrice || 0), category: node.dataset.category || "", tags: (node.dataset.tags || "").split("|").filter(Boolean), searchText: node.dataset.search || "" }));
const catalogById = new Map(catalog.map((item) => [item.id, item]));
let plan = parseStoredPlan(localStorage.getItem(PLAN_STORAGE_KEY), catalogById);
let category = "Semua";
let use = "Semua";
let lastFocus = null;

const drawer = document.querySelector("[data-quote-drawer]");
const overlay = document.querySelector("[data-drawer-overlay]");
const planItems = document.querySelector("[data-plan-items]");
const search = document.querySelector("[data-catalog-search]");

function announce(message) { const region = document.querySelector("[data-live-region]"); if (region) region.textContent = message; }
function unitsOf(items = plan) { return calculatePlan(items).units; }
function savePlan() { localStorage.setItem(PLAN_STORAGE_KEY, serializePlan(plan)); window.dispatchEvent(new CustomEvent("hr:plan-updated", { detail: { units: unitsOf() } })); }
function addItem(id, qty = 1) { const product = catalogById.get(id); if (!product) return; const current = plan.find((item) => item.id === id); if (current) current.qty += qty; else plan.push({ ...product, qty }); savePlan(); renderPlan(); announce(`${product.name} ditambahkan ke rencana event.`); }
function changeQty(id, delta) { const item = plan.find((entry) => entry.id === id); if (!item) return; item.qty += delta; if (item.qty < 1) plan = plan.filter((entry) => entry.id !== id); savePlan(); renderPlan(); }

function renderPlan() {
  const summary = calculatePlan(plan);
  if (planItems) planItems.innerHTML = plan.map((item) => `<li class="plan-line"><div><strong>${escapeHTML(item.name)}</strong><small>${formatIDR(item.price)} / unit</small></div><div class="qty-control"><button type="button" data-qty-id="${item.id}" data-qty-delta="-1" aria-label="Kurangi ${escapeHTML(item.name)}">−</button><span>${item.qty}</span><button type="button" data-qty-id="${item.id}" data-qty-delta="1" aria-label="Tambah ${escapeHTML(item.name)}">＋</button></div><strong>${formatIDR(item.price * item.qty)}</strong><button type="button" class="remove-line" data-remove-id="${item.id}" aria-label="Hapus ${escapeHTML(item.name)}">×</button></li>`).join("");
  document.querySelector("[data-plan-empty]")?.toggleAttribute("hidden", plan.length > 0);
  document.querySelectorAll("[data-plan-total]").forEach((node) => { node.textContent = formatIDR(summary.total); });
  document.querySelectorAll("[data-plan-units], [data-plan-count-inline]").forEach((node) => { node.textContent = String(summary.units); });
  document.querySelectorAll("[data-plan-total-inline]").forEach((node) => { node.textContent = formatIDR(summary.total); });
  const link = document.querySelector("[data-plan-whatsapp]");
  if (link) { link.href = plan.length ? buildWhatsAppUrl("6281381178127", plan) : "#"; link.setAttribute("aria-disabled", String(plan.length === 0)); }
  document.querySelector("[data-clear-plan]")?.toggleAttribute("disabled", plan.length === 0);
}

function applyFilters() {
  const query = normalizeText(search?.value || "");
  let visible = 0;
  productNodes.forEach((node) => { const matches = (!query || node.dataset.search.includes(query)) && (category === "Semua" || node.dataset.category === category) && (use === "Semua" || (node.dataset.tags || "").split("|").includes(use)); node.hidden = !matches; if (matches) visible += 1; });
  document.querySelector("[data-result-count]").textContent = String(visible);
  document.querySelector("[data-active-filters]").textContent = `${category === "Semua" ? "Semua kategori" : category} · ${use === "Semua" ? "Semua kebutuhan" : use}${query ? ` · “${search.value.trim()}”` : ""}`;
  document.querySelector("[data-no-results]")?.toggleAttribute("hidden", visible > 0);
}

function setFilter(kind, value) { if (kind === "category") category = value; else use = value; document.querySelectorAll(`[data-filter-${kind}]`).forEach((button) => button.setAttribute("aria-pressed", String(button.dataset[`filter${kind[0].toUpperCase()}${kind.slice(1)}`] === value))); syncUrl(); applyFilters(); }
function resetFilters() { category = "Semua"; use = "Semua"; if (search) search.value = ""; ["category", "use"].forEach((kind) => document.querySelectorAll(`[data-filter-${kind}]`).forEach((button) => button.setAttribute("aria-pressed", String(button.textContent.trim() === "Semua")))); history.replaceState({}, "", location.pathname); applyFilters(); }
function syncUrl() { const params = new URLSearchParams(); if (category !== "Semua") params.set("category", category); if (use !== "Semua") params.set("use", use); if (search?.value.trim()) params.set("q", search.value.trim()); history.replaceState({}, "", `${location.pathname}${params.size ? `?${params}` : ""}`); }

function setBackgroundInert(inert) { document.querySelectorAll("body > .site-header, [data-catalog-content], body > .site-footer").forEach((node) => inert ? node.setAttribute("inert", "") : node.removeAttribute("inert")); }
function openDrawer(event) { lastFocus = event?.currentTarget || document.activeElement; drawer?.setAttribute("aria-hidden", "false"); overlay?.removeAttribute("hidden"); document.body.classList.add("drawer-open"); setBackgroundInert(true); drawer?.focus(); }
function closeDrawer() { drawer?.setAttribute("aria-hidden", "true"); overlay?.setAttribute("hidden", ""); document.body.classList.remove("drawer-open"); setBackgroundInert(false); history.replaceState({}, "", `${location.pathname}${location.search}`); lastFocus?.focus?.(); }
function trapFocus(event) { if (event.key !== "Tab" || drawer?.getAttribute("aria-hidden") === "true") return; const focusable = [...drawer.querySelectorAll('a[href]:not([aria-disabled="true"]),button:not([disabled]),[tabindex]:not([tabindex="-1"])')]; if (!focusable.length) return; const first = focusable[0]; const last = focusable.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }
function escapeHTML(value) { const span = document.createElement("span"); span.textContent = String(value); return span.innerHTML; }

document.querySelectorAll("[data-add-id]").forEach((button) => button.addEventListener("click", () => addItem(button.dataset.addId)));
document.querySelectorAll("[data-package-items]").forEach((button) => button.addEventListener("click", () => { JSON.parse(button.dataset.packageItems || "[]").forEach((item) => addItem(item.id, item.qty)); announce(`${button.dataset.packageName} ditambahkan.`); openDrawer({ currentTarget: button }); }));
document.querySelectorAll("[data-filter-category]").forEach((button) => button.addEventListener("click", () => setFilter("category", button.dataset.filterCategory)));
document.querySelectorAll("[data-filter-use]").forEach((button) => button.addEventListener("click", () => setFilter("use", button.dataset.filterUse)));
document.querySelectorAll("[data-reset-filters]").forEach((button) => button.addEventListener("click", resetFilters));
document.querySelectorAll("[data-open-drawer]").forEach((button) => button.addEventListener("click", openDrawer));
document.querySelectorAll('a[href$="#rencana-event"]').forEach((link) => link.addEventListener("click", (event) => { event.preventDefault(); openDrawer(event); }));
document.querySelector("[data-close-drawer]")?.addEventListener("click", closeDrawer);
overlay?.addEventListener("click", closeDrawer);
search?.addEventListener("input", () => { syncUrl(); applyFilters(); });
planItems?.addEventListener("click", (event) => { const quantity = event.target.closest("[data-qty-id]"); const remove = event.target.closest("[data-remove-id]"); if (quantity) changeQty(quantity.dataset.qtyId, Number(quantity.dataset.qtyDelta)); if (remove) { plan = plan.filter((item) => item.id !== remove.dataset.removeId); savePlan(); renderPlan(); } });
document.querySelector("[data-clear-plan]")?.addEventListener("click", () => { plan = []; savePlan(); renderPlan(); announce("Rencana event dikosongkan."); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && drawer?.getAttribute("aria-hidden") === "false") closeDrawer(); trapFocus(event); });
document.querySelector("[data-plan-whatsapp]")?.addEventListener("click", (event) => { if (!plan.length) event.preventDefault(); });

const params = new URLSearchParams(location.search);
const initialCategory = params.get("category");
const initialUse = params.get("use");
if (initialCategory && [...document.querySelectorAll("[data-filter-category]")].some((button) => button.dataset.filterCategory === initialCategory)) setFilter("category", initialCategory);
if (initialUse && [...document.querySelectorAll("[data-filter-use]")].some((button) => button.dataset.filterUse === initialUse)) setFilter("use", initialUse);
if (search && params.get("q")) search.value = params.get("q");
applyFilters();
renderPlan();
if (location.hash === "#rencana-event") openDrawer();
