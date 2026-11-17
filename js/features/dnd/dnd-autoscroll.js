export class AutoScroller {
  constructor() {
    this.edgeThreshold = 50;
    this.maxSpeed = 16;
    this.rafId = null;
    this.activeContainer = null;
    this.vx = 0;
    this.vy = 0;
  }

  update(x, y, horizontalScrollEl, verticalScrollEl) {
    this.vx = 0;
    this.vy = 0;

    if (horizontalScrollEl) {
      const hRect = horizontalScrollEl.getBoundingClientRect();
      if (x < hRect.left + this.edgeThreshold) {
        const factor = 1 - (x - hRect.left) / this.edgeThreshold;
        this.vx = -this.maxSpeed * Math.min(1, Math.max(0, factor));
      } else if (x > hRect.right - this.edgeThreshold) {
        const factor = 1 - (hRect.right - x) / this.edgeThreshold;
        this.vx = this.maxSpeed * Math.min(1, Math.max(0, factor));
      }
    }

    if (verticalScrollEl) {
      const vRect = verticalScrollEl.getBoundingClientRect();
      if (y < vRect.top + this.edgeThreshold) {
        const factor = 1 - (y - vRect.top) / this.edgeThreshold;
        this.vy = -this.maxSpeed * Math.min(1, Math.max(0, factor));
      } else if (y > vRect.bottom - this.edgeThreshold) {
        const factor = 1 - (vRect.bottom - y) / this.edgeThreshold;
        this.vy = this.maxSpeed * Math.min(1, Math.max(0, factor));
      }
    }

    this.horizontalContainer = horizontalScrollEl;
    this.verticalContainer = verticalScrollEl;

    if ((this.vx !== 0 || this.vy !== 0) && !this.rafId) {
      this.loop();
    }
  }

  loop() {
    if (this.vx !== 0 && this.horizontalContainer) {
      this.horizontalContainer.scrollLeft += this.vx;
    }
    if (this.vy !== 0 && this.verticalContainer) {
      this.verticalContainer.scrollTop += this.vy;
    }

    if (this.vx !== 0 || this.vy !== 0) {
      this.rafId = requestAnimationFrame(() => this.loop());
    } else {
      this.rafId = null;
    }
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.vx = 0;
    this.vy = 0;
  }
}

