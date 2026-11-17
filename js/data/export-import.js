import { generateId } from '../core/id.js';
import { projectRepo } from './repositories/project-repo.js';
import { listRepo } from './repositories/list-repo.js';
import { cardRepo } from './repositories/card-repo.js';
import { drawingRepo } from './repositories/drawing-repo.js';

export function validateImportSchema(data) {
  if (!data || typeof data !== 'object') return false;
  if (!data.project || typeof data.project.name !== 'string') return false;
  if (!Array.isArray(data.lists) || !Array.isArray(data.cards)) return false;
  return true;
}

export async function exportProjectAsBlob(projectId) {
  const project = await projectRepo.getById(projectId);
  if (!project) throw new Error('Project not found');

  const lists = await listRepo.getByProject(projectId);
  const cards = await cardRepo.getByProject(projectId);
  const drawings = await drawingRepo.getByProject(projectId);

  const exportPayload = {
    app: 'boardly',
    version: 1,
    exportedAt: Date.now(),
    project,
    lists,
    cards,
    drawings
  };

  const jsonStr = JSON.stringify(exportPayload, null, 2);
  return new Blob([jsonStr], { type: 'application/json' });
}

export async function importProjectData(importData) {
  if (!validateImportSchema(importData)) {
    throw new Error('Invalid Boardly project file format.');
  }

  const oldProjectId = importData.project.id;
  const newProjectId = generateId();
  const now = Date.now();

  const newProject = {
    ...importData.project,
    id: newProjectId,
    name: `${importData.project.name} (Imported)`,
    createdAt: now,
    updatedAt: now,
    archived: false
  };

  const listIdMap = new Map();
  const newLists = (importData.lists || []).map((list) => {
    const newListId = generateId();
    listIdMap.set(list.id, newListId);
    return {
      ...list,
      id: newListId,
      projectId: newProjectId,
      archived: false
    };
  });

  const newCards = (importData.cards || []).map((card) => {
    const newCardId = generateId();
    const mappedListId = listIdMap.get(card.listId) || (newLists[0] ? newLists[0].id : generateId());
    return {
      ...card,
      id: newCardId,
      projectId: newProjectId,
      listId: mappedListId,
      createdAt: now,
      updatedAt: now,
      archived: false
    };
  });

  const newDrawings = (importData.drawings || []).map((dwg) => ({
    ...dwg,
    id: generateId(),
    projectId: newProjectId,
    updatedAt: now
  }));

  await projectRepo.save(newProject);
  if (newLists.length > 0) await listRepo.saveMany(newLists);
  if (newCards.length > 0) await cardRepo.saveMany(newCards);
  for (const dwg of newDrawings) {
    await drawingRepo.save(dwg);
  }

  return newProjectId;
}

