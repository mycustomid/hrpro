# HR Production Awwwards V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a production-ready Astro website that positions HR Production as the infrastructure behind serious events and converts visitors through a searchable event-plan quotation builder.

**Architecture:** Keep Astro static-first and move business logic into small, testable JavaScript modules. Compose the homepage and solution routes from focused Astro components, keep all 84 product records server-rendered on `/katalog`, and progressively enhance filtering, persistence, and the accessible quotation drawer with route-scoped browser JavaScript.

**Tech Stack:** Astro 5, JavaScript ES modules, CSS, Node built-in test runner, `@astrojs/sitemap`, `@astrojs/check`, TypeScript for Astro checking only.

**Spec:** `docs/superpowers/specs/2026-09-12-hr-production-awwwards-v2-design.md`

## Global Constraints

- Work only on `redesign/awwwards-v2`; never edit or merge `main` directly.
- Preserve all 84 inventory records, prices, images, tags, WhatsApp number, PDF catalog, and verified operational data.
- Use existing product imagery; do not add random stock photography or fabricated client proof.
- Use the Operational Editorial visual system: warm bone, graphite, signal green, architectural grid, minimal rounding, asymmetric editorial rhythm.
- Do not use React, GSAP, Lenis, or another hydration framework.
- Do not claim real-time availability, unsupported response times, fake scarcity, invented client logos, or fabricated testimonials.
- Respect `prefers-reduced-motion`, WCAG AA contrast, keyboard navigation, and 320px minimum viewport.
- Vercel deployment and Cloudflare DNS are outside scope.

---

### Task 1: Testable catalog and quotation domain

**Files:**
- Create: `tests/catalog.test.mjs`
- Create: `tests/quote.test.mjs`
- Create: `src/lib/catalog.mjs`
- Create: `src/lib/quote.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `normalizeCatalog(items)`, `normalizeText(value)`, `filterCatalog(items, filters)`, `formatIDR(value)`.
- Produces: `calculatePlan(items)`, `parseStoredPlan(raw, catalogById)`, `buildQuoteMessage(items)`, `buildWhatsAppUrl(number, items)`.
- Stable product IDs derive from unique image basenames so duplicate display names cannot collide.

- [ ] **Step 1: Add the Node test command and write failing catalog tests**

The tests load `src/data/catalog.json`, require 84 normalized products, unique IDs, positive prices, four allowed categories, normalized typo presentation, and filter matches for category plus use-case.

```js
assert.equal(products.length, 84);
assert.equal(new Set(products.map((item) => item.id)).size, 84);
assert.equal(filterCatalog(products, { category: "Kursi", use: "BUMN", query: "" }).every((item) => item.category === "Kursi" && item.tags.includes("BUMN")), true);
```

- [ ] **Step 2: Run `npm test` and confirm failure because the modules do not exist**

Expected: Node test runner exits non-zero with module-not-found for `src/lib/catalog.mjs`.

- [ ] **Step 3: Implement catalog normalization and filtering**

Use the image basename as `id`, normalize search text with Unicode diacritic removal, apply a small filename-keyed display-name correction map, and filter with AND semantics across query/category/use-case.

- [ ] **Step 4: Run catalog tests until green**

Run: `npm test -- tests/catalog.test.mjs`
Expected: all catalog assertions pass.

- [ ] **Step 5: Write failing quotation tests**

Cover subtotal/count, corrupted storage, unknown IDs, deterministic Indonesian message content, and encoded WhatsApp URL.

```js
assert.deepEqual(calculatePlan([{ id: "chair", name: "Kursi", price: 25000, qty: 4 }]), { units: 4, total: 100000 });
assert.equal(parseStoredPlan("not-json", byId).length, 0);
assert.match(buildWhatsAppUrl("6281381178127", items), /^https:\/\/wa\.me\/6281381178127\?text=/);
```

- [ ] **Step 6: Confirm quotation tests fail, then implement the minimal pure functions**

Storage parser accepts only version `1`, positive integer quantities, and IDs that exist in `catalogById`. The quote message lists line totals and asks for event type, date, and venue.

- [ ] **Step 7: Run all unit tests**

Run: `npm test`
Expected: all tests pass with zero failures.

### Task 2: Brand system, layout, metadata, and global shell

**Files:**
- Create: `public/brand/hr-production-logo.svg`
- Create: `public/brand/hr-mark.svg`
- Replace: `public/favicon.svg`
- Create: `public/site.webmanifest`
- Create: `public/robots.txt`
- Create: `public/og-default.svg`
- Create: `src/config/site.mjs`
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/Brand.astro`
- Create: `src/components/Header.astro`
- Create: `src/components/Footer.astro`
- Create: `src/scripts/site.js`
- Replace: `src/styles/global.css`
- Modify: `astro.config.mjs`
- Modify: `package.json`

**Interfaces:**
- `BaseLayout` props: `{ title, description, canonicalPath, image?, schema?, bodyClass? }`.
- `site` config exposes `name`, `domain`, `phone`, `phoneDisplay`, `email`, `address`, `serviceArea`, and `wa(text)`.
- Header reads `data-plan-count`; catalog script dispatches `hr:plan-updated` with `{ units }`.

- [ ] **Step 1: Add a failing build-contract test for required brand and metadata output**

Create `tests/build-contract.test.mjs` that validates built route HTML and required public files after `npm run build`.

- [ ] **Step 2: Run the contract test against the current build and confirm failure**

Expected: missing canonical, OG metadata, manifest, new brand assets, and internal routes.

- [ ] **Step 3: Create the SVG identity and base design tokens**

The mark combines a squared `H` structural frame with an `R` diagonal/forward stroke. Use only `currentColor`/monochrome-safe paths. Define bone `#F1EFE7`, graphite `#151712`, signal green `#C7FF36`, steel `#697169`, and utility orange `#FF6A2A`, plus spacing/type/line tokens.

- [ ] **Step 4: Implement BaseLayout, navigation, footer, and progressive site script**

BaseLayout renders canonical, theme color, OG/Twitter, manifest, favicon, Organization/LocalBusiness schema, skip link, and a page slot. Site script controls the mobile menu, IntersectionObserver reveals, Escape behavior, and stored plan count without blocking no-JS content.

- [ ] **Step 5: Configure sitemap and Astro checks**

Set `site: "https://hrproduction.id"`, preserve environment-configurable base paths, add `@astrojs/sitemap`, and add `check` plus `verify` scripts.

- [ ] **Step 6: Run `npm run check`, unit tests, and build**

Expected: Astro check has zero errors; unit tests pass; build generates sitemap and valid HTML.

### Task 3: Flagship homepage and editorial components

**Files:**
- Create: `src/components/home/Hero.astro`
- Create: `src/components/home/ProofRail.astro`
- Create: `src/components/home/EventSolutions.astro`
- Create: `src/components/home/SelectedInventory.astro`
- Create: `src/components/home/Process.astro`
- Create: `src/components/home/Readiness.astro`
- Create: `src/components/FinalCTA.astro`
- Replace: `src/pages/index.astro`
- Create: `src/styles/home.css`

**Interfaces:**
- `SelectedInventory` receives normalized products and resolves curated IDs.
- `FinalCTA` receives optional `eyebrow`, `title`, `body`, and prefilled WhatsApp text.
- Solution links pass contextual `category` or `use` query parameters to `/katalog`.

- [ ] **Step 1: Extend the failing build contract with homepage copy and landmark assertions**

Require one H1 containing “Acara besar”, both primary CTAs, operational process content, selected inventory links, and no unsupported “< 1 Jam” claim.

- [ ] **Step 2: Run the contract test and confirm the old homepage fails**

- [ ] **Step 3: Build the homepage components and route composition**

Use actual Sofa Oval VIP, Podium Garuda, Tiffany Gold, and Meja Dealing assets as the hero/showroom composition. Vary section backgrounds, scale, alignment, and density so the page does not read as stacked cards.

- [ ] **Step 4: Add responsive editorial styling and motion**

Use clamp-based typography, grid lines, transform/opacity reveals, hover/focus product movement, and a complete reduced-motion branch. At 320px, hero product composition becomes a contained stage and CTAs stack without horizontal overflow.

- [ ] **Step 5: Run contract, unit, check, and build commands**

Expected: all pass and the generated homepage contains no old hero contact panel or unsupported claim.

### Task 4: Searchable catalog and accessible event plan

**Files:**
- Create: `src/components/catalog/CatalogFilters.astro`
- Create: `src/components/catalog/ProductCard.astro`
- Create: `src/components/catalog/EventPackages.astro`
- Create: `src/components/catalog/QuoteDrawer.astro`
- Create: `src/pages/katalog.astro`
- Create: `src/scripts/catalog.js`
- Create: `src/styles/catalog.css`
- Extend: `tests/build-contract.test.mjs`

**Interfaces:**
- Product controls expose `data-product-id`, `data-product-name`, and `data-product-price`.
- Filterable products expose normalized `data-search`, `data-category`, and pipe-delimited `data-tags`.
- Package buttons expose JSON `{ id, qty }[]` using IDs resolved from event package names.
- Catalog script persists `{ version: 1, items: [{ id, qty }] }` under `hr-production:event-plan`.

- [ ] **Step 1: Add failing built-page assertions for all 84 IDs, filter controls, dialog semantics, and estimate disclaimer**

- [ ] **Step 2: Run contract test and confirm `/katalog` is missing**

- [ ] **Step 3: Server-render catalog, filters, packages, and drawer**

All products remain visible without JS. Search and filters progressively enhance the grid. The drawer includes an empty state, line items target, totals, clear action, and WhatsApp submit.

- [ ] **Step 4: Implement browser behavior using the tested domain modules**

Initialize filters from URLSearchParams, apply AND filtering, update result/category visibility, add packages/products, manage quantities, persist safely, trap focus while the drawer is modal, restore focus, announce updates, and generate encoded WhatsApp output.

- [ ] **Step 5: Add catalog-specific responsive styling**

Desktop uses a persistent utility rail plus non-obstructive drawer; mobile uses a sticky event-plan bar and full-height drawer. Product images retain intrinsic size and no action target is smaller than 44px.

- [ ] **Step 6: Run unit tests, Astro check, build, and contract tests**

Expected: 84 products render, interactions have stable IDs, and all automated checks pass.

### Task 5: High-intent solution pages and recovery route

**Files:**
- Create: `src/components/SolutionPage.astro`
- Create: `src/pages/event-corporate-pemerintah.astro`
- Create: `src/pages/exhibition-conference.astro`
- Create: `src/pages/wedding-gala.astro`
- Create: `src/pages/404.astro`
- Create: `src/styles/solution.css`
- Extend: `tests/build-contract.test.mjs`

**Interfaces:**
- `SolutionPage` props include `eyebrow`, `title`, `intro`, `needs`, `response`, `productIds`, `catalogQuery`, `schemaName`, and `schemaDescription`.
- Each route emits Service schema and breadcrumbs through `BaseLayout`.

- [ ] **Step 1: Add failing route, unique-title, canonical, breadcrumb, and Service-schema assertions**

- [ ] **Step 2: Run contract test and confirm all four routes are absent**

- [ ] **Step 3: Build the reusable solution narrative and three distinct routes**

Copy focuses on event risks, operational response, relevant inventory, what information to prepare, and a filtered catalog handoff. Avoid duplicated paragraphs and unverified claims.

- [ ] **Step 4: Build the 404 recovery route**

Offer homepage, catalog, and contextual WhatsApp paths with the same brand system.

- [ ] **Step 5: Run all automated checks**

Expected: six total public routes build successfully with unique metadata.

### Task 6: Final creative, conversion, engineering, and security pass

**Files:**
- Modify: any implementation file where the final audit finds an issue.
- Create: `scripts/audit-build.mjs`
- Create: `docs/release/awwwards-v2-qa.md`

**Interfaces:**
- `audit-build.mjs` exits non-zero for missing local assets, duplicate IDs, missing canonical/H1/description, unsupported claims, absent sitemap/robots, or fewer than 84 rendered catalog product IDs.

- [ ] **Step 1: Write and run the build audit**

Run: `node scripts/audit-build.mjs`
Expected: fail for every remaining contract gap, then pass only after each gap is corrected.

- [ ] **Step 2: Run the creative-director pass**

Check card repetition, spacing rhythm, hierarchy, hero memorability, mobile composition, CTA density, AI-slop language, and differentiation from RR Production. Record concrete corrections in the QA document and implement them.

- [ ] **Step 3: Run the conversion-director pass**

Check first-screen comprehension, proof quality, catalog discovery, event-plan friction, availability disclaimer, WhatsApp context, and final CTA clarity. Record and implement corrections.

- [ ] **Step 4: Run the engineering pass**

Run `npm run verify`, inspect built links/assets/IDs/metadata, scan console-affecting code, verify reduced-motion CSS, test 320/360/390/430/768/1024/1440 layout rules through static/computed checks where browser access allows, and record evidence.

- [ ] **Step 5: Scan the changed source for secrets**

Send only changed non-ignored source text/diffs to GitHub My AI Custom secret scanning. Expected: no detected credentials or tokens.

- [ ] **Step 6: Push structured commits and create the pull request**

Push all verified files to `redesign/awwwards-v2`. Open a non-draft PR into `main` with audit findings, architecture summary, test evidence, routes, known limitations, and deployment notes. Do not merge automatically.
