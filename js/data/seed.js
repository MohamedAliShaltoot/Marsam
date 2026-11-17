/**
 * Seed Demo Data for First Run
 * Creates a delightful "Welcome to Boardly" project with lists and cards.
 */
import { projectRepo } from './repositories/project-repo.js';
import { listRepo } from './repositories/list-repo.js';
import { cardRepo } from './repositories/card-repo.js';

export async function seedInitialDataIfNeeded() {
  const existingProjects = await projectRepo.getAll();
  if (existingProjects.length > 0) return existingProjects[0].id;

  const now = Date.now();
  const projectId = 'welcome-board';

  const welcomeProject = {
    id: projectId,
    name: '🚀 Welcome to Boardly',
    description: 'A tactile, offline-first workspace pressed into 3D woven cloth.',
    background: '#6d4aff',
    createdAt: now,
    updatedAt: now,
    archived: false
  };

  const lists = [
    { id: 'list-todo', projectId, title: 'Ideas & Tasks 💡', order: 1000, archived: false },
    { id: 'list-prog', projectId, title: 'In Progress 🔨', order: 2000, archived: false },
    { id: 'list-done', projectId, title: 'Completed ✅', order: 3000, archived: false }
  ];

  const tomorrow = new Date(now + 86400000).toISOString().split('T')[0];

  const cards = [
    {
      id: 'card-1',
      listId: 'list-todo',
      projectId,
      title: 'Welcome to Boardly 👋',
      description: 'Boardly is a zero-dependency, offline-first board with a 3D woven fabric tactile feel.',
      order: 1000,
      labels: [{ id: 'lbl-1', name: 'Start Here', color: '#10b981' }],
      dueDate: null,
      checklist: [
        { id: 'chk-1', text: 'Create your first card', done: false },
        { id: 'chk-2', text: 'Drag a card between lists', done: false }
      ],
      priority: 'medium',
      cover: '#6d4aff',
      createdAt: now,
      updatedAt: now,
      archived: false
    },
    {
      id: 'card-2',
      listId: 'list-todo',
      projectId,
      title: 'Long-press for Quick Reactions ⚡',
      description: 'Long-press (450ms) on any card or list header to open the WhatsApp-style bubble menu.',
      order: 2000,
      labels: [{ id: 'lbl-2', name: 'Gestures', color: '#ec4899' }],
      dueDate: tomorrow,
      checklist: [],
      priority: 'high',
      cover: null,
      createdAt: now,
      updatedAt: now,
      archived: false
    },
    {
      id: 'card-3',
      listId: 'list-prog',
      projectId,
      title: 'Feel the 3D Pressed Surface 🧵',
      description: 'Lists and cards are physically pressed into the woven cloth with dynamic light falloff.',
      order: 1000,
      labels: [{ id: 'lbl-3', name: 'Signature Visual', color: '#8b5cf6' }],
      dueDate: null,
      checklist: [
        { id: 'chk-3', text: 'Try tilting the board with mouse', done: true },
        { id: 'chk-4', text: 'Drag a card to lift it out of cloth', done: false }
      ],
      priority: 'urgent',
      cover: null,
      createdAt: now,
      updatedAt: now,
      archived: false
    },
    {
      id: 'card-4',
      listId: 'list-done',
      projectId,
      title: '100% Offline & Private 🔒',
      description: 'All your boards, cards, and drawings stay on your computer via IndexedDB.',
      order: 1000,
      labels: [{ id: 'lbl-4', name: 'Offline', color: '#0ea5e9' }],
      dueDate: null,
      checklist: [
        { id: 'chk-5', text: 'IndexedDB persistent storage', done: true }
      ],
      priority: 'low',
      cover: null,
      createdAt: now,
      updatedAt: now,
      archived: false
    }
  ];

  await projectRepo.save(welcomeProject);
  await listRepo.saveMany(lists);
  await cardRepo.saveMany(cards);

  return projectId;
}
