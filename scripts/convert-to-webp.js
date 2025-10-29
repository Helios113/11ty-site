#!/usr/bin/env node

const sharp = require('sharp');
const path = require('path');

const inputPath = path.resolve(__dirname, '../src/IMG_1501.png');
const outputPath = path.resolve(__dirname, '../src/IMG_1501.webp');

sharp(inputPath)
  .webp({ quality: 85 })
  .toFile(outputPath)
  .then(() => {
    console.log('✅ Successfully converted IMG_1501.png to IMG_1501.webp');
  })
  .catch(err => {
    console.error('❌ Error converting image:', err);
    process.exit(1);
  });
