export const DB_NAME = 'boardly_db';
export const DB_VERSION = 1;

export const STORES = {
  PROJECTS: 'projects',
  LISTS: 'lists',
  CARDS: 'cards',
  DRAWINGS: 'drawings',
  SETTINGS: 'settings'
};

export const INDEXES = {
  PROJECT_UPDATED: 'updatedAt',
  LIST_PROJECT: 'projectId',
  LIST_ORDER: 'order',
  CARD_PROJECT: 'projectId',
  CARD_LIST: 'listId',
  CARD_ORDER: 'order',
  DRAWING_PROJECT: 'projectId'
};

