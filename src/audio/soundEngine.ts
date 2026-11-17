class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicInterval: number | null = null;
  private musicMode: 'none' | 'menu' | 'explore' | 'chase' = 'none';
  private stepCount = 0;
  private musicVolume = 0.5;
  private sfxVolume = 0.75;
  private muted = false;

  private ensureCtx(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock() {
    this.ensureCtx();
  }

  public setSettings(musicVol: number, sfxVol: number, muted: boolean) {
    this.musicVolume = musicVol;
    this.sfxVolume = sfxVol;
    this.muted = muted;
    if (muted) {
      this.stopMusic();
    }
  }

  public stopMusic() {
    if (this.musicInterval !== null) {
      window.clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.musicMode = 'none';
  }

  public setMusicMode(mode: 'none' | 'menu' | 'explore' | 'chase') {
    if (this.muted) {
      this.stopMusic();
      return;
    }
    if (this.musicMode === mode && this.musicInterval !== null) return;
    this.stopMusic();
    this.musicMode = mode;
    if (mode === 'none') return;

    const intervalMs = mode === 'chase' ? 230 : mode === 'menu' ? 850 : 650;
    const notesMenu = [130.81, 155.56, 174.61, 196.0, 146.83, 185.0];
    const notesExplore = [110.0, 130.81, 123.47, 146.83, 103.83, 138.59];
    const notesChase = [98.0, 103.83, 116.54, 98.0, 130.81, 110.0, 92.5, 103.83];

    this.musicInterval = window.setInterval(() => {
      if (this.muted || this.musicVolume <= 0.01) return;
      const ctx = this.ensureCtx();
      if (!ctx) return;

      const idx = this.stepCount++;
      const seq = mode === 'chase' ? notesChase : mode === 'menu' ? notesMenu : notesExplore;
      const freq = seq[idx % seq.length];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = mode === 'chase' ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(mode === 'chase' ? 680 : 380, ctx.currentTime);

      const peak = (mode === 'chase' ? 0.14 : 0.08) * this.musicVolume;
      const dur = mode === 'chase' ? 0.2 : 0.75;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(peak, ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur + 0.02);

      // Subtle eerie high chime on menu/explore
      if (mode !== 'chase' && idx % 4 === 0) {
        const bell = ctx.createOscillator();
        const bGain = ctx.createGain();
        bell.type = 'sine';
        bell.frequency.setValueAtTime(freq * 4, ctx.currentTime);
        bGain.gain.setValueAtTime(0.0001, ctx.currentTime);
        bGain.gain.exponentialRampToValueAtTime(0.03 * this.musicVolume, ctx.currentTime + 0.02);
        bGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);
        bell.connect(bGain);
        bGain.connect(ctx.destination);
        bell.start();
        bell.stop(ctx.currentTime + 0.95);
      }
    }, intervalMs);
  }

  private tone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.25
  ) {
    if (this.muted || this.sfxVolume <= 0.01) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), ctx.currentTime + duration);
    const v = Math.max(0.001, volume * this.sfxVolume);
    gain.gain.setValueAtTime(v, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);
  }

  public playFootstep(running = false) {
    const pitch = (running ? 130 : 95) * (0.92 + Math.random() * 0.16);
    this.tone(pitch, 45, 0.07, 'triangle', running ? 0.14 : 0.09);
  }

  public playJump() {
    this.tone(180, 390, 0.16, 'sine', 0.18);
  }

  public playFlashlight() {
    this.tone(920, 620, 0.05, 'square', 0.12);
  }

  public playClatter() {
    this.tone(420, 120, 0.28, 'sawtooth', 0.28);
    window.setTimeout(() => this.tone(310, 90, 0.22, 'square', 0.2), 110);
  }

  public playSafeClick() {
    this.tone(720, 980, 0.08, 'triangle', 0.18);
  }

  public playDoorOpen() {
    this.tone(140, 260, 0.35, 'sawtooth', 0.2);
  }

  public playDoorBang() {
    this.tone(110, 38, 0.24, 'sawtooth', 0.35);
    window.setTimeout(() => this.tone(95, 34, 0.22, 'square', 0.3), 180);
  }

  public playSquidwardAngry() {
    // Low sour clarinet-like honk
    this.tone(240, 155, 0.35, 'sawtooth', 0.25);
    window.setTimeout(() => this.tone(210, 130, 0.4, 'sawtooth', 0.25), 180);
  }

  public playZombieGrowl() {
    this.tone(115, 65, 0.42, 'sawtooth', 0.22);
  }

  public playJumpscare() {
    if (this.muted || this.sfxVolume <= 0.01) return;
    this.tone(540, 130, 0.55, 'sawtooth', 0.45);
    this.tone(585, 110, 0.55, 'square', 0.38);
    this.tone(95, 40, 0.65, 'triangle', 0.45);
  }

  public playCorrect() {
    this.tone(523.25, 523.25, 0.12, 'triangle', 0.22);
    window.setTimeout(() => this.tone(659.25, 659.25, 0.14, 'triangle', 0.22), 100);
    window.setTimeout(() => this.tone(783.99, 783.99, 0.24, 'triangle', 0.24), 200);
  }

  public playWrong() {
    this.tone(240, 160, 0.25, 'sawtooth', 0.26);
    window.setTimeout(() => this.tone(175, 110, 0.32, 'sawtooth', 0.26), 160);
  }

  public playMysteriousVoice() {
    this.tone(220, 165, 0.9, 'sine', 0.18);
    window.setTimeout(() => this.tone(277, 195, 0.8, 'triangle', 0.12), 200);
  }

  public playPortal() {
    this.tone(330, 880, 0.7, 'sine', 0.24);
  }
}

export const soundEngine = new SoundEngine();
