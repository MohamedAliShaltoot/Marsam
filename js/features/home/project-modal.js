import { el } from '../../core/dom.js';
import { openModal } from '../../ui/modal.js';
import { createColorPicker } from '../../ui/color-picker.js';

export function openProjectModal({ project, onSave }) {
  let selectedBg = project?.background || '#6d4aff';

  const nameInput = el('input', {
    class: 'form-input',
    placeholder: 'e.g. Mobile App Redesign',
    value: project?.name || '',
    required: true
  });

  const descTextarea = el('textarea', {
    class: 'form-textarea',
    placeholder: 'Short summary or project objective...',
    rows: 3
  }, project?.description || '');

  const colorPickerContainer = createColorPicker({
    selectedColor: selectedBg,
    onSelect: (color) => { selectedBg = color; }
  });

  const content = el('div', {}, [
    el('div', { class: 'form-group' }, [
      el('label', { class: 'form-label' }, 'Project Name'),
      nameInput
    ]),
    el('div', { class: 'form-group' }, [
      el('label', { class: 'form-label' }, 'Description'),
      descTextarea
    ]),
    el('div', { class: 'form-group' }, [
      el('label', { class: 'form-label' }, 'Theme Accent / Color Tint'),
      colorPickerContainer
    ])
  ]);

  const saveBtn = el('button', {
    class: 'btn btn--primary',
    onClick: () => {
      const name = nameInput.value.trim();
      if (!name) {
        nameInput.focus();
        return;
      }
      modal.close();
      onSave({
        name,
        description: descTextarea.value.trim(),
        background: selectedBg
      });
    }
  }, project ? 'Save Changes' : 'Create Project');

  const cancelBtn = el('button', {
    class: 'btn btn--ghost',
    onClick: () => modal.close()
  }, 'Cancel');

  const modal = openModal({
    title: project ? 'Edit Project' : 'Create New Project',
    content,
    footer: [cancelBtn, saveBtn]
  });
}

