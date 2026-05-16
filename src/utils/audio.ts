class AudioEngine {
  private context: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    // We defer initialization until the first interaction to comply with browser autoplay policies
  }

  private init() {
    if (!this.context) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.context = new AudioContextClass();
      } catch (e) {
        console.warn('Web Audio API is not supported in this browser');
        this.isEnabled = false;
      }
    }
    
    // Resume context if it was suspended (autoplay policy)
    if (this.context && this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  public playPop(player: 'X' | 'O') {
    if (!this.isEnabled) return;
    this.init();
    if (!this.context) return;

    const t = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    // X gets a slightly higher pitch than O
    const frequency = player === 'X' ? 600 : 400;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, t);
    osc.frequency.exponentialRampToValueAtTime(frequency / 2, t + 0.1);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.context.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playWin() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.context) return;

    // Play a nice arpeggio chord
    const frequencies = [440, 554.37, 659.25, 880]; // A major chord
    const t = this.context.currentTime;

    frequencies.forEach((freq, index) => {
      const osc = this.context!.createOscillator();
      const gain = this.context!.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      const startTime = t + index * 0.1;
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

      osc.connect(gain);
      gain.connect(this.context!.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.6);
    });
  }

  public playDraw() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.context) return;

    const t = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.linearRampToValueAtTime(150, t + 0.3);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.context.destination);

    osc.start(t);
    osc.stop(t + 0.3);
  }
}

// Export a singleton instance
export const audio = new AudioEngine();
