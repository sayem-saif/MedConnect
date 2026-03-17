const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distPath, 'index.html');

console.log('🔧 Fixing absolute paths in dist/index.html...');

try {
  let html = fs.readFileSync(indexPath, 'utf8');
  
  // Fix favicon and asset paths
  html = html.replace(/href="\/favicon\.ico"/g, 'href="./favicon.ico"');
  html = html.replace(/src="\/_expo\//g, 'src="./_expo/');
  html = html.replace(/href="\/_expo\//g, 'href="./_expo/');
  
  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('✅ Successfully fixed paths to relative URLs');
  
  // Also create 404.html for SPA fallback (GitHub Pages, etc.)
  const notFoundPath = path.join(distPath, '404.html');
  fs.copyFileSync(indexPath, notFoundPath);
  console.log('✅ Created 404.html for SPA fallback');
  
} catch (error) {
  console.error('❌ Error fixing paths:', error.message);
  process.exit(1);
}
