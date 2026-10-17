import fs from 'fs';
import zlib from 'zlib';

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function generateIconPNG(size, isMaskable = false) {
  const width = size;
  const height = size;

  // Each scanline: filter byte 0x00 + width * 4 (RGBA)
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(rowLength * height);

  const cx = width / 2;
  const cy = height / 2;
  const outerR = width * (isMaskable ? 0.38 : 0.44);
  const innerR = outerR * 0.88;
  const centerR = outerR * 0.55;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Base background: Slate-900 (#0F172A)
      let r = 15;
      let g = 23;
      let b = 42;
      let a = 255;

      // Outer gold ring
      if (dist <= outerR && dist >= innerR) {
        // Gold gradient #D97706 / #F59E0B / #FBBF24
        const factor = (y / height);
        r = Math.round(217 + factor * 35);
        g = Math.round(119 + factor * 60);
        b = Math.round(6 + factor * 30);
        a = 255;
      } else if (dist < innerR && dist > centerR) {
        // Deep luxury accent ring #1E293B
        r = 30;
        g = 41;
        b = 59;
        a = 255;
      } else if (dist <= centerR) {
        // Central core gold medallion
        const norm = 1 - (dist / centerR);
        r = Math.min(255, Math.round(245 + norm * 10));
        g = Math.min(255, Math.round(158 + norm * 40));
        b = Math.min(255, Math.round(11 + norm * 50));
        a = 255;

        // Embossed inner symbol (Wings / V shape)
        const relX = Math.abs(dx);
        const relY = dy;
        // Chevron / Wing shape:
        if (relY >= -centerR * 0.4 && relY <= centerR * 0.5) {
          const expectedY = relX * 0.85 - centerR * 0.2;
          if (Math.abs(relY - expectedY) < centerR * 0.15) {
            // Dark obsidian inlay
            r = 15;
            g = 23;
            b = 42;
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = createChunk('IDAT', deflated);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function generateSimpleScreenshot(w, h) {
  const rowLength = 1 + w * 4;
  const rawData = Buffer.alloc(rowLength * h);
  for (let y = 0; y < h; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0;
    for (let x = 0; x < w; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      // Elegant dark background with header banner
      if (y < h * 0.12) {
        rawData[pxOffset] = 15;
        rawData[pxOffset + 1] = 23;
        rawData[pxOffset + 2] = 42;
      } else if (y > h * 0.12 && y < h * 0.13) {
        rawData[pxOffset] = 217;
        rawData[pxOffset + 1] = 119;
        rawData[pxOffset + 2] = 6;
      } else {
        rawData[pxOffset] = 248;
        rawData[pxOffset + 1] = 250;
        rawData[pxOffset + 2] = 252;
      }
      rawData[pxOffset + 3] = 255;
    }
  }

  const deflated = zlib.deflateSync(rawData);
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(w, 0);
  ihdrData.writeUInt32BE(h, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', deflated);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

fs.writeFileSync('public/pwa-192x192.png', generateIconPNG(192));
fs.writeFileSync('public/pwa-maskable-192x192.png', generateIconPNG(192, true));
fs.writeFileSync('public/pwa-512x512.png', generateIconPNG(512));
fs.writeFileSync('public/pwa-maskable-512x512.png', generateIconPNG(512, true));
fs.writeFileSync('public/apple-touch-icon.png', generateIconPNG(180));
fs.writeFileSync('public/screenshot-mobile.png', generateSimpleScreenshot(540, 960));
fs.writeFileSync('public/screenshot-wide.png', generateSimpleScreenshot(1280, 720));

console.log('Successfully generated PWA icon and screenshot assets:');
console.log('- public/pwa-192x192.png');
console.log('- public/pwa-maskable-192x192.png');
console.log('- public/pwa-512x512.png');
console.log('- public/pwa-maskable-512x512.png');
console.log('- public/apple-touch-icon.png');
console.log('- public/screenshot-mobile.png');
console.log('- public/screenshot-wide.png');
