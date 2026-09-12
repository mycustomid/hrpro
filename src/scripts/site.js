const root = document.documentElement;
root.classList.add("js");

const menuToggle = document.querySelector("[data-menu-toggle]");
const menu = document.querySelector("[data-menu]");

function updatePlanBadge(units) {
  document.querySelectorAll("[data-plan-count]").forEach((badge) => {
    badge.textContent = String(units);
    badge.hidden = units < 1;
  });
}

function closeMenu() {
  if (!menu || !menuToggle) return;
  menu.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");
}

menuToggle?.addEventListener("click", () => {
  const open = !menu?.classList.contains("is-open");
  menu?.classList.toggle("is-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("menu-open", open);
});

menu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const reveals = document.querySelectorAll("[data-reveal]");
if (reducedMotion || !("IntersectionObserver" in window)) {
  reveals.forEach((element) => element.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8%", threshold: 0.08 },
  );
  reveals.forEach((element) => observer.observe(element));
}

try {
  const stored = JSON.parse(localStorage.getItem("hr-production:event-plan") || "null");
  const units = stored?.version === 1 && Array.isArray(stored.items)
    ? stored.items.reduce((sum, item) => sum + (Number.isInteger(item.qty) && item.qty > 0 ? item.qty : 0), 0)
    : 0;
  updatePlanBadge(units);
} catch {
  updatePlanBadge(0);
}

window.addEventListener("hr:plan-updated", (event) => updatePlanBadge(event.detail?.units || 0));

document.querySelectorAll('img[src*="/images/products/"]').forEach((image) => {
  image.addEventListener("error", () => {
    image.src = `${document.querySelector('link[rel="icon"]')?.href || "/favicon.svg"}`;
    image.alt = image.alt ? `${image.alt} — gambar belum tersedia` : "Gambar produk belum tersedia";
    image.classList.add("image-fallback");
  }, { once: true });
});
