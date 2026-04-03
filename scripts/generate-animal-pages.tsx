/**
 * Pre-renders static HTML landing pages for each animal at /animals/{id}/index.html.
 * Uses React's renderToStaticMarkup so the pages share the AnimalLandingPage component.
 * Run as part of the build: tsx scripts/generate-animal-pages.tsx
 */

import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { animals } from '../src/data/animals.ts';
import { AnimalLandingPage } from '../src/pages/AnimalLandingPage.tsx';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const BASE_URL = 'https://animalpenpals.tech';

console.log(`Generating landing pages for ${animals.length} animals...`);

for (const animal of animals) {
  const html = '<!doctype html>' + renderToStaticMarkup(
    createElement(AnimalLandingPage, { animal })
  );

  const dir = join(root, 'public/animals', animal.id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
  console.log(`  ✓ /animals/${animal.id}/`);
}

// Update sitemap with animal pages
const sitemapUrls = [
  { loc: BASE_URL, priority: '1.0' },
  ...animals.map(a => ({ loc: `${BASE_URL}/animals/${a.id}`, priority: '0.8' })),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>weekly</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

writeFileSync(join(root, 'public/sitemap.xml'), sitemap);
console.log(`  ✓ sitemap.xml (${sitemapUrls.length} URLs)`);
console.log('Done!');
