const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distPath, 'index.html');
const redirectsPath = path.join(distPath, '_redirects');
const headersPath = path.join(distPath, '_headers');

console.log('Fixing static export paths in dist/index.html...');

try {
  let html = fs.readFileSync(indexPath, 'utf8');
  
  // Fix favicon and asset paths
  html = html.replace(/href="\/favicon\.ico"/g, 'href="./favicon.ico"');
  html = html.replace(/src="\/_expo\//g, 'src="./_expo/');
  html = html.replace(/href="\/_expo\//g, 'href="./_expo/');
  
  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('Successfully fixed paths to relative URLs');
  
  // Create 404.html for SPA fallback (GitHub Pages and similar hosts).
  const notFoundPath = path.join(distPath, '404.html');
  fs.copyFileSync(indexPath, notFoundPath);
  console.log('Created 404.html for SPA fallback');

  // Cloudflare Pages SPA fallback routing.
  fs.writeFileSync(redirectsPath, '/* /index.html 200\n', 'utf8');
  console.log('Created _redirects for Cloudflare Pages route handling');

  // Basic security and caching headers for Cloudflare Pages.
  const headers = [
    '/*',
    '  X-Frame-Options: DENY',
    '  X-Content-Type-Options: nosniff',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    '',
    '/_expo/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
  ].join('\n');
  fs.writeFileSync(headersPath, headers, 'utf8');
  console.log('Created _headers for Cloudflare Pages');
  
} catch (error) {
  console.error('Error fixing paths:', error.message);
  process.exit(1);
}
