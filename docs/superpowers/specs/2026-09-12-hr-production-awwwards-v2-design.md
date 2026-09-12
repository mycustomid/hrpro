# HR Production Awwwards V2 — Design Specification

Date: 2026-09-12  
Target branch: `redesign/awwwards-v2`  
Target domain: `https://hrproduction.id`

## 1. Objective

Rebuild HR Production as an editorial, industrial event-infrastructure brand that communicates operational capability before product rental. The site must feel distinctive and art-directed while remaining fast, accessible, easy to operate, and effective at generating qualified WhatsApp quotation requests.

The core positioning is: **HR Production is the infrastructure behind serious events.**

The primary audience is corporate procurement, BUMN and government teams, event organizers, exhibition teams, protocol teams, wedding organizers, and decision-makers planning medium-to-large events in Jabodetabek.

## 2. Audit Baseline

The current repository is Astro 5, static-first, and builds successfully. It contains 84 catalog entries across Sofa, Meja, Kursi, and Perlengkapan, 84 matching product images, four event packages, one homepage, and a working client-side quotation cart.

Problems to solve:

- The site is concentrated in one large page and one large stylesheet.
- The dark-gold visual system, rounded cards, gradients, and contact panel in the hero feel generic and contradict the intended art direction.
- The homepage moves too quickly from hero to package cards and full catalog; it does not establish operational authority or a clear narrative.
- Claims such as sub-one-hour response and broad trust statements are not supported by repository evidence and must be removed or reframed.
- Catalog filtering combines category and use-case into one chip group and does not persist the event plan.
- Duplicate display names cause cart identity collisions.
- SEO lacks canonical, Open Graph, Twitter metadata, robots, sitemap, and structured data.
- There are no focused landing pages for high-intent event solutions.
- Product images are low-resolution, but consistent cutouts; the design must use them deliberately rather than enlarge them beyond their useful quality.

RR Production is strong in catalog breadth, dimensional product detail, multiple warehouse/contact signals, and direct WhatsApp access. It is weak in hierarchy, copy quality, scanability, product discovery, and quotation flow. HR Production will not copy its layout, branding, imagery, or copy.

## 3. Chosen Direction: Operational Editorial System

### Visual language

- **Base:** warm bone and paper tones for clarity and editorial confidence.
- **Ink:** near-black graphite for strong contrast and an industrial feel.
- **Signal:** a controlled acid/signal green used for actions, active states, and operational markers.
- **Secondary:** muted steel and utility orange only where status or wayfinding needs it.
- **Grid:** visible architectural lines, oversized indices, hard edges, intentional asymmetry, and variable section rhythm.
- **Imagery:** existing product cutouts arranged as sculptural inventory compositions with restrained shadows, crop masks, rails, and typographic overlays.
- **Shape:** minimal rounding; cards are not the default container.
- **Type:** an editorial serif for display statements paired with a compact grotesk/sans for interface and operational information. Fonts must be loaded with display swap and limited weights.

The design must avoid glassmorphism, purple-blue gradients, floating blobs, dark-gold luxury, generic icon grids, repeated pill badges, excessive card grids, and decorative motion with no information value.

### Brand mark

Create a recognizable monochrome SVG system:

- horizontal wordmark for navigation and footer;
- compact `HR` industrial monogram for favicon and small surfaces;
- SVG favicon plus web manifest icons where appropriate.

The mark should retain the HR Production name and not imply a different business.

## 4. Information Architecture

### Global routes

1. `/` — flagship brand and conversion homepage.
2. `/katalog` — complete searchable quotation builder.
3. `/event-corporate-pemerintah` — corporate, BUMN, government, and protocol solution page.
4. `/exhibition-conference` — exhibition, expo, seminar, and conference solution page.
5. `/wedding-gala` — wedding, gala dinner, and hospitality solution page.
6. `/404` or Astro custom 404 — useful recovery path back to catalog and WhatsApp.

These three solution pages consolidate adjacent search intent to avoid thin pages. Individual category pages such as `/sewa-sofa-event` are deferred until HR Production has enough unique copy, specifications, and imagery to justify them.

### Homepage flow

1. **Navigation:** clear positioning, route links, event-plan count, and primary “Minta Penawaran” action.
2. **Hero:** memorable positioning, service scope, Jabodetabek coverage, two CTAs, and an actual-product inventory composition. No address/email panel.
3. **Proof rail:** only verifiable facts—84 catalog references, four inventory categories, formal event use cases, quotation builder, invoice/tax readiness where existing business data supports it.
4. **Event solutions:** three large editorial chapters with audience-specific operational needs and links to focused pages.
5. **Selected inventory:** a curated, asymmetric showroom using representative actual products rather than immediately rendering all 84 items.
6. **Operational process:** Brief → Recommendation → Availability → Quotation → Preparation → Delivery & Setup → Pickup.
7. **Readiness system:** cleaning, checking, preparation, loading, delivery, documentation, invoice, and tax administration. Copy describes process rather than making unsupported superiority claims.
8. **Quotation bridge:** explain how to build a plan, then link into the catalog with contextual filters.
9. **Final CTA:** event-specific prompt that reduces friction by telling users what information to send.
10. **Footer:** company information, service area, route links, PDF catalog, contact details, and legal/metadata links where available.

## 5. Catalog and Quotation Experience

The `/katalog` route is a professional event-plan builder, not a decorative product wall.

### Discovery

- Text search across normalized product name, description, category, and tags.
- Separate category and event-use controls.
- Active-filter summary, result count, and one-action reset.
- URL query parameters for category/use-case links from the homepage and solution pages.
- Product grid remains server-rendered for no-JS discovery and SEO.
- Images use fixed intrinsic dimensions, lazy loading below the fold, decoding hints, and low-resolution-safe containment.

### Product identity and data presentation

- Introduce a stable `id` for each catalog entry so duplicate names do not collide in the event plan.
- Preserve the existing product records, price, image, tags, and operational data.
- Normalize visible capitalization and obvious spelling errors in the presentation/data layer.
- Keep legitimately different image variants as separate products and give them distinct display names.
- Price language states that totals are estimates and final availability/logistics require confirmation.

### Event plan

- Add product with immediate accessible feedback.
- Increment, decrement, remove, and clear items.
- Show line subtotal, total units, and total estimate.
- Persist selections to versioned `localStorage`; corrupt or obsolete data fails safely to an empty plan.
- Mobile uses a sticky compact summary; desktop uses a non-obstructive drawer/panel.
- Drawer is keyboard operable, Escape closes it, focus is managed, background is non-interactive while modal behavior is active, and status updates use a restrained live region.
- WhatsApp message includes products, quantities, subtotals, estimate, and explicit prompts for event date, venue, and event type.
- Message content is passed through `encodeURIComponent`; links open with safe `noopener` behavior.

No fake stock availability status is shown. Availability is described as requiring date confirmation.

## 6. Component and Code Architecture

Keep Astro static-first and dependency-light.

### Core structure

- `src/layouts/BaseLayout.astro` — metadata, canonical, fonts, schema slots, header/footer shell.
- `src/components/brand/` — logo and visual identity components.
- `src/components/global/` — header, mobile navigation, footer, skip link, and CTA primitives.
- `src/components/home/` — hero, proof rail, solutions, selected inventory, process, readiness, and final CTA.
- `src/components/catalog/` — filter controls, product card, product grid, event-plan drawer, and no-results state.
- `src/components/solutions/` — reusable solution-page sections.
- `src/lib/catalog.ts` — normalization, stable identity, filtering metadata, packages, and formatting utilities.
- `src/scripts/catalog.ts` — scoped client interaction for filtering and the event plan.
- `src/styles/` — tokens, base, layout, components, and route-level styles with a small global entrypoint.
- `src/pages/` — thin route composition only.
- `public/` — brand SVGs, manifest, robots where not generated, existing product assets, and PDF catalog.

No React SPA and no heavy animation dependency. Client JavaScript is limited to navigation, filtering, event-plan persistence, drawer behavior, and progressive reveal.

## 7. Motion and Interaction

- CSS-first entrance masks and staggered reveals triggered once with `IntersectionObserver`.
- Subtle product displacement and crop changes on hover/focus.
- Lightweight marquee/operational rail only if it remains readable and pauses appropriately.
- Navigation transition and event-plan microfeedback communicate state change.
- Pointer-reactive effects are optional and enabled only for precise pointers; they must not be required for comprehension.
- No scroll hijacking, continuous expensive animation, or layout-bound JS loops.
- `prefers-reduced-motion: reduce` disables nonessential movement and smooth scrolling.

## 8. SEO and Structured Data

Each route receives a unique title, natural Indonesian description, canonical URL, Open Graph metadata, Twitter metadata, and share image fallback generated from brand assets if no event photography is available.

Add:

- `@astrojs/sitemap` or a deterministic static sitemap solution compatible with the current deployment;
- `robots.txt` pointing to the sitemap;
- Organization and LocalBusiness JSON-LD on the homepage using only verified contact/address data;
- Service schema on solution pages;
- Product schema only where data is sufficient and without claiming stock availability;
- breadcrumb markup/schema on internal pages;
- semantic heading hierarchy and internal links connecting solutions to filtered catalog states.

Keyword targets are distributed by intent, not repeated mechanically. The homepage covers event rental/production in Jabodetabek; solution routes cover corporate/government, exhibition/conference, and wedding/gala intent; the catalog naturally covers sofa, chair, table, VIP, and equipment terms.

## 9. Accessibility

- Semantic landmarks and one H1 per route.
- Skip link, visible focus states, minimum practical touch targets, and full keyboard access.
- Accessible mobile navigation and modal/drawer naming.
- Meaningful product alt text; decorative compositions use empty alt or are hidden from assistive technology.
- Color contrast meets WCAG AA for normal text and essential controls.
- Filter state is exposed through pressed/selected semantics.
- Form/search controls have persistent labels, not placeholder-only identification.
- No content or action is hover-only.
- No horizontal overflow at 320, 360, 390, 430, tablet, desktop, or large desktop widths.

## 10. Performance

- Preserve Astro static rendering and avoid hydration frameworks.
- Set explicit image width/height and stable aspect ratios to prevent CLS.
- Preload only the critical display font and hero product assets proven necessary.
- Lazy-load below-fold images and keep the first viewport dependency-light.
- Avoid high-resolution upscaling of source product images.
- Use transform/opacity-only animation where possible.
- Split client code by route or load only on catalog pages.
- Ensure the 6.4 MB PDF is never preloaded.

## 11. Error Handling and Progressive Enhancement

- Missing product images fall back to a branded inventory placeholder without breaking layout.
- Invalid catalog fields are caught by build-time validation tests.
- A no-JS visitor can browse products, prices, routes, contact information, and direct WhatsApp CTAs; advanced filters and the event plan progressively enhance the page.
- Invalid query filters fall back to “all products.”
- Invalid persisted cart data is discarded without throwing visible errors.
- Empty search results provide reset and WhatsApp alternatives.
- The 404 page offers links to homepage, catalog, and quotation contact.

## 12. Testing and Verification

### Automated contracts

- Catalog schema, unique IDs, valid positive prices, allowed categories/tags, and existing image paths.
- Event package references resolve to stable product IDs/names.
- Required metadata exists on every built HTML route.
- Generated HTML has no duplicate IDs and all local linked assets resolve.
- WhatsApp formatter produces deterministic encoded content.
- Event-plan calculation and persistence parsing are unit-tested as pure functions.

### Build and quality checks

- `npm ci`
- `npm test`
- `npm run build`
- any lint/check command added to the repository
- secret scan on new text/code before push

### Manual QA matrix

- 320, 360, 390, 430, 768, 1024, 1440, and wide desktop.
- Keyboard navigation, Escape handling, focus return, reduced motion, no-JS browsing, filtering, quantity changes, persistence, package addition, and WhatsApp output.
- Console errors, missing assets, broken imports, broken links, overflow, image cropping, and content hierarchy.

## 13. Delivery Workflow

Work occurs only on `redesign/awwwards-v2` with structured commits:

1. design system and architecture;
2. homepage brand experience;
3. catalog and quotation flow;
4. solution pages and SEO;
5. responsive, accessibility, and performance fixes;
6. final QA and release documentation.

Create a pull request into `main` after the build and final QA pass. Do not merge it automatically.

## 14. Acceptance Criteria

The work is complete when:

- the visual identity is recognizably HR Production and not a template or RR Production imitation;
- homepage, catalog, three solution routes, and recovery route are production-ready;
- all 84 existing inventory records remain represented after normalization;
- search, category filter, use-case filter, quantities, totals, persistence, and WhatsApp submission work;
- desktop and mobile layouts are complete with no obvious overflow;
- reduced-motion and keyboard experiences work;
- metadata, canonical, sitemap, robots, and appropriate structured data are present;
- builds and automated checks pass;
- no obvious broken asset, console error, duplicate ID, or unsupported business claim remains;
- the final creative, conversion, and engineering review passes;
- commits are pushed to `redesign/awwwards-v2` and a PR is opened against `main`.

## 15. Explicit Non-Goals

- No online payment or checkout.
- No real-time inventory availability without a verified backend source.
- No CMS or admin dashboard in this phase.
- No fabricated client logos, testimonials, project counts, scarcity, or delivery promises.
- No deployment or DNS changes; Vercel and Cloudflare remain the owner’s responsibility.

