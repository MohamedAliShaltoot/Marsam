export function renderBackgroundPattern(ctx, width, height, bg) {
  const { color, pattern = 'none', gap = 24 } = bg || {};

  ctx.save();
  ctx.fillStyle = color || '#ffffff';
  ctx.fillRect(0, 0, width, height);

  if (pattern === 'none' || !pattern) {
    ctx.restore();
    return;
  }

  const isDarkBg = isColorDark(color || '#ffffff');
  const strokeStyle = isDarkBg ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';

  ctx.strokeStyle = strokeStyle;
  ctx.fillStyle = strokeStyle;
  ctx.lineWidth = 1;

  if (pattern === 'lines') {
    ctx.beginPath();
    for (let y = gap; y < height; y += gap) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  } else if (pattern === 'grid') {
    ctx.beginPath();
    for (let x = gap; x < width; x += gap) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = gap; y < height; y += gap) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  } else if (pattern === 'dots') {
    for (let x = gap; x < width; x += gap) {
      for (let y = gap; y < height; y += gap) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

export function isColorDark(hex) {
  if (!hex || !hex.startsWith('#')) return false;
  const c = hex.slice(1);
  const rgb = parseInt(c.length === 3 ? c.split('').map((x) => x + x).join('') : c, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
}

