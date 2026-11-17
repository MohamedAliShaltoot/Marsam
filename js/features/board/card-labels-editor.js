import { el, empty } from '../../core/dom.js';
import { createIcon } from '../../ui/icon.js';
import { generateId } from '../../core/id.js';
import { CURATED_SWATCHES } from '../../ui/color-picker.js';

export function createLabelsEditor(initialLabels, onLabelsChange) {
  let labels = [...(initialLabels || [])];
  const container = el('div', { class: 'row-gap-sm', style: { 'flex-wrap': 'wrap' } });

  function render() {
    empty(container);
    for (const lbl of labels) {
      const chip = el('span', {
        class: 'card-label-chip',
        style: { 'background-color': lbl.color, cursor: 'pointer' },
        title: 'Click to remove',
        onClick: () => {
          labels = labels.filter((l) => l.id !== lbl.id);
          onLabelsChange(labels);
          render();
        }
      }, [lbl.name, ' ✕']);
      container.appendChild(chip);
    }
  }
  render();

  const newLabelInput = el('input', {
    class: 'form-input',
    placeholder: 'Label name...',
    style: { width: '130px', padding: '2px 6px' }
  });

  const addLabelBtn = el('button', {
    class: 'btn btn--outline btn--sm',
    onClick: () => {
      const name = newLabelInput.value.trim();
      if (!name) return;
      const color = CURATED_SWATCHES[Math.floor(Math.random() * 8)];
      labels = [...labels, { id: generateId(), name, color }];
      onLabelsChange(labels);
      newLabelInput.value = '';
      render();
    }
  }, [createIcon('plus'), 'Add']);

  return {
    wrapperEl: el('div', { class: 'row-gap-sm' }, [container, newLabelInput, addLabelBtn]),
    getLabels: () => labels
  };
}

