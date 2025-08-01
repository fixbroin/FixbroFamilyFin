
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const YOUR_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'https://balance.fixbro.in';

const pages = [
  '/',
  '/login',
  '/signup',
  '/dashboard',
  '/individual',
  '/shopping',
  '/expenses',
  '/earnings',
  '/settings',
  '/notifications',
  '/join-family',
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages.map(page => {
    const route = page === '/' ? '' : page;
    const priority = page === '/' ? '1.0' : '0.8';
    const changefreq = page === '/' ? 'daily' : 'monthly';
    return `
  <url>
    <loc>${`${YOUR_DOMAIN}${route}`}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('')}
</urlset>`;

const publicPath = path.join(__dirname, 'public');
if (!fs.existsSync(publicPath)) {
  fs.mkdirSync(publicPath);
}

fs.writeFileSync(path.join(publicPath, 'sitemap.xml'), sitemap);

console.log('sitemap.xml generated successfully!');
