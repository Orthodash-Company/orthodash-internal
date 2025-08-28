const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Read the SVG file
const svgPath = path.join(__dirname, '../public/favicon.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

// Convert SVG to PNG
sharp(Buffer.from(svgContent))
  .resize(32, 32)
  .png()
  .toFile(path.join(__dirname, '../public/favicon.png'))
  .then(() => {
    console.log('✅ Favicon PNG generated successfully');
  })
  .catch((err) => {
    console.error('❌ Error generating favicon:', err);
  });
