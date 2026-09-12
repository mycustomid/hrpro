export const site = {
  name: "HR Production",
  domain: "https://www.hrproduction.id",
  phone: "6281381178127",
  phoneDisplay: "+62 813-8117-8127",
  email: "hrproduction202@gmail.com",
  address: "Jl. Beringin II RT 001/007, Pamulang Barat, Tangerang Selatan, Banten",
  serviceArea: "Jakarta, Tangerang Selatan, dan Jabodetabek",
  description: "Rental furniture dan perlengkapan event untuk korporasi, pemerintah, konferensi, exhibition, gala, dan wedding di Jabodetabek.",
  wa(message) { return `https://wa.me/${this.phone}?text=${encodeURIComponent(message)}`; },
};

export const organizationSchema = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": `${site.domain}/#organization`, name: site.name, url: site.domain, logo: `${site.domain}/favicon.svg`, email: site.email, telephone: site.phoneDisplay },
    { "@type": "LocalBusiness", "@id": `${site.domain}/#localbusiness`, name: site.name, url: site.domain, image: `${site.domain}/og-default.svg`, telephone: site.phoneDisplay, email: site.email, priceRange: "Rp", address: { "@type": "PostalAddress", streetAddress: "Jl. Beringin II RT 001/007", addressLocality: "Pamulang Barat", addressRegion: "Banten", addressCountry: "ID" }, areaServed: ["Jakarta", "Tangerang Selatan", "Jabodetabek"], parentOrganization: { "@id": `${site.domain}/#organization` } },
  ],
};
