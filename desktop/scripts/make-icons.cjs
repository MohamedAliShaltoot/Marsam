/**
 * Pixel-Perfect Icon Generator for Boardly Desktop
 * Uses Chromium offscreen rendering to render build/icon.svg to 1024x1024 PNG and multi-size ICO
 */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1024,
    height: 1024,
    show: false,
    webPreferences: { offscreen: true }
  });

  const svgPath = path.join(__dirname, '../build/icon.svg').replace(/\\/g, '/');
  await win.loadURL(`file:///${svgPath}`);

  // Wait a moment for SVG filters/gradients to render
  await new Promise((r) => setTimeout(r, 400));

  const img = await win.webContents.capturePage();
  const png1024 = img.toPNG();
  fs.writeFileSync(path.join(__dirname, '../build/icon.png'), png1024);

  // Generate multi-resolution ICO for Windows (16, 24, 32, 48, 64, 128, 256)
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const entries = sizes.map((size) => ({
    size,
    buffer: img.resize({ width: size, height: size, quality: 'best' }).toPNG()
  }));

  const icoBuffer = packIco(entries);
  fs.writeFileSync(path.join(__dirname, '../build/icon.ico'), icoBuffer);

  console.log(`Successfully generated icon.png (${png1024.length} bytes) and icon.ico (${icoBuffer.length} bytes).`);
  app.exit(0);
});

function packIco(entries) {
  const count = entries.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const totalHeaderSize = headerSize + count * dirEntrySize;

  let currentOffset = totalHeaderSize;
  const dirBuffers = [];
  const imageBuffers = [];

  for (const entry of entries) {
    const { size, buffer } = entry;
    const dir = Buffer.alloc(dirEntrySize);

    dir.writeUInt8(size >= 256 ? 0 : size, 0); // Width
    dir.writeUInt8(size >= 256 ? 0 : size, 1); // Height
    dir.writeUInt8(0, 2);                      // Color palette
    dir.writeUInt8(0, 3);                      // Reserved
    dir.writeUInt16LE(1, 4);                   // Color planes
    dir.writeUInt16LE(32, 6);                  // Bits per pixel
    dir.writeUInt32LE(buffer.length, 8);       // Image data size
    dir.writeUInt32LE(currentOffset, 12);      // Image data offset

    dirBuffers.push(dir);
    imageBuffers.push(buffer);
    currentOffset += buffer.length;
  }

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(count, 4); // Number of images

  return Buffer.concat([header, ...dirBuffers, ...imageBuffers]);
}
