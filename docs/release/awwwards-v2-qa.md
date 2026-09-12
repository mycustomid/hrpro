# HR Production Awwwards V2 — Release QA

Date: 2026-09-12
Branch: `redesign/awwwards-v2`

## Delivered

- A new HR Production SVG wordmark, compact HR monogram, SVG favicon, web manifest, and social share image.
- Six static public routes: homepage, catalog, three focused event solutions, and a custom 404.
- A searchable 84-item catalog with separate category/use filters and URL-initialized filter state.
- A versioned, persistent event-plan builder with product/package addition, quantity controls, estimates, and encoded WhatsApp handoff.
- Canonical, Open Graph, Twitter, breadcrumb, Organization/LocalBusiness, and Service metadata.
- Sitemap, robots, reduced-motion treatment, skip link, focus states, semantic landmarks, and keyboard-operable navigation/drawer.

## Creative director pass

- Replaced the former dark-gold rounded-card language with the Operational Editorial system: bone, graphite, signal green, hard grid lines, oversized serif type, and product-cutout compositions.
- Varied section scale and density: sculptural hero, proof rail, narrative solution rows, asymmetric inventory edit, operational process, and high-contrast readiness block.
- Removed unsupported response-time and trust claims. Proof now comes from catalog breadth, categories, workflow, and real operational data.
- Kept low-resolution catalog imagery contained at intrinsic proportions instead of using it as full-bleed photography.

## Conversion director pass

- Primary journeys are visible in the first screen: request a quotation or browse the catalog.
- Catalog filters, result count, reset state, starter sets, estimate disclaimer, and mobile plan dock reduce planning friction.
- WhatsApp messages include line items, quantities, subtotals, total units, an initial estimate, and prompts for event type, date, and venue.
- Each solution page hands visitors to a relevant prefiltered catalog and ends with a context-specific brief prompt.

## Engineering evidence

The final release command is `npm run verify`, which runs:

1. Node unit tests for catalog normalization/filtering and quotation calculations/storage/message formatting.
2. Astro static/type checks.
3. Production build of all routes and sitemap.
4. Built-output route/metadata contracts.
5. Local link, asset, duplicate-ID, unsupported-claim, product-count, robots, sitemap, logo, and favicon audit.

Responsive CSS contains explicit layouts for 1120, 1040, 900, 840/820, 640/560/520, and reduced-motion conditions, covering the requested mobile-to-wide range without framework hydration. Local interactive browser preview was unavailable in the execution runtime because its network-interface discovery failed, so visual interaction remains a recommended pre-merge preview check in the repository host.

## Release notes

- Prices are presented as starting estimates. Availability, delivery, setup, and final pricing require event-date confirmation.
- No stock status, client logo, testimonial, response-time promise, or performance claim was invented.
- Deployment and DNS changes remain outside this branch.
