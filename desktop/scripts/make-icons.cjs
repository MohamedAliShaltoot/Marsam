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

  await new Promise((r) => setTimeout(r, 400));

  const img = await win.webContents.capturePage();
  const png1024 = img.toPNG();
  fs.writeFileSync(path.join(__dirname, '../build/icon.png'), png1024);

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

    dir.writeUInt8(size >= 256 ? 0 : size, 0);
    dir.writeUInt8(size >= 256 ? 0 : size, 1);
    dir.writeUInt8(0, 2);
    dir.writeUInt8(0, 3);
    dir.writeUInt16LE(1, 4);
    dir.writeUInt16LE(32, 6);
    dir.writeUInt32LE(buffer.length, 8);
    dir.writeUInt32LE(currentOffset, 12);

    dirBuffers.push(dir);
    imageBuffers.push(buffer);
    currentOffset += buffer.length;
  }

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  return Buffer.concat([header, ...dirBuffers, ...imageBuffers]);
}

