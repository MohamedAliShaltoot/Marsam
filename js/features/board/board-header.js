import { el } from '../../core/dom.js';
import { createIcon } from '../../ui/icon.js';
import { router } from '../../core/router.js';
import { store } from '../../core/store.js';
import { projectRepo } from '../../data/repositories/project-repo.js';
import { exportProjectAsBlob } from '../../data/export-import.js';
import { showToast } from '../../ui/toast.js';
import { openDropdown } from '../../ui/dropdown.js';
import { ACCENT_PALETTES, setAccent } from '../theme/accent-manager.js';
import { toggleTheme } from '../theme/theme-manager.js';
import { openWhiteboardModal } from '../whiteboard/whiteboard-modal.js';
import { openShortcutsModal } from '../shortcuts/shortcuts-modal.js';
import { openArchiveModal } from '../archive/archive-modal.js';
import { createSoundToggleBtn, openSoundSettingsModal } from '../sound/ui.js';

export function createBoardHeader(project, onSearchToggle) {
  const container = el('header', { class: 'app-header' });

  const backBtn = el('button', {
    class: 'btn-icon',
    'aria-label': 'Back to Projects',
    onClick: () => router.navigate('/')
  }, [createIcon('arrow-left')]);

  const titleText = el('h1', {
    class: 'board-list__title',
    style: { 'font-size': 'var(--font-size-lg)', 'font-weight': '700' },
    onClick: enableTitleEdit
  }, project.name);

  function enableTitleEdit() {
    const input = el('input', {
      class: 'form-input',
      value: project.name,
      style: { width: '220px', 'font-size': 'var(--font-size-lg)', 'font-weight': '700' },
      onBlur: () => finishEdit(),
      onKeydown: (e) => {
        if (e.key === 'Enter') finishEdit();
        if (e.key === 'Escape') cancelEdit();
      }
    });

    titleArea.replaceChild(input, titleText);
    input.focus();

    async function finishEdit() {
      const val = input.value.trim();
      if (val && val !== project.name) {
        project.name = val;
        await projectRepo.save(project);
        titleText.textContent = val;
      }
      cancelEdit();
    }

    function cancelEdit() {
      if (input.parentNode) titleArea.replaceChild(titleText, input);
    }
  }

  const titleArea = el('div', { class: 'row-gap-sm' }, [backBtn, titleText]);

  const searchBtn = el('button', {
    class: 'btn-icon',
    title: 'Search & Filters (/)',
    'aria-label': 'Search cards',
    onClick: onSearchToggle
  }, [createIcon('search')]);

  const whiteboardBtn = el('button', {
    class: 'btn-icon',
    title: 'Whiteboard (W)',
    'aria-label': 'Open whiteboard',
    onClick: () => openWhiteboardModal(project.id)
  }, [createIcon('draw')]);

  const themeBtn = el('button', {
    class: 'btn-icon',
    title: 'Toggle Theme (T)',
    'aria-label': 'Toggle theme',
    onClick: () => toggleTheme()
  }, [createIcon('sun')]);

  const accentBtn = el('button', {
    class: 'btn-icon',
    title: 'Accent Palette',
    'aria-label': 'Change accent color',
    onClick: (e) => {
      openDropdown({
        anchorEl: e.currentTarget,
        items: ACCENT_PALETTES.map((p) => ({
          label: p.name,
          onClick: () => setAccent(p.id)
        }))
      });
    }
  }, [createIcon('palette')]);

  const exportBtn = el('button', {
    class: 'btn-icon',
    title: 'Export Project',
    'aria-label': 'Export project as JSON',
    onClick: async () => {
      const blob = await exportProjectAsBlob(project.id);
      const url = URL.createObjectURL(blob);
      const a = el('a', { href: url, download: `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.marsam.json` });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Project exported.');
    }
  }, [createIcon('export')]);

  const helpBtn = el('button', {
    class: 'btn-icon',
    title: 'Keyboard Shortcuts (?)',
    'aria-label': 'Keyboard shortcuts',
    onClick: () => openShortcutsModal()
  }, [createIcon('help')]);

  const archiveBtn = el('button', {
    class: 'btn-icon',
    title: 'Archived Items',
    'aria-label': 'View archived items',
    onClick: () => openArchiveModal(project.id)
  }, [createIcon('archive')]);

  const soundBtn = createSoundToggleBtn();
  soundBtn.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    openSoundSettingsModal();
  });

  const actions = el('div', { class: 'app-header__actions' }, [
    searchBtn, whiteboardBtn, archiveBtn, soundBtn, themeBtn, accentBtn, exportBtn, helpBtn
  ]);

  container.appendChild(titleArea);
  container.appendChild(actions);

  return { el: container, updateTitle: (name) => { titleText.textContent = name; } };
}

