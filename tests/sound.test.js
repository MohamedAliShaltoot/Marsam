import { test } from 'node:test';
import assert from 'node:assert';
import { getSoundRecipes, applyPitchVariation } from '../js/features/sound/recipes.js';

test('recipes: soft and crisp palettes provide all required sound definitions', () => {
  const required = [
    'click', 'toggle-on', 'toggle-off',
    'card-lift', 'card-drop', 'list-reorder',
    'card-created', 'card-deleted', 'card-archived',
    'modal-open', 'modal-close', 'toast', 'error',
    'checklist-item', 'checklist-complete',
    'radial-open', 'radial-hover', 'radial-select',
    'search-match', 'filter-applied',
    'whiteboard-pen', 'whiteboard-eraser', 'whiteboard-color',
    'theme-light', 'theme-dark', 'project-created'
  ];

  for (const theme of ['soft', 'crisp']) {
    const recipes = getSoundRecipes(theme);
    for (const name of required) {
      const r = recipes[name];
      assert.ok(r, `Recipe "${name}" must exist in "${theme}" theme`);
      assert.strictEqual(r.name, name);
      assert.ok(Array.isArray(r.tones), `Recipe "${name}" must have tones array`);
      assert.ok(r.tones.length > 0, `Recipe "${name}" must have at least one tone`);
      for (const t of r.tones) {
        assert.ok(t.startFreq > 0, `Tone in "${name}" must have positive frequency`);
        assert.ok(t.duration > 0, `Tone in "${name}" must have positive duration`);
        assert.ok(t.gain > 0 && t.gain <= 1, `Tone in "${name}" must have valid gain`);
        assert.ok(['sine', 'triangle', 'square', 'sawtooth'].includes(t.type), `Tone in "${name}" must have valid type`);
      }
    }
  }
});

test('pitch variation: bounds stay strictly within +-3%', () => {
  const baseFreq = 440;
  for (let i = 0; i < 200; i++) {
    const varied = applyPitchVariation(baseFreq, 0.03);
    assert.ok(varied >= baseFreq * 0.97 - 0.1, `Varied freq ${varied} should be >= 97% of base`);
    assert.ok(varied <= baseFreq * 1.03 + 0.1, `Varied freq ${varied} should be <= 103% of base`);
  }
});

test('recipes: essential sounds are correctly flagged for reduced sound mode', () => {
  const recipes = getSoundRecipes('soft');
  const essentialList = ['card-created', 'card-deleted', 'card-drop', 'toast', 'error', 'checklist-complete', 'project-created'];
  for (const name of essentialList) {
    assert.strictEqual(recipes[name]?.essential, true, `"${name}" should be marked essential`);
  }
  assert.strictEqual(Boolean(recipes['click']?.essential), false, '"click" should not be essential');
  assert.strictEqual(Boolean(recipes['radial-hover']?.essential), false, '"radial-hover" should not be essential');
});

test('recipes: crisp theme uses shorter tones and brighter oscillator types', () => {
  const soft = getSoundRecipes('soft');
  const crisp = getSoundRecipes('crisp');

  assert.strictEqual(soft.click.tones[0].type, 'sine');
  assert.strictEqual(crisp.click.tones[0].type, 'triangle');
  assert.ok(crisp.click.tones[0].duration <= soft.click.tones[0].duration);
});
