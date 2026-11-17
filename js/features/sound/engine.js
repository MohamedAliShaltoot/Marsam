import { getSoundSettings } from './settings.js';
import { getSoundRecipes, applyPitchVariation } from './recipes.js';

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.compressor = null;
    this.unlocked = false;
    this.activeVoices = 0;
    this.maxVoices = 10;
    this.throttleMap = new Map();
    this.minIntervals = {
      'radial-hover': 45,
      'whiteboard-pen': 55,
      'whiteboard-eraser': 65,
      click: 40
    };

    this.setupGestureUnlock();
  }

  isSupported() {
    return typeof window !== 'undefined' && (typeof window.AudioContext !== 'undefined' || typeof window.webkitAudioContext !== 'undefined');
  }

  ensureContext() {
    if (!this.isSupported()) return null;
    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();

        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(10, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.005, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.1, this.ctx.currentTime);

        this.masterGain = this.ctx.createGain();
        const settings = getSoundSettings();
        const initialVol = settings.soundEnabled ? (settings.soundVolume / 100) * 0.4 : 0;
        this.masterGain.gain.setValueAtTime(initialVol, this.ctx.currentTime);

        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);
      } catch (e) {
        console.warn('Boardly: Web Audio not permitted:', e);
        return null;
      }
    }
    return this.ctx;
  }

  setupGestureUnlock() {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      const ctx = this.ensureContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().then(() => {
          this.unlocked = true;
        }).catch(() => {});
      } else if (ctx && ctx.state === 'running') {
        this.unlocked = true;
      }
    };

    window.addEventListener('pointerdown', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true, passive: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
  }

  setVolume(volume0to100, enabled = true) {
    if (!this.masterGain || !this.ctx) return;
    const target = enabled ? (Math.max(0, Math.min(100, volume0to100)) / 100) * 0.4 : 0;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(target, now + 0.05);
  }

  play(name, opts = {}) {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    const settings = getSoundSettings();
    if (!settings.soundEnabled) return;

    const recipes = getSoundRecipes(settings.soundTheme);
    const recipe = recipes[name];
    if (!recipe) return;

    if (settings.soundReduced && !recipe.essential) return;

    const nowMs = Date.now();
    const minInterval = this.minIntervals[name] || 0;
    if (minInterval > 0) {
      const last = this.throttleMap.get(name) || 0;
      if (nowMs - last < minInterval) return;
      this.throttleMap.set(name, nowMs);
    }

    if (this.activeVoices >= this.maxVoices) return;

    const ctx = this.ensureContext();
    if (!ctx || ctx.state !== 'running') return;

    this.renderRecipe(ctx, recipe, opts);
  }

  renderRecipe(ctx, recipe, opts) {
    const now = ctx.currentTime;
    const pitchMultiplier = opts.pitchMultiplier || 1.0;
    const gainMultiplier = opts.gainMultiplier || 1.0;

    for (const tone of recipe.tones) {
      this.activeVoices++;
      const osc = ctx.createOscillator();
      const toneGain = ctx.createGain();

      osc.type = tone.type;
      const startF = applyPitchVariation(tone.startFreq * pitchMultiplier);
      const endF = tone.endFreq ? applyPitchVariation(tone.endFreq * pitchMultiplier) : startF;

      const toneStart = now + (tone.delay || 0);
      const toneDur = tone.duration || 0.1;
      const attack = tone.attack || 0.005;
      const peakGain = tone.gain * gainMultiplier;

      osc.frequency.setValueAtTime(startF, toneStart);
      if (endF !== startF) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endF), toneStart + toneDur);
      }

      toneGain.gain.setValueAtTime(0.0001, toneStart);
      toneGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peakGain), toneStart + attack);
      toneGain.gain.exponentialRampToValueAtTime(0.0001, toneStart + toneDur);

      if (tone.filterFreq) {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(tone.filterFreq, toneStart);
        osc.connect(filter);
        filter.connect(toneGain);
      } else {
        osc.connect(toneGain);
      }

      toneGain.connect(this.masterGain);

      osc.start(toneStart);
      osc.stop(toneStart + toneDur + 0.02);

      osc.onended = () => {
        this.activeVoices = Math.max(0, this.activeVoices - 1);
        try {
          osc.disconnect();
          toneGain.disconnect();
        } catch (_) {}
      };
    }

    if (recipe.noise) {
      this.renderNoiseBurst(ctx, now, recipe, gainMultiplier);
    }
  }

  renderNoiseBurst(ctx, now, recipe, gainMultiplier) {
    const dur = recipe.noiseDuration || 0.05;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    if (bufferSize <= 0) return;

    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(recipe.noiseFilter || 500, now);

    const noiseGain = ctx.createGain();
    const peak = (recipe.noiseGain || 0.06) * gainMultiplier;
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), now + 0.008);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noiseSource.start(now);
    noiseSource.stop(now + dur + 0.01);

    noiseSource.onended = () => {
      try {
        noiseSource.disconnect();
        noiseFilter.disconnect();
        noiseGain.disconnect();
      } catch (_) {}
    };
  }
}

export const soundEngine = new SoundEngine();

