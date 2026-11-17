import { el, empty } from '../../core/dom.js';
import { createIcon } from '../../ui/icon.js';
import { projectRepo } from '../../data/repositories/project-repo.js';
import { listRepo } from '../../data/repositories/list-repo.js';
import { cardRepo } from '../../data/repositories/card-repo.js';
import { generateId } from '../../core/id.js';
import { router } from '../../core/router.js';
import { eventBus } from '../../core/event-bus.js';
import { showToast } from '../../ui/toast.js';
import { openConfirmDialog } from '../../ui/confirm-dialog.js';
import { openProjectModal } from './project-modal.js';
import { openDropdown } from '../../ui/dropdown.js';
import { exportProjectAsBlob, importProjectData } from '../../data/export-import.js';
import { formatRelativeTime } from '../../utils/date.js';
import { createSoundToggleBtn, openSoundSettingsModal } from '../sound/ui.js';

export function createHomeView() {
  const container = el('div', { class: 'home-view' });

  async function render() {
    empty(container);
    const projects = await projectRepo.getAll();

    const heroTitle = el('div', {}, [
      el('h1', { class: 'home-hero__title' }, 'Marsam Projects'),
      el('p', { class: 'home-hero__subtitle' }, 'مرسم — Tactile project management with offline persistence.')
    ]);

    const importInput = el('input', {
      type: 'file',
      accept: '.json',
      style: { display: 'none' },
      onChange: handleImportFile
    });

    const createBtn = el('button', {
      class: 'btn btn--primary',
      onClick: handleCreateProject
    }, [createIcon('plus'), 'Create Project']);

    const importBtn = el('button', {
      class: 'btn btn--outline',
      onClick: () => importInput.click()
    }, [createIcon('import'), 'Import Project']);

    const soundBtn = createSoundToggleBtn();
    soundBtn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      openSoundSettingsModal();
    });

    const heroActions = el('div', { class: 'row-gap-sm' }, [importInput, importBtn, createBtn, soundBtn]);
    const hero = el('div', { class: 'home-hero' }, [heroTitle, heroActions]);
    container.appendChild(hero);

    if (projects.length === 0) {
      container.appendChild(renderEmptyState());
    } else {
      const grid = el('div', { class: 'home-projects-grid' });
      for (const project of projects) {
        grid.appendChild(await renderProjectCard(project));
      }
      container.appendChild(grid);
    }
  }

  function renderEmptyState() {
    return el('div', { style: { 'text-align': 'center', 'padding-block': 'var(--space-12)' } }, [
      el('div', { style: { 'font-size': '48px', 'margin-block-end': 'var(--space-4)' } }, '📋'),
      el('h2', { style: { 'font-size': 'var(--font-size-xl)', 'font-weight': '600' } }, 'No projects yet'),
      el('p', { style: { color: 'var(--text-secondary)', 'margin-block': 'var(--space-2)' } },
        'Create your first tactile board or import a project JSON.'
      ),
      el('button', {
        class: 'btn btn--primary',
        style: { 'margin-block-start': 'var(--space-4)' },
        onClick: handleCreateProject
      }, [createIcon('plus'), 'Create New Project'])
    ]);
  }

  async function renderProjectCard(project) {
    const lists = await listRepo.getByProject(project.id);
    const cards = await cardRepo.getByProject(project.id);
    const totalCards = cards.length;
    const doneCards = cards.filter((c) => {
      const list = lists.find((l) => l.id === c.listId);
      return list && list.title.toLowerCase().includes('done');
    }).length;
    const progressPct = totalCards > 0 ? Math.round((doneCards / totalCards) * 100) : 0;

    const menuBtn = el('button', {
      class: 'btn-icon',
      'aria-label': 'Project options',
      onClick: (e) => {
        e.stopPropagation();
        openProjectMenu(e.currentTarget, project);
      }
    }, [createIcon('more')]);

    const header = el('div', { class: 'row-gap-sm', style: { 'justify-content': 'space-between', 'align-items': 'flex-start' } }, [
      el('h3', { class: 'home-project-card__title', style: { 'font-weight': '600', 'font-size': 'var(--font-size-lg)', flex: '1', 'min-width': '0' } }, project.name),
      menuBtn
    ]);

    const desc = el('p', {
      class: 'home-project-card__desc',
      style: {
        color: 'var(--text-secondary)',
        'font-size': 'var(--font-size-sm)',
        'margin-block': 'var(--space-2)',
        'min-height': '36px'
      }
    }, project.description || 'No description');

    const meta = el('div', {
      class: 'row-gap-sm',
      style: {
        'justify-content': 'space-between',
        'font-size': 'var(--font-size-xs)',
        color: 'var(--text-muted)'
      }
    }, [
      el('span', {}, `${totalCards} cards (${progressPct}% done)`),
      el('span', {}, formatRelativeTime(project.updatedAt))
    ]);

    const cardEl = el('div', {
      class: 'fabric-sunken-card home-project-card',
      style: {
        padding: 'var(--space-4)',
        cursor: 'pointer',
        'border-top': `4px solid ${project.background || 'var(--accent)'}`
      },
      onClick: () => router.navigate(`/p/${project.id}`)
    }, [header, desc, meta]);

    return cardEl;
  }

  function openProjectMenu(anchorEl, project) {
    openDropdown({
      anchorEl,
      items: [
        { label: 'Open', icon: 'board', onClick: () => router.navigate(`/p/${project.id}`) },
        { label: 'Rename / Edit', icon: 'edit', onClick: () => handleEditProject(project) },
        { label: 'Duplicate', icon: 'copy', onClick: () => handleDuplicateProject(project) },
        { label: 'Export JSON', icon: 'export', onClick: () => handleExportProject(project) },
        { label: 'Delete', icon: 'trash', danger: true, onClick: () => handleDeleteProject(project) }
      ]
    });
  }

  function handleCreateProject() {
    openProjectModal({
      onSave: async ({ name, description, background }) => {
        const id = generateId();
        const now = Date.now();
        const newProj = { id, name, description, background, createdAt: now, updatedAt: now, archived: false };
        await projectRepo.save(newProj);
        await listRepo.saveMany([
          { id: generateId(), projectId: id, title: 'To Do', order: 1000, archived: false },
          { id: generateId(), projectId: id, title: 'In Progress', order: 2000, archived: false },
          { id: generateId(), projectId: id, title: 'Done', order: 3000, archived: false }
        ]);
        eventBus.emit('project:created', newProj);
        showToast({ message: `Project "${name}" created.`, type: 'success' });
        router.navigate(`/p/${id}`);
      }
    });
  }

  function handleEditProject(project) {
    openProjectModal({
      project,
      onSave: async (changes) => {
        Object.assign(project, changes);
        await projectRepo.save(project);
        showToast('Project updated.');
        render();
      }
    });
  }

  async function handleDuplicateProject(project) {
    const blob = await exportProjectAsBlob(project.id);
    const jsonStr = await blob.text();
    const data = JSON.parse(jsonStr);
    data.project.name = `${project.name} (Copy)`;
    await importProjectData(data);
    showToast('Project duplicated.');
    render();
  }

  async function handleExportProject(project) {
    const blob = await exportProjectAsBlob(project.id);
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.marsam.json` });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Project exported as JSON.');
  }

  function handleDeleteProject(project) {
    openConfirmDialog({
      title: 'Delete Project?',
      message: `Are you sure you want to delete "${project.name}" and all of its lists and cards? This action cannot be undone.`,
      confirmText: 'Delete Project',
      onConfirm: async () => {
        await projectRepo.delete(project.id);
        showToast('Project deleted.');
        render();
      }
    });
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const newId = await importProjectData(data);
      showToast({ message: 'Project imported successfully!', type: 'success' });
      router.navigate(`/p/${newId}`);
    } catch (err) {
      showToast({ message: 'Failed to import: ' + err.message, type: 'error' });
    }
  }

  render();
  return { el: container, update: render, destroy: () => {} };
}

