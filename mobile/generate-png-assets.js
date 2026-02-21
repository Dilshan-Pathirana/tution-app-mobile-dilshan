const sharp = require('sharp');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');

async function generate() {
  const iconSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" rx="200" fill="#4F46E5"/>
  <text x="512" y="620" text-anchor="middle" fill="white" font-size="480" font-family="Arial, sans-serif" font-weight="bold">TB</text>
</svg>`);

  const splashIconSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" rx="40" fill="#4F46E5"/>
  <text x="100" y="125" text-anchor="middle" fill="white" font-size="96" font-family="Arial, sans-serif" font-weight="bold">TB</text>
</svg>`);

  const faviconSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <rect width="48" height="48" rx="10" fill="#4F46E5"/>
  <text x="24" y="32" text-anchor="middle" fill="white" font-size="24" font-family="Arial, sans-serif" font-weight="bold">TB</text>
</svg>`);

  // icon.png - 1024x1024
  await sharp(iconSvg).resize(1024, 1024).png().toFile(path.join(assetsDir, 'icon.png'));
  console.log('Created icon.png (1024x1024)');

  // adaptive-icon.png - 1024x1024
  await sharp(iconSvg).resize(1024, 1024).png().toFile(path.join(assetsDir, 'adaptive-icon.png'));
  console.log('Created adaptive-icon.png (1024x1024)');

  // splash-icon.png - 200x200
  await sharp(splashIconSvg).resize(200, 200).png().toFile(path.join(assetsDir, 'splash-icon.png'));
  console.log('Created splash-icon.png (200x200)');

  // favicon.png - 48x48
  await sharp(faviconSvg).resize(48, 48).png().toFile(path.join(assetsDir, 'favicon.png'));
  console.log('Created favicon.png (48x48)');

  console.log('\nAll assets generated!');
}

generate().catch(console.error);
