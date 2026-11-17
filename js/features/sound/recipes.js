export function applyPitchVariation(freq, variationRange = 0.03) {
  const multiplier = 1 + (Math.random() * (variationRange * 2) - variationRange);
  return Math.round(freq * multiplier * 10) / 10;
}

export function getSoundRecipes(theme = 'soft') {
  const isCrisp = theme === 'crisp';
  const defaultOsc = isCrisp ? 'triangle' : 'sine';
  const durMul = isCrisp ? 0.8 : 1.0;

  const tone = (start, end, dur, gain = 0.2, delay = 0, filter = null, type = defaultOsc) => ({
    type,
    startFreq: start,
    endFreq: end || start,
    duration: Math.max(0.02, dur * durMul),
    gain,
    attack: Math.min(0.01, dur * 0.1),
    decay: dur * 0.9,
    delay,
    filterFreq: filter
  });

  return {
    click: { name: 'click', tones: [tone(520, 260, 0.04, 0.15)] },
    'toggle-on': {
      name: 'toggle-on',
      tones: [tone(440, 440, 0.04, 0.18), tone(660, 660, 0.06, 0.22, 0.03)]
    },
    'toggle-off': {
      name: 'toggle-off',
      tones: [tone(620, 620, 0.04, 0.18), tone(380, 380, 0.06, 0.16, 0.03)]
    },
    'card-lift': { name: 'card-lift', tones: [tone(240, 420, 0.09, 0.18, 0, null, 'sine')] },
    'card-drop': {
      name: 'card-drop',
      essential: true,
      tones: [tone(140, 90, 0.12, 0.28, 0, 400, 'sine')],
      noise: true, noiseDuration: 0.06, noiseGain: 0.07, noiseFilter: 600
    },
    'list-reorder': { name: 'list-reorder', tones: [tone(180, 120, 0.1, 0.25, 0, 500, 'sine')] },
    'card-created': {
      name: 'card-created',
      essential: true,
      tones: [tone(440, 554, 0.08, 0.2), tone(659, 659, 0.12, 0.25, 0.05)]
    },
    'card-deleted': { name: 'card-deleted', essential: true, tones: [tone(420, 180, 0.14, 0.22)] },
    'card-archived': { name: 'card-archived', tones: [tone(330, 220, 0.12, 0.18, 0, 450, 'sine')] },
    'modal-open': { name: 'modal-open', tones: [tone(420, 660, 0.09, 0.16, 0, null, 'sine')] },
    'modal-close': { name: 'modal-close', tones: [tone(520, 340, 0.08, 0.14, 0, null, 'sine')] },
    toast: {
      name: 'toast',
      essential: true,
      tones: [tone(587, 587, 0.07, 0.18), tone(880, 880, 0.11, 0.22, 0.04)]
    },
    error: {
      name: 'error',
      essential: true,
      tones: [tone(280, 280, 0.08, 0.22, 0, null, 'triangle'), tone(220, 220, 0.12, 0.25, 0.06, null, 'triangle')]
    },
    'checklist-item': { name: 'checklist-item', tones: [tone(520, 620, 0.06, 0.2)] },
    'checklist-complete': {
      name: 'checklist-complete',
      essential: true,
      tones: [tone(523, 523, 0.07, 0.2), tone(659, 659, 0.08, 0.22, 0.045), tone(784, 784, 0.14, 0.25, 0.09)]
    },
    'radial-open': { name: 'radial-open', tones: [tone(320, 560, 0.08, 0.18, 0, null, 'sine')] },
    'radial-hover': { name: 'radial-hover', tones: [tone(480, 480, 0.03, 0.08, 0, null, 'sine')] },
    'radial-select': { name: 'radial-select', tones: [tone(640, 840, 0.07, 0.2)] },
    'search-match': { name: 'search-match', tones: [tone(780, 920, 0.06, 0.14, 0, null, 'triangle')] },
    'filter-applied': { name: 'filter-applied', tones: [tone(480, 640, 0.05, 0.16)] },
    'whiteboard-pen': { name: 'whiteboard-pen', tones: [tone(750, 650, 0.025, 0.06, 0, null, 'sine')] },
    'whiteboard-eraser': {
      name: 'whiteboard-eraser',
      noise: true, noiseDuration: 0.05, noiseGain: 0.08, noiseFilter: 450,
      tones: [tone(160, 110, 0.05, 0.08, 0, null, 'sine')]
    },
    'whiteboard-color': { name: 'whiteboard-color', tones: [tone(680, 880, 0.06, 0.16, 0, null, 'sine')] },
    'theme-light': {
      name: 'theme-light',
      tones: [tone(440, 554, 0.09, 0.18, 0, null, 'sine'), tone(659, 659, 0.12, 0.22, 0.04, null, 'sine')]
    },
    'theme-dark': {
      name: 'theme-dark',
      tones: [tone(330, 260, 0.09, 0.18, 0, null, 'sine'), tone(196, 196, 0.13, 0.22, 0.04, null, 'sine')]
    },
    'project-created': {
      name: 'project-created',
      essential: true,
      tones: [tone(392, 392, 0.14, 0.2, 0, null, 'triangle'), tone(494, 494, 0.16, 0.22, 0.03, null, 'triangle'), tone(587, 587, 0.22, 0.25, 0.06, null, 'triangle')]
    }
  };
}

