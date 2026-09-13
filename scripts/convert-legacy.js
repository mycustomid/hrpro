import fs from 'node:fs';

let html = fs.readFileSync('D:/code/HRpro-legacy/deploy-static/index.html', 'utf8');

// Replace title & favicon
html = html.replace(/<title>.*?<\/title>/i, '<title>HRproduction | Sewa Kursi, Tenda, Sofa & Perlengkapan Event</title>');
html = html.replace(/href="images\/brand\/favicon\.png"/g, 'href="/brand/hr-emblem.png"');

// Replace heading to match screenshot
html = html.replace(
  /<h3 class="title-w3-agileits title-black-wthree">Kursi, Tenda, dan Perlengkapan Favorit<\/h3>/,
  '<h3 class="title-w3-agileits title-black-wthree">SEMUA PERLENGKAPAN EVENT ADA DISINI</h3>'
);

// Replace CTA button to match screenshot (yellow button KATALOG LENGKAP)
html = html.replace(
  /<a href="https:\/\/ddos-spec\.github\.io\/hrpro\/" target="_blank" rel="noopener noreferrer" class="catalog-cta__link"><i class="fa fa-book" aria-hidden="true"><\/i> Lihat Katalog Lengkap<\/a>/,
  '<a href="/katalog.pdf" target="_blank" rel="noopener noreferrer" class="catalog-cta__link"><i class="fa fa-book" aria-hidden="true"></i> KATALOG LENGKAP</a>'
);

// Replace logo image with 3D gold emblem
html = html.replace(
  /<img src="images\/brand\/logo\.jpeg" alt="HRproduction" class="site-logo__image">/,
  '<img src="/brand/hr-emblem.png" alt="HRproduction" class="site-logo__image" style="width: 48px; height: 48px; object-fit: contain; border-radius: 50%;">'
);

// Update WhatsApp & Phone numbers to marketing official
html = html.replace(/6281381178127/g, '6281387927481');
html = html.replace(/\+62813-8117-8127/g, '+62 813-8792-7481');

// Root relative paths for CSS, JS, images
html = html.replace(/href="css\//g, 'href="/css/');
html = html.replace(/src="js\//g, 'src="/js/');
html = html.replace(/src="images\//g, 'src="/images/');
html = html.replace(/href="images\//g, 'href="/images/');

// Add is:inline to all script tags so Astro passes them through untouched
html = html.replace(/<script(?![^>]*is:inline)/g, '<script is:inline');

// Prepend Astro frontmatter
const astroContent = `---
// HRproduction Legacy Authentic Template (Screenshot Era)
---
${html}`;

fs.writeFileSync('src/pages/index.astro', astroContent, 'utf8');
console.log('Successfully generated src/pages/index.astro from legacy template!');
