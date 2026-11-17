/**
 * Positioned Dropdown Menu Component
 */
import { el } from '../core/dom.js';
import { createIcon } from './icon.js';

let activeDropdown = null;

/**
 * @typedef {Object} DropdownItem
 * @property {string} label
 * @property {string} [icon]
 * @property {boolean} [danger]
 * @property {() => void} onClick
 */

/**
 * Opens a dropdown attached to a trigger element
 * @param {{ anchorEl: HTMLElement, items: DropdownItem[], onClose?: () => void }} options
 */
export function openDropdown({ anchorEl, items, onClose }) {
  if (activeDropdown) {
    activeDropdown.close();
  }

  const rect = anchorEl.getBoundingClientRect();
  const menu = el('div', { class: 'dropdown-menu', role: 'menu' });

  for (const item of items) {
    const children = [];
    if (item.icon) {
      children.push(createIcon(item.icon));
    }
    children.push(document.createTextNode(item.label));

    const itemEl = el('button', {
      class: `dropdown-item ${item.danger ? 'dropdown-item--danger' : ''}`.trim(),
      role: 'menuitem',
      onClick: () => {
        close();
        item.onClick();
      }
    }, children);
    menu.appendChild(itemEl);
  }

  // Positioning
  document.body.appendChild(menu);
  const menuRect = menu.getBoundingClientRect();

  let top = rect.bottom + 4;
  let left = rect.left;

  if (top + menuRect.height > window.innerHeight) {
    top = Math.max(8, rect.top - menuRect.height - 4);
  }
  if (left + menuRect.width > window.innerWidth) {
    left = Math.max(8, window.innerWidth - menuRect.width - 8);
  }

  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;

  const handlePointerDown = (e) => {
    if (!menu.contains(e.target) && !anchorEl.contains(e.target)) {
      close();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') close();
  };

  setTimeout(() => {
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
  }, 10);

  function close() {
    document.removeEventListener('pointerdown', handlePointerDown);
    document.removeEventListener('keydown', handleKeyDown);
    if (menu.parentNode) {
      menu.parentNode.removeChild(menu);
    }
    if (activeDropdown === controller) {
      activeDropdown = null;
    }
    if (onClose) onClose();
  }

  const controller = { close, menu };
  activeDropdown = controller;
  return controller;
}
