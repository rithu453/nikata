/**
 * SOUND CONTROLLER
 * Manages typing sounds with Web Audio API.
 * Different sounds for user input vs AI output.
 */

export class SoundController {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;
  private volume: number = 0.3;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudioContext();
    }
  }

  private initAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      console.warn('AUDIO SYSTEM UNAVAILABLE');
    }
  }

  private ensureContext(): void {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // User typing sound - mechanical keyboard click
  playUserKeyClick(): void {
    if (!this.isEnabled || !this.audioContext) return;
    this.ensureContext();

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Mechanical keyboard sound - higher pitched click
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Sharp click sound
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(1200 + Math.random() * 300, now);
    oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.015);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(500, now);

    gainNode.gain.setValueAtTime(this.volume * 0.6, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    oscillator.start(now);
    oscillator.stop(now + 0.025);
  }

  // AI typing sound - dot matrix printer / teletype sound
  playAIKeyClick(): void {
    if (!this.isEnabled || !this.audioContext) return;
    this.ensureContext();

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Create noise-like teletype sound
    const oscillator1 = ctx.createOscillator();
    const oscillator2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    oscillator1.connect(filter);
    oscillator2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Teletype character print sound - lower, more mechanical
    oscillator1.type = 'sawtooth';
    oscillator1.frequency.setValueAtTime(150 + Math.random() * 50, now);
    
    oscillator2.type = 'square';
    oscillator2.frequency.setValueAtTime(80 + Math.random() * 30, now);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, now);
    filter.Q.setValueAtTime(2, now);

    gainNode.gain.setValueAtTime(this.volume * 0.4, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    oscillator1.start(now);
    oscillator2.start(now);
    oscillator1.stop(now + 0.04);
    oscillator2.stop(now + 0.04);
  }

  // Legacy method for backward compatibility
  playKeyClick(): void {
    this.playAIKeyClick();
  }

  playBeep(frequency: number = 440, duration: number = 0.1): void {
    if (!this.isEnabled || !this.audioContext) return;
    this.ensureContext();

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, now);

    gainNode.gain.setValueAtTime(this.volume * 0.5, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  playError(): void {
    this.playBeep(200, 0.3);
  }

  playStartup(): void {
    if (!this.isEnabled || !this.audioContext) return;
    this.ensureContext();

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Classic startup beep sequence
    const frequencies = [523, 659, 784, 1047];
    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(freq, now + i * 0.1);

      gainNode.gain.setValueAtTime(this.volume * 0.3, now + i * 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.08);

      oscillator.start(now + i * 0.1);
      oscillator.stop(now + i * 0.1 + 0.08);
    });
  }

  playWindowOpen(): void {
    if (!this.isEnabled || !this.audioContext) return;
    this.ensureContext();

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.setValueAtTime(600, now + 0.05);

    gainNode.gain.setValueAtTime(this.volume * 0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }

  playWindowClose(): void {
    if (!this.isEnabled || !this.audioContext) return;
    this.ensureContext();

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(600, now);
    oscillator.frequency.setValueAtTime(400, now + 0.05);

    gainNode.gain.setValueAtTime(this.volume * 0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }

  playClick(): void {
    if (!this.isEnabled || !this.audioContext) return;
    this.ensureContext();

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(1000, now);

    gainNode.gain.setValueAtTime(this.volume * 0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    oscillator.start(now);
    oscillator.stop(now + 0.02);
  }

  toggle(): boolean {
    this.isEnabled = !this.isEnabled;
    return this.isEnabled;
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}

// Singleton instance
let soundControllerInstance: SoundController | null = null;

export function getSoundController(): SoundController {
  if (!soundControllerInstance) {
    soundControllerInstance = new SoundController();
  }
  return soundControllerInstance;
}
