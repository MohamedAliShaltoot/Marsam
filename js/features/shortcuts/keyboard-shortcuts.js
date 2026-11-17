import { commandManager } from '../../core/command.js';
import { toggleTheme } from '../theme/theme-manager.js';
import { openShortcutsModal } from './shortcuts-modal.js';
import { openWhiteboardModal } from '../whiteboard/whiteboard-modal.js';
import { toggleSoundMute } from '../sound/settings.js';
import { store } from '../../core/store.js';
import { showToast } from '../../ui/toast.js';

export function initKeyboardShortcuts(boardView = null) {
  const handler = async (e) => {
    const active = document.activeElement;
    const isEditing = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);

    if ((e.ctrlKey || e.metaKey) && !isEditing) {
      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        if (e.shiftKey) {
          const cmd = await commandManager.redo();
          if (cmd) showToast(`Redone: ${cmd.description}`);
        } else {
          const cmd = await commandManager.undo();
          if (cmd) showToast({
            message: `Undone: ${cmd.description}`,
            action: { label: 'Redo', onClick: () => commandManager.redo() }
          });
        }
        return;
      }
      if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        const cmd = await commandManager.redo();
        if (cmd) showToast(`Redone: ${cmd.description}`);
        return;
      }
    }

    if (isEditing) return;

    if (e.key === '?') {
      e.preventDefault();
      openShortcutsModal();
    } else if (e.key === '/') {
      e.preventDefault();
      boardView?.focusSearch();
    } else if (e.key === 't' || e.key === 'T') {
      e.preventDefault();
      toggleTheme();
    } else if (e.key === 'w' || e.key === 'W') {
      const projId = store.getState().project?.id;
      if (projId) {
        e.preventDefault();
        openWhiteboardModal(projId);
      }
    } else if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      toggleSoundMute();
    } else if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      const firstComposerBtn = document.querySelector('.board-list .board-list__composer button');
      if (firstComposerBtn) firstComposerBtn.click();
    }
  };

  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}

