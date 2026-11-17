/**
 * Sound Event Bus Bindings
 * Subscribes to application and UI events, routing them to sound recipes.
 * Never plays on sync events from other tabs or when document is hidden.
 */
import { eventBus } from '../../core/event-bus.js';
import { soundEngine } from './engine.js';
import { getSoundSettings } from './settings.js';

let initialized = false;
let unsubscribers = [];

export function initSoundBindings() {
  if (initialized) return;
  initialized = true;

  // Sync settings volume to engine
  const initial = getSoundSettings();
  soundEngine.setVolume(initial.soundVolume, initial.soundEnabled);

  // Settings change listeners
  unsubscribers.push(
    eventBus.on('sound:settings-changed', (s) => soundEngine.setVolume(s.soundVolume, s.soundEnabled)),
    eventBus.on('sound:mute-toggled', ({ enabled }) => soundEngine.setVolume(getSoundSettings().soundVolume, enabled))
  );

  // Core entity events (Local only, ignores cross-tab sync)
  unsubscribers.push(
    eventBus.on('store:card:added', (card) => {
      if (!card?._fromSync) soundEngine.play('card-created');
    }),
    eventBus.on('store:card:deleted', (card) => {
      if (!card?._fromSync) soundEngine.play('card-deleted');
    }),
    eventBus.on('store:list:moved', (list) => {
      if (!list?._fromSync) soundEngine.play('list-reorder');
    }),
    eventBus.on('card:archived', () => soundEngine.play('card-archived')),
    eventBus.on('project:created', () => soundEngine.play('project-created'))
  );

  // Drag and Drop
  unsubscribers.push(
    eventBus.on('dnd:lift', () => soundEngine.play('card-lift')),
    eventBus.on('dnd:drop', () => soundEngine.play('card-drop'))
  );

  // Modals & Overlays
  unsubscribers.push(
    eventBus.on('modal:opened', () => soundEngine.play('modal-open')),
    eventBus.on('modal:closed', () => soundEngine.play('modal-close'))
  );

  // Toasts & Errors
  unsubscribers.push(
    eventBus.on('ui:toast', (opts) => {
      const type = typeof opts === 'object' ? opts?.type : 'info';
      if (type === 'error') soundEngine.play('error');
      else soundEngine.play('toast');
    }),
    eventBus.on('ui:error', () => soundEngine.play('error'))
  );

  // Checklists (Progressive pitch elevation & Arpeggio on finish)
  unsubscribers.push(
    eventBus.on('checklist:item-toggled', ({ doneCount, total }) => {
      const ratio = total > 0 ? doneCount / total : 0;
      const pitchMultiplier = 1.0 + ratio * 0.45;
      soundEngine.play('checklist-item', { pitchMultiplier });
    }),
    eventBus.on('checklist:completed', () => soundEngine.play('checklist-complete'))
  );

  // Radial Reaction Menu
  unsubscribers.push(
    eventBus.on('radial:opened', () => soundEngine.play('radial-open')),
    eventBus.on('radial:hover', ({ index = 0 } = {}) => {
      const pitchMultiplier = 1.0 + index * 0.07;
      soundEngine.play('radial-hover', { pitchMultiplier });
    }),
    eventBus.on('radial:select', () => soundEngine.play('radial-select'))
  );

  // Search & Filtering
  unsubscribers.push(
    eventBus.on('search:matched', () => soundEngine.play('search-match')),
    eventBus.on('filter:applied', () => soundEngine.play('filter-applied'))
  );

  // Whiteboard Canvas
  unsubscribers.push(
    eventBus.on('whiteboard:pen', () => soundEngine.play('whiteboard-pen')),
    eventBus.on('whiteboard:eraser', () => soundEngine.play('whiteboard-eraser')),
    eventBus.on('whiteboard:color', () => soundEngine.play('whiteboard-color'))
  );

  // Theming
  unsubscribers.push(
    eventBus.on('theme:changed', ({ effective }) => {
      if (effective === 'dark') soundEngine.play('theme-dark');
      else soundEngine.play('theme-light');
    })
  );

  // UI Interactive Elements: button clicks and toggle switches
  unsubscribers.push(
    eventBus.on('ui:click', () => soundEngine.play('click')),
    eventBus.on('ui:toggle', ({ state } = {}) => soundEngine.play(state ? 'toggle-on' : 'toggle-off'))
  );

  // Delegated UI click catcher for standard buttons and toggles
  if (typeof document !== 'undefined') {
    const clickHandler = (e) => {
      if (e.target.closest('input[type="checkbox"]')) {
        const cb = e.target.closest('input[type="checkbox"]');
        eventBus.emit('ui:toggle', { state: cb.checked });
        return;
      }
      const btn = e.target.closest('button, .btn, .btn-icon, .filter-chip, .color-swatch');
      if (btn && !btn.closest('.radial-menu, .radial-overlay')) {
        eventBus.emit('ui:click');
      }
    };
    document.addEventListener('click', clickHandler, { capture: true, passive: true });
    unsubscribers.push(() => document.removeEventListener('click', clickHandler, { capture: true }));
  }
}

export function destroySoundBindings() {
  for (const unsub of unsubscribers) {
    try { unsub(); } catch (_) {}
  }
  unsubscribers = [];
  initialized = false;
}
