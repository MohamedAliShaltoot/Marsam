import { renderBackgroundPattern } from './pattern-generator.js';

export class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.strokes = [];
    this.undoStack = [];
    this.background = { color: '#ffffff', pattern: 'grid', gap: 24 };

    this.currentTool = 'pen';
    this.currentColor = '#1d1c1a';
    this.currentSize = 3;
    this.scale = 1.0;
    this.isDrawing = false;
    this.activeStroke = null;

    this.resize();
  }

  resize() {
    if (!this.canvas.parentElement) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    this.render();
  }

  render() {
    const dpr = window.devicePixelRatio || 1;
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.scale(dpr * this.scale, dpr * this.scale);

    renderBackgroundPattern(this.ctx, this.width / this.scale, this.height / this.scale, this.background);

    for (const stroke of this.strokes) {
      this.drawStroke(stroke);
    }
    if (this.activeStroke) {
      this.drawStroke(this.activeStroke);
    }
    this.ctx.restore();
  }

  zoomIn() {
    this.scale = Math.min(3.0, Math.round((this.scale + 0.15) * 100) / 100);
    this.render();
    return this.scale;
  }

  zoomOut() {
    this.scale = Math.max(0.4, Math.round((this.scale - 0.15) * 100) / 100);
    this.render();
    return this.scale;
  }

  resetZoom() {
    this.scale = 1.0;
    this.render();
    return this.scale;
  }

  drawStroke(stroke) {
    if (!stroke || stroke.points.length === 0) return;
    const { tool, color, size, points } = stroke;
    this.ctx.save();
    this.ctx.strokeStyle = color;
    this.ctx.fillStyle = color;
    this.ctx.lineWidth = size;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    if (tool === 'highlighter') {
      this.ctx.globalAlpha = 0.35;
      this.ctx.lineWidth = size * 3;
    }

    if (tool === 'line') {
      const p1 = points[0];
      const p2 = points[points.length - 1];
      this.ctx.beginPath();
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);
      this.ctx.stroke();
    } else if (tool === 'rect') {
      const p1 = points[0];
      const p2 = points[points.length - 1];
      this.ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
    } else if (tool === 'ellipse') {
      const p1 = points[0];
      const p2 = points[points.length - 1];
      const rx = Math.abs(p2.x - p1.x) / 2;
      const ry = Math.abs(p2.y - p1.y) / 2;
      const cx = Math.min(p1.x, p2.x) + rx;
      const cy = Math.min(p1.y, p2.y) + ry;
      this.ctx.beginPath();
      this.ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      this.ctx.stroke();
    } else if (tool === 'arrow') {
      this.drawArrow(points[0], points[points.length - 1], size);
    } else {
      if (points.length < 2) {
        this.ctx.beginPath();
        this.ctx.arc(points[0].x, points[0].y, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length - 1; i++) {
          const xc = (points[i].x + points[i + 1].x) / 2;
          const yc = (points[i].y + points[i + 1].y) / 2;
          this.ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        this.ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        this.ctx.stroke();
      }
    }
    this.ctx.restore();
  }

  drawArrow(from, to, size) {
    const headLen = size * 3 + 8;
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(to.x, to.y);
    this.ctx.lineTo(to.x - headLen * Math.cos(angle - Math.PI / 6), to.y - headLen * Math.sin(angle - Math.PI / 6));
    this.ctx.lineTo(to.x - headLen * Math.cos(angle + Math.PI / 6), to.y - headLen * Math.sin(angle + Math.PI / 6));
    this.ctx.closePath();
    this.ctx.fill();
  }

  startStroke(x, y, pressure = 0.5) {
    const sx = x / this.scale;
    const sy = y / this.scale;
    if (this.currentTool === 'eraser') {
      this.eraseAtPoint(sx, sy);
      return;
    }
    this.isDrawing = true;
    this.activeStroke = {
      tool: this.currentTool,
      color: this.currentColor,
      size: this.currentSize * (0.6 + pressure * 0.8),
      opacity: 1,
      points: [{ x: sx, y: sy, pressure }]
    };
    this.render();
  }

  moveStroke(x, y, pressure = 0.5) {
    const sx = x / this.scale;
    const sy = y / this.scale;
    if (this.currentTool === 'eraser' && this.isDrawing) {
      this.eraseAtPoint(sx, sy);
      return;
    }
    if (!this.isDrawing || !this.activeStroke) return;
    this.activeStroke.points.push({ x: sx, y: sy, pressure });
    this.render();
  }

  endStroke() {
    if (this.activeStroke) {
      this.strokes.push(this.activeStroke);
      this.undoStack = [];
      this.activeStroke = null;
    }
    this.isDrawing = false;
    this.render();
  }

  eraseAtPoint(x, y) {
    this.isDrawing = true;
    const radius = this.currentSize * 4 + 10;
    const initialLen = this.strokes.length;
    this.strokes = this.strokes.filter((s) => {
      return !s.points.some((p) => Math.hypot(p.x - x, p.y - y) < radius);
    });
    if (this.strokes.length !== initialLen) {
      this.render();
    }
  }

  undo() {
    if (this.strokes.length === 0) return;
    this.undoStack.push(this.strokes.pop());
    this.render();
  }

  redo() {
    if (this.undoStack.length === 0) return;
    this.strokes.push(this.undoStack.pop());
    this.render();
  }

  clear() {
    this.strokes = [];
    this.undoStack = [];
    this.render();
  }

  exportPNG() {
    return this.canvas.toDataURL('image/png');
  }
}

