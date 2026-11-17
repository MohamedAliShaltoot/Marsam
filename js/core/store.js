import { projectRepo } from '../data/repositories/project-repo.js';
import { listRepo } from '../data/repositories/list-repo.js';
import { cardRepo } from '../data/repositories/card-repo.js';
import { commandManager } from './command.js';
import { eventBus } from './event-bus.js';
import { sync } from '../data/sync.js';

class Store {
  constructor() {
    this.state = {
      project: null,
      lists: [],
      cards: [],
      drawings: [],
      filters: { search: '', labelIds: [], due: null, checklist: null, priority: null }
    };
    this.subscribers = new Set();
  }

  getState() {
    return this.state;
  }

  subscribe(listener) {
    this.subscribers.add(listener);
    return () => this.subscribers.delete(listener);
  }

  notify(action, payload) {
    for (const sub of this.subscribers) {
      try { sub(this.state, action, payload); } catch (e) { console.error(e); }
    }
    eventBus.emit(`store:${action}`, payload);
  }

  async loadProject(projectId) {
    const project = await projectRepo.getById(projectId);
    const lists = await listRepo.getByProject(projectId);
    const cards = await cardRepo.getByProject(projectId);
    this.state.project = project;
    this.state.lists = lists;
    this.state.cards = cards;
    this.state.filters = { search: '', labelIds: [], due: null, checklist: null, priority: null };
    this.notify('project:loaded', project);
  }

  async addCard(card) {
    await cardRepo.save(card);
    this.state.cards.push(card);
    this.notify('card:added', card);
    sync.broadcast('card:changed', { projectId: card.projectId });
  }

  async updateCard(cardId, changes, isUndoable = true) {
    const card = this.state.cards.find((c) => c.id === cardId);
    if (!card) return;
    const prev = { ...card };
    Object.assign(card, changes);
    await cardRepo.save(card);

    if (isUndoable) {
      commandManager.execute({
        description: `Update card "${card.title}"`,
        execute: async () => {
          Object.assign(card, changes);
          await cardRepo.save(card);
          this.notify('card:updated', card);
        },
        undo: async () => {
          Object.assign(card, prev);
          await cardRepo.save(card);
          this.notify('card:updated', card);
        }
      });
    }

    this.notify('card:updated', card);
    sync.broadcast('card:changed', { projectId: card.projectId });
  }

  async moveCard(cardId, targetListId, targetOrder, isUndoable = true) {
    const card = this.state.cards.find((c) => c.id === cardId);
    if (!card) return;
    const prevListId = card.listId;
    const prevOrder = card.order;

    card.listId = targetListId;
    card.order = targetOrder;
    await cardRepo.save(card);

    if (isUndoable) {
      commandManager.execute({
        description: `Move card "${card.title}"`,
        execute: async () => {
          card.listId = targetListId;
          card.order = targetOrder;
          await cardRepo.save(card);
          this.notify('card:moved', card);
        },
        undo: async () => {
          card.listId = prevListId;
          card.order = prevOrder;
          await cardRepo.save(card);
          this.notify('card:moved', card);
        }
      });
    }

    this.notify('card:moved', card);
    sync.broadcast('card:changed', { projectId: card.projectId });
  }

  async deleteCard(cardId, isUndoable = true) {
    const index = this.state.cards.findIndex((c) => c.id === cardId);
    if (index === -1) return;
    const [card] = this.state.cards.splice(index, 1);
    await cardRepo.delete(cardId);

    if (isUndoable) {
      commandManager.execute({
        description: `Delete card "${card.title}"`,
        execute: async () => {
          const idx = this.state.cards.findIndex((c) => c.id === cardId);
          if (idx !== -1) this.state.cards.splice(idx, 1);
          await cardRepo.delete(cardId);
          this.notify('card:deleted', card);
        },
        undo: async () => {
          await cardRepo.save(card);
          this.state.cards.push(card);
          this.notify('card:added', card);
        }
      });
    }

    this.notify('card:deleted', card);
    sync.broadcast('card:changed', { projectId: card.projectId });
  }

  async addList(list) {
    await listRepo.save(list);
    this.state.lists.push(list);
    this.notify('list:added', list);
    sync.broadcast('list:changed', { projectId: list.projectId });
  }

  async updateList(listId, changes) {
    const list = this.state.lists.find((l) => l.id === listId);
    if (!list) return;
    Object.assign(list, changes);
    await listRepo.save(list);
    this.notify('list:updated', list);
    sync.broadcast('list:changed', { projectId: list.projectId });
  }

  async moveList(listId, targetOrder) {
    const list = this.state.lists.find((l) => l.id === listId);
    if (!list) return;
    list.order = targetOrder;
    await listRepo.save(list);
    this.state.lists.sort((a, b) => a.order - b.order);
    this.notify('list:moved', list);
    sync.broadcast('list:changed', { projectId: list.projectId });
  }

  async deleteList(listId) {
    const index = this.state.lists.findIndex((l) => l.id === listId);
    if (index === -1) return;
    const [list] = this.state.lists.splice(index, 1);
    const affectedCards = this.state.cards.filter((c) => c.listId === listId);
    this.state.cards = this.state.cards.filter((c) => c.listId !== listId);

    await listRepo.delete(listId);
    for (const card of affectedCards) {
      await cardRepo.delete(card.id);
    }

    this.notify('list:deleted', { list, affectedCards });
    sync.broadcast('list:changed', { projectId: list.projectId });
  }

  setFilters(partialFilters) {
    this.state.filters = { ...this.state.filters, ...partialFilters };
    this.notify('filters:changed', this.state.filters);
  }
}

export const store = new Store();

