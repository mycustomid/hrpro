export const site = {
  name: "HR Production",
  domain: "https://www.hrproduction.id",
  phone: "6281387927481",
  phoneDisplay: "+62 813-8792-7481",
  serviceArea: "Jakarta, Tangerang Selatan, Jabodetabek, Banten, dan Jawa Barat",
  description: "Konsultasi dan pemesanan rental furniture serta perlengkapan event untuk korporasi, pemerintah, konferensi, exhibition, gala, dan wedding.",
  socials: {
    instagram: "https://www.instagram.com/hrproduction/",
    facebook: "https://www.facebook.com/haryanto",
    tiktok: "https://www.tiktok.com/@hrproduction",
  },
  wa(message) { return `https://wa.me/${this.phone}?text=${encodeURIComponent(message)}`; },
};

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${site.domain}/#organization`,
  name: site.name,
  url: site.domain,
  logo: `${site.domain}/favicon.svg`,
  description: site.description,
  areaServed: ["Jakarta", "Tangerang Selatan", "Jabodetabek", "Banten", "Jawa Barat"],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: site.phoneDisplay,
    contactType: "sales",
    availableLanguage: ["id"],
    areaServed: "ID",
  },
  sameAs: Object.values(site.socials),
};
