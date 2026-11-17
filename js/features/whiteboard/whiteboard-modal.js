import { el } from '../../core/dom.js';
import { openModal } from '../../ui/modal.js';
import { createIcon } from '../../ui/icon.js';
import { CanvasRenderer } from './canvas-renderer.js';
import { eventBus } from '../../core/event-bus.js';
import { drawingRepo } from '../../data/repositories/drawing-repo.js';
import { generateId } from '../../core/id.js';
import { CURATED_SWATCHES } from '../../ui/color-picker.js';
import { showToast } from '../../ui/toast.js';
import { openConfirmDialog } from '../../ui/confirm-dialog.js';

export async function openWhiteboardModal(projectId, drawingId = null) {
  let currentDrawing = drawingId ? await drawingRepo.getById(drawingId) : null;
  if (!currentDrawing) {
    const existing = await drawingRepo.getByProject(projectId);
    currentDrawing = existing[0] || {
      id: generateId(),
      projectId,
      name: 'Brainstorm Sketch 1',
      background: { color: '#ffffff', pattern: 'grid', gap: 24 },
      strokes: [],
      width: 1200,
      height: 800,
      updatedAt: Date.now()
    };
  }

  const canvas = el('canvas', { class: 'whiteboard-canvas' });
  const viewport = el('div', { class: 'whiteboard-viewport' }, [canvas]);
  const workspace = el('div', { class: 'whiteboard-workspace' }, [viewport]);

  let renderer = null;

  const tools = [
    { id: 'pen', icon: 'pen', title: 'Pen' },
    { id: 'highlighter', icon: 'edit', title: 'Highlighter' },
    { id: 'eraser', icon: 'eraser', title: 'Eraser' },
    { id: 'line', icon: 'line', title: 'Line' },
    { id: 'rect', icon: 'rect', title: 'Rectangle' },
    { id: 'circle', icon: 'circle', title: 'Ellipse' },
    { id: 'arrow', icon: 'arrow-right', title: 'Arrow' }
  ];

  const toolButtons = tools.map((t) => {
    return el('button', {
      class: `wb-tool-btn ${t.id === 'pen' ? 'is-active' : ''}`,
      title: t.title,
      onClick: (e) => {
        topToolbar.querySelectorAll('.wb-tool-btn').forEach((b) => b.classList.remove('is-active'));
        e.currentTarget.classList.add('is-active');
        if (renderer) renderer.currentTool = t.id === 'circle' ? 'ellipse' : t.id;
      }
    }, [createIcon(t.icon)]);
  });

  const undoBtn = el('button', {
    class: 'wb-tool-btn',
    title: 'Undo',
    onClick: () => renderer?.undo()
  }, [createIcon('undo')]);

  const redoBtn = el('button', {
    class: 'wb-tool-btn',
    title: 'Redo',
    onClick: () => renderer?.redo()
  }, [createIcon('redo')]);

  const clearBtn = el('button', {
    class: 'wb-tool-btn',
    title: 'Clear Canvas',
    onClick: () => {
      openConfirmDialog({
        title: 'Clear Canvas?',
        message: 'This will erase all drawing strokes on this whiteboard.',
        confirmText: 'Clear Canvas',
        onConfirm: () => renderer?.clear()
      });
    }
  }, [createIcon('trash')]);

  const exportBtn = el('button', {
    class: 'wb-tool-btn',
    title: 'Export PNG',
    onClick: () => {
      if (!renderer) return;
      const dataUrl = renderer.exportPNG();
      const a = el('a', { href: dataUrl, download: `${currentDrawing.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png` });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('PNG image exported with background.');
    }
  }, [createIcon('export')]);

  const topToolbar = el('div', { class: 'whiteboard-toolbar' }, [
    ...toolButtons,
    undoBtn,
    redoBtn,
    clearBtn,
    exportBtn
  ]);
  workspace.appendChild(topToolbar);

  const strokeSwatches = CURATED_SWATCHES.slice(0, 7).map((color) => {
    return el('button', {
      class: `color-swatch ${color === '#18181b' ? 'is-selected' : ''}`,
      style: { 'background-color': color },
      title: `Stroke color ${color}`,
      onClick: (e) => {
        bottomBar.querySelectorAll('.swatch-group--stroke .color-swatch').forEach((s) => s.classList.remove('is-selected'));
        e.currentTarget.classList.add('is-selected');
        if (renderer) renderer.currentColor = color;
        eventBus.emit('whiteboard:color');
      }
    });
  });

  const patternSelect = el('select', {
    class: 'form-input',
    style: { width: 'auto', padding: '2px 8px', 'font-size': 'var(--font-size-xs)' },
    onChange: (e) => {
      currentDrawing.background.pattern = e.target.value;
      if (renderer) {
        renderer.background.pattern = e.target.value;
        renderer.render();
      }
    }
  }, [
    el('option', { value: 'grid' }, 'Grid Pattern'),
    el('option', { value: 'dots' }, 'Dots Pattern'),
    el('option', { value: 'lines' }, 'Lines Pattern'),
    el('option', { value: 'none' }, 'Plain White')
  ]);
  patternSelect.value = currentDrawing.background.pattern || 'grid';

  const sizeSlider = el('input', {
    type: 'range',
    min: '1',
    max: '24',
    value: '3',
    class: 'size-slider',
    title: 'Stroke Size',
    onInput: (e) => {
      if (renderer) renderer.currentSize = Number(e.target.value);
    }
  });

  const bottomBar = el('div', { class: 'whiteboard-bottom-bar' }, [
    el('div', { class: 'swatch-group swatch-group--stroke' }, strokeSwatches),
    patternSelect,
    sizeSlider
  ]);
  workspace.appendChild(bottomBar);

  const zoomInBtn = el('button', {
    class: 'wb-zoom-btn',
    title: 'Zoom In (+)',
    onClick: () => {
      const s = renderer?.zoomIn() || 1;
      zoomLabel.textContent = `${Math.round(s * 100)}%`;
    }
  }, '+');

  const zoomLabel = el('span', {
    class: 'wb-zoom-label',
    title: 'Reset to 100%',
    style: { cursor: 'pointer' },
    onClick: () => {
      const s = renderer?.resetZoom() || 1;
      zoomLabel.textContent = '100%';
    }
  }, '100%');

  const zoomOutBtn = el('button', {
    class: 'wb-zoom-btn',
    title: 'Zoom Out (−)',
    onClick: () => {
      const s = renderer?.zoomOut() || 1;
      zoomLabel.textContent = `${Math.round(s * 100)}%`;
    }
  }, '−');

  const zoomSidebar = el('div', { class: 'whiteboard-zoom-sidebar' }, [
    zoomInBtn, zoomLabel, zoomOutBtn
  ]);
  workspace.appendChild(zoomSidebar);

  const modal = openModal({
    title: el('span', { class: 'row-gap-sm' }, [createIcon('draw'), currentDrawing.name]),
    content: workspace,
    size: 'full',
    onClose: async () => {
      if (renderer) {
        currentDrawing.strokes = renderer.strokes;
        currentDrawing.background = renderer.background;
        await drawingRepo.save(currentDrawing);
      }
    }
  });

  requestAnimationFrame(() => {
    renderer = new CanvasRenderer(canvas);
    renderer.strokes = currentDrawing.strokes || [];
    renderer.background = currentDrawing.background || { color: '#ffffff', pattern: 'grid', gap: 24 };
    renderer.render();

    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      if (renderer) {
        if (renderer.currentTool === 'eraser') eventBus.emit('whiteboard:eraser');
        else eventBus.emit('whiteboard:pen');
        renderer.startStroke(e.clientX - rect.left, e.clientY - rect.top, e.pressure);
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (!renderer.isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      renderer.moveStroke(e.clientX - rect.left, e.clientY - rect.top, e.pressure);
    });

    window.addEventListener('pointerup', () => {
      if (renderer.isDrawing) renderer.endStroke();
    });
  });
}

