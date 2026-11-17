/**
 * Keyboard Shortcuts Guide Modal
 */
import { el } from '../../core/dom.js';
import { openModal } from '../../ui/modal.js';
import { createIcon } from '../../ui/icon.js';

export function openShortcutsModal() {
  const shortcuts = [
    { key: '/', desc: 'Focus live search bar' },
    { key: 'N', desc: 'Create new card in the first list' },
    { key: 'T', desc: 'Toggle Dark / Light theme' },
    { key: 'W', desc: 'Open Whiteboard sketch workspace' },
    { key: 'M', desc: 'Toggle sound effects mute' },
    { key: 'Ctrl + Z', desc: 'Undo last card / list action' },
    { key: 'Ctrl + Y / Shift+Z', desc: 'Redo previously undone action' },
    { key: '.', desc: 'Open radial reaction menu on focused card' },
    { key: 'Esc', desc: 'Close dialogs, menus, or radial overlay' },
    { key: '?', desc: 'Show this keyboard shortcuts guide' }
  ];

  const rows = shortcuts.map((s) => {
    return el('div', {
      class: 'row-gap-md',
      style: { 'justify-content': 'space-between', 'padding-block': 'var(--space-2)', 'border-bottom': '1px solid var(--border-subtle)' }
    }, [
      el('span', { style: { 'font-size': 'var(--font-size-sm)', color: 'var(--text-secondary)' } }, s.desc),
      el('kbd', {
        style: {
          padding: '2px 8px',
          background: 'var(--bg-surface-sunken)',
          border: '1px solid var(--border-strong)',
          'border-radius': 'var(--radius-xs)',
          'font-family': 'var(--font-mono)',
          'font-size': 'var(--font-size-xs)',
          'font-weight': '600'
        }
      }, s.key)
    ]);
  });

  openModal({
    title: el('span', { class: 'row-gap-sm' }, [createIcon('help'), 'Keyboard Shortcuts']),
    content: el('div', { class: 'stack-xs' }, rows)
  });
}
