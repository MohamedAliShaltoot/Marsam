/**
 * Sound UI Components
 * Header quick-mute toggle button & Sound Settings Dialog
 */
import { el } from '../../core/dom.js';
import { createIcon } from '../../ui/icon.js';
import { openModal } from '../../ui/modal.js';
import { eventBus } from '../../core/event-bus.js';
import { getSoundSettings, updateSoundSettings, toggleSoundMute } from './settings.js';
import { soundEngine } from './engine.js';

/**
 * Creates quick mute toggle button for app header
 * @returns {HTMLElement}
 */
export function createSoundToggleBtn() {
  const current = getSoundSettings();
  const icon = createIcon(current.soundEnabled ? 'volume-high' : 'volume-mute');

  const btn = el('button', {
    class: 'btn-icon',
    title: current.soundEnabled ? 'Mute Sounds (M)' : 'Unmute Sounds (M)',
    'aria-label': current.soundEnabled ? 'Mute sounds' : 'Unmute sounds',
    onClick: () => toggleSoundMute()
  }, [icon]);

  function updateState(enabled) {
    btn.title = enabled ? 'Mute Sounds (M)' : 'Unmute Sounds (M)';
    btn.setAttribute('aria-label', btn.title);
    const newIcon = createIcon(enabled ? 'volume-high' : 'volume-mute');
    btn.innerHTML = '';
    btn.appendChild(newIcon);
  }

  eventBus.on('sound:settings-changed', (s) => updateState(s.soundEnabled));
  eventBus.on('sound:mute-toggled', ({ enabled }) => updateState(enabled));

  return btn;
}

/**
 * Opens Sound Settings Modal
 */
export function openSoundSettingsModal() {
  const settings = getSoundSettings();

  const enabledCheck = el('input', {
    type: 'checkbox',
    checked: settings.soundEnabled,
    onChange: (e) => {
      updateSoundSettings({ soundEnabled: e.target.checked });
    }
  });

  const volValueLabel = el('span', {
    style: { 'font-weight': '600', 'min-width': '40px' }
  }, `${settings.soundVolume}%`);

  const volSlider = el('input', {
    type: 'range',
    min: '0',
    max: '100',
    value: String(settings.soundVolume),
    class: 'size-slider',
    style: { flex: '1' },
    onInput: (e) => {
      const val = Number(e.target.value);
      volValueLabel.textContent = `${val}%`;
      updateSoundSettings({ soundVolume: val });
    },
    onChange: () => {
      soundEngine.play('click');
    }
  });

  const themeSelect = el('select', {
    class: 'form-input',
    style: { width: 'auto' },
    onChange: (e) => {
      updateSoundSettings({ soundTheme: e.target.value });
      soundEngine.play('toast');
    }
  }, [
    el('option', { value: 'soft' }, 'Soft (Warm, rounded sine/triangle)'),
    el('option', { value: 'crisp' }, 'Crisp (Bright, snappy, subtle harmonics)')
  ]);
  themeSelect.value = settings.soundTheme;

  const reducedCheck = el('input', {
    type: 'checkbox',
    checked: settings.soundReduced,
    onChange: (e) => {
      updateSoundSettings({ soundReduced: e.target.checked });
    }
  });

  // Sound Preview Buttons
  const previewSounds = ['card-drop', 'toast', 'checklist-complete', 'project-created'];
  const previewBtns = previewSounds.map((snd) => {
    return el('button', {
      type: 'button',
      class: 'btn btn--outline btn--sm',
      onClick: () => soundEngine.play(snd)
    }, snd);
  });

  const content = el('div', { class: 'stack-md' }, [
    el('div', { class: 'row-gap-md' }, [
      el('label', { class: 'form-label', style: { display: 'flex', 'align-items': 'center', gap: '8px' } }, [
        enabledCheck, 'Enable Sound Effects'
      ])
    ]),
    el('div', { class: 'stack-sm' }, [
      el('label', { class: 'form-label' }, 'Master Volume'),
      el('div', { class: 'row-gap-sm', style: { 'align-items': 'center' } }, [volSlider, volValueLabel])
    ]),
    el('div', { class: 'stack-sm' }, [
      el('label', { class: 'form-label' }, 'Sound Theme'),
      themeSelect
    ]),
    el('div', { class: 'stack-sm' }, [
      el('label', { class: 'form-label', style: { display: 'flex', 'align-items': 'center', gap: '8px' } }, [
        reducedCheck, 'Reduce Sounds (Essential audio only)'
      ]),
      el('span', { class: 'text-muted', style: { 'font-size': 'var(--font-size-xs)' } },
        'Only plays essential sounds for create, delete, drop, alerts and errors.')
    ]),
    el('div', { class: 'stack-sm' }, [
      el('label', { class: 'form-label' }, 'Preview Sounds'),
      el('div', { class: 'row-gap-sm', style: { 'flex-wrap': 'wrap' } }, previewBtns)
    ])
  ]);

  openModal({
    title: el('span', { class: 'row-gap-sm' }, [createIcon('volume-high'), 'Sound Settings']),
    content,
    size: 'sm'
  });
}
