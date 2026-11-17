/**
 * Procedural Seamless Fabric & Ink Noise Texture Generator
 * Generates lightweight seamless woven cloth and ink noise tiles once on offscreen canvas.
 */

/**
 * Creates a seamless woven linen/cloth tile data URL
 * @param {'light'|'dark'} theme
 * @returns {string} Data URL of the generated seamless tile
 */
export function generateFabricTile(theme = 'light') {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const isDark = theme === 'dark';
  ctx.fillStyle = isDark ? '#161719' : '#e8e6e1';
  ctx.fillRect(0, 0, size, size);

  const threadStep = 4;
  const warpColor = isDark ? 'rgba(255, 255, 255, 0.025)' : 'rgba(0, 0, 0, 0.035)';
  const weftColor = isDark ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.25)';
  const shadowColor = isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(40, 30, 20, 0.06)';

  // Weave warp threads (vertical)
  for (let x = 0; x < size; x += threadStep) {
    ctx.fillStyle = (x / threadStep) % 2 === 0 ? warpColor : shadowColor;
    ctx.fillRect(x, 0, 2, size);
  }

  // Weave weft threads (horizontal)
  for (let y = 0; y < size; y += threadStep) {
    ctx.fillStyle = (y / threadStep) % 2 === 0 ? weftColor : shadowColor;
    ctx.fillRect(0, y, size, 2);
  }

  // Micro-weave cross stitches
  for (let x = 0; x < size; x += threadStep * 2) {
    for (let y = 0; y < size; y += threadStep * 2) {
      const offset = ((x + y) / (threadStep * 2)) % 2 === 0;
      ctx.fillStyle = offset ? warpColor : weftColor;
      ctx.fillRect(x + 1, y + 1, 2, 2);
    }
  }

  // Subtle organic fiber noise
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * (isDark ? 8 : 12);
    data[i] = Math.min(255, Math.max(0, data[i] + grain));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain));
  }
  ctx.putImageData(imgData, 0, 0);

  return canvas.toDataURL('image/png');
}

/**
 * Creates an ink noise texture tile data URL for screen-printed content
 * @returns {string} Data URL
 */
export function generateInkNoiseTile() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = Math.floor(Math.random() * 40);
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Initializes fabric and ink textures into CSS custom properties
 * @param {'light'|'dark'} theme
 */
export function applyFabricTextures(theme = 'light') {
  const fabricDataUrl = generateFabricTile(theme);
  const inkDataUrl = generateInkNoiseTile();

  document.documentElement.style.setProperty('--fabric-tile', `url("${fabricDataUrl}")`);
  document.documentElement.style.setProperty('--ink-tile', `url("${inkDataUrl}")`);
}
