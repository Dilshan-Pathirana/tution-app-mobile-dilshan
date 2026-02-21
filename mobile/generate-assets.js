// Script to generate simple placeholder asset images for the Expo app
// Run with: node generate-assets.js

const fs = require('fs');
const path = require('path');

// Simple 1x1 pixel PNG (transparent) as a minimal placeholder
// In production, replace these with actual designed icons
function createMinimalPng(width, height, r, g, b) {
  // Create a simple BMP-like structure, but we'll use a simpler approach
  // Generate a simple colored PNG using raw binary data
  
  // For now, create a simple HTML file that can be used to generate icons
  return null;
}

// Create a simple SVG icon and save as a reference
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" rx="200" fill="#4F46E5"/>
  <text x="512" y="600" text-anchor="middle" fill="white" font-size="500" font-family="Arial, sans-serif" font-weight="bold">TB</text>
</svg>`;

const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1284" height="2778" viewBox="0 0 1284 2778">
  <rect width="1284" height="2778" fill="#4F46E5"/>
  <text x="642" y="1300" text-anchor="middle" fill="white" font-size="120" font-family="Arial, sans-serif" font-weight="bold">TutorBooking</text>
  <text x="642" y="1450" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="48" font-family="Arial, sans-serif">Find the best tuition classes</text>
</svg>`;

const assetsDir = path.join(__dirname, 'assets');

// Save SVG references
fs.writeFileSync(path.join(assetsDir, 'icon.svg'), iconSvg);
fs.writeFileSync(path.join(assetsDir, 'splash.svg'), splashSvg);

console.log('SVG asset references created in assets/');
console.log('');
console.log('To generate PNG files from these SVGs, you can:');
console.log('1. Open them in a browser and screenshot');
console.log('2. Use an online SVG-to-PNG converter');
console.log('3. Use a tool like sharp: npm install sharp');
console.log('');
console.log('Required PNG files:');
console.log('  assets/icon.png         - 1024x1024 (app icon)');
console.log('  assets/adaptive-icon.png - 1024x1024 (Android adaptive icon)');
console.log('  assets/splash-icon.png  - 200x200 (splash screen icon)');
console.log('  assets/favicon.png      - 48x48 (web favicon)');
