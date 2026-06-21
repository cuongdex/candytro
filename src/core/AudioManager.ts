import type Phaser from 'phaser';

export class AudioManager {
  private static instance: AudioManager;
  
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmInterval: any = null;
  private isMuted = false;
  private isMusicPlaying = false;

  private constructor() {
    // Lazy initialization on first user interaction
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Initializes the AudioContext if not already created.
   * Resolves browser restrictions on autoplay.
   */
  public ensureContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.4, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Starts the looping retro background music sequencer.
   */
  public startMusic() {
    this.ensureContext();
    if (!this.ctx || this.isMusicPlaying) return;

    this.isMusicPlaying = true;
    let beatIndex = 0;

    // 120 BPM: 0.5 seconds per beat (500ms)
    this.bgmInterval = setInterval(() => {
      this.playBgmStep(beatIndex);
      beatIndex++;
    }, 500);
  }

  /**
   * Stops the BGM sequencer loop.
   */
  public stopMusic() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.isMusicPlaying = false;
  }

  /**
   * Plays a single step of the background music pattern.
   * Uses chord progression: Am -> F -> C -> G (each chord gets 4 beats).
   */
  private playBgmStep(beatIndex: number) {
    if (!this.ctx || this.isMuted) return;

    // 4 bars sequence, 16 beats total
    const chords = [
      { root: 110.00, notes: [220.00, 261.63, 329.63] }, // Am (A2 root, A3, C4, E4)
      { root: 87.31,  notes: [174.61, 220.00, 261.63] }, // F (F2 root, F3, A3, C4)
      { root: 130.81, notes: [261.63, 329.63, 392.00] }, // C (C3 root, C4, E4, G4)
      { root: 98.00,  notes: [196.00, 246.94, 293.66] }  // G (G2 root, G3, B3, D4)
    ];

    const chordIndex = Math.floor((beatIndex % 16) / 4);
    const chord = chords[chordIndex];
    const stepInChord = beatIndex % 4;

    // 1. Play Bass Note (Triangle wave, soft bass)
    if (stepInChord === 0) {
      this.playSynthNote(chord.root, 1.8, 'triangle', 0.12);
    }

    // 2. Play Arpeggio pattern (Sine wave, warm & gentle)
    const arpeggioPattern = [0, 1, 2, 1];
    const noteFreq = chord.notes[arpeggioPattern[stepInChord]];
    this.playSynthNote(noteFreq, 0.4, 'sine', 0.05);

    // 3. Play random melody notes occasionally on beat 2 or 3
    if ((stepInChord === 2 || stepInChord === 3) && Math.random() < 0.4) {
      const melodyIndex = Math.floor(Math.random() * chord.notes.length);
      // Play 1 octave higher
      const melodyFreq = chord.notes[melodyIndex] * 2;
      this.playSynthNote(melodyFreq, 0.6, 'sine', 0.025);
    }
  }

  /**
   * Generates a single synthetic note.
   */
  private playSynthNote(freq: number, duration: number, type: OscillatorType, volume: number) {
    const ctx = this.ctx;
    const masterGain = this.masterGain;
    if (!ctx || !masterGain || this.isMuted) return;

    try {
      const time = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(volume, time);
      // Clean exponential decay
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(time);
      osc.stop(time + duration);
    } catch (e) {
      console.warn('Failed to play synth note:', e);
    }
  }

  // ==========================================
  // SOUND EFFECTS (SFX)
  // ==========================================

  /**
   * Sound effect for clicking UI elements.
   */
  public playClick() {
    this.ensureContext();
    this.playSynthNote(600, 0.06, 'sine', 0.1);
  }

  /**
   * Sound effect for swapping candies.
   */
  public playSwap() {
    this.ensureContext();
    const ctx = this.ctx;
    const masterGain = this.masterGain;
    if (!ctx || !masterGain || this.isMuted) return;

    try {
      const time = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, time);
      osc.frequency.exponentialRampToValueAtTime(160, time + 0.15);

      gain.gain.setValueAtTime(0.12, time);
      gain.gain.linearRampToValueAtTime(0.001, time + 0.15);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(time);
      osc.stop(time + 0.15);
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * Sound effect for making candy matches.
   * Increases in pitch with cascade/combo level.
   */
  public playMatch(combo: number = 1) {
    this.ensureContext();
    const ctx = this.ctx;
    const masterGain = this.masterGain;
    if (!ctx || !masterGain || this.isMuted) return;

    try {
      const time = ctx.currentTime;
      // Pentatonic scale notes
      const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
      const startIndex = Math.min(pentatonic.length - 3, (combo - 1) * 2);

      // Play 3 ascending notes in quick succession (arpeggio)
      const notes = [
        pentatonic[startIndex],
        pentatonic[startIndex + 1],
        pentatonic[startIndex + 2]
      ];

      notes.forEach((freq, idx) => {
        const noteTime = time + idx * 0.06;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.08, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.22);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(noteTime);
        osc.stop(noteTime + 0.22);
      });
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * Deep rumble noise for standard explosions.
   */
  public playExplosion() {
    this.ensureContext();
    const ctx = this.ctx;
    const masterGain = this.masterGain;
    if (!ctx || !masterGain || this.isMuted) return;

    try {
      const time = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, time);
      osc.frequency.linearRampToValueAtTime(30, time + 0.35);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, time);
      filter.frequency.exponentialRampToValueAtTime(30, time + 0.35);

      gain.gain.setValueAtTime(0.18, time);
      gain.gain.linearRampToValueAtTime(0.001, time + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(time);
      osc.stop(time + 0.35);
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * Laser sweep for special vertical/horizontal row clearing.
   */
  public playLaser() {
    this.ensureContext();
    const ctx = this.ctx;
    const masterGain = this.masterGain;
    if (!ctx || !masterGain || this.isMuted) return;

    try {
      const time = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(750, time);
      osc.frequency.exponentialRampToValueAtTime(180, time + 0.28);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, time);
      filter.frequency.exponentialRampToValueAtTime(250, time + 0.28);

      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(time);
      osc.stop(time + 0.28);
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * Retro level-up fanfare for shop upgrades/purchases.
   */
  public playUpgrade() {
    this.ensureContext();
    const ctx = this.ctx;
    const masterGain = this.masterGain;
    if (!ctx || !masterGain || this.isMuted) return;

    try {
      const time = ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4 -> E4 -> G4 -> C5

      notes.forEach((freq, idx) => {
        const noteTime = time + idx * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.12, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(noteTime);
        osc.stop(noteTime + 0.35);
      });
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * Sparkly chime for Joker trigger alerts.
   */
  public playMagic() {
    this.ensureContext();
    const ctx = this.ctx;
    const masterGain = this.masterGain;
    if (!ctx || !masterGain || this.isMuted) return;

    try {
      const time = ctx.currentTime;
      const scale = [523.25, 587.33, 659.25, 783.99, 880.00];

      for (let i = 0; i < 5; i++) {
        const freq = scale[i];
        const noteTime = time + i * 0.04;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.05, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.15);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(noteTime);
        osc.stop(noteTime + 0.15);
      }
    } catch (e) {
      console.warn(e);
    }
  }

  // ==========================================
  // UTILITY / INTERACTION
  // ==========================================

  public getMutedState(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.4, this.ctx.currentTime);
    }
  }

  /**
   * Toggles the global volume.
   */
  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Helper that automatically adds a beautiful mute button to a scene.
   */
  public static addMuteButton(scene: Phaser.Scene): Phaser.GameObjects.Text {
    const audio = AudioManager.getInstance();

    const getSymbol = () => (audio.getMutedState() ? '🔇' : '🔊');

    const button = scene.add.text(980, 30, getSymbol(), {
      fontSize: '24px',
      fontFamily: 'Outfit, Roboto, sans-serif'
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

    button.on('pointerdown', () => {
      audio.ensureContext();
      audio.toggleMute();
      button.setText(getSymbol());
      
      // Gentle bounce effect on press
      scene.tweens.add({
        targets: button,
        scale: 1.25,
        duration: 80,
        yoyo: true,
        ease: 'Quad.easeOut'
      });
    });

    return button;
  }
}
