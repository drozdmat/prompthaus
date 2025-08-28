class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;
  private volume: number = 0.3;
  private initialized: boolean = false;

  constructor() {
    // Inicjalizacja tylko po stronie klienta
    if (typeof window !== 'undefined') {
      this.initializeSounds();
    }
  }

  private initializeSounds() {
    if (this.initialized || typeof window === 'undefined') return;
    
    try {
      // Tworzenie dźwięków programowo (bez plików audio)
      this.createBeepSound('feed', 800, 0.1);
      this.createBeepSound('play', 600, 0.15);
      this.createBeepSound('sleep', 400, 0.2);
      this.createBeepSound('levelup', 1200, 0.2);
      this.createBeepSound('achievement', 1000, 0.3);
      this.createBeepSound('death', 200, 0.4);
      this.initialized = true;
    } catch (error) {
      console.warn('Błąd inicjalizacji dźwięków:', error);
    }
  }

  private createBeepSound(name: string, frequency: number, duration: number) {
    if (typeof window === 'undefined') return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);

      // Zapisz referencję do dźwięku
      const audio = new Audio();
      this.sounds.set(name, audio);
    } catch (error) {
      console.warn('Błąd tworzenia dźwięku:', error);
    }
  }

  play(soundName: string) {
    if (!this.enabled || typeof window === 'undefined') return;

    try {
      const sound = this.sounds.get(soundName);
      if (sound) {
        sound.volume = this.volume;
        sound.currentTime = 0;
        sound.play().catch(() => {
          // Ignoruj błędy autoplay
        });
      }
    } catch (error) {
      console.warn('Błąd odtwarzania dźwięku:', error);
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  toggleSound() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  isEnabled() {
    return this.enabled;
  }
}

// Singleton instance
export const soundManager = new SoundManager();

// Funkcje pomocnicze
export const playFeedSound = () => soundManager.play('feed');
export const playPlaySound = () => soundManager.play('play');
export const playSleepSound = () => soundManager.play('sleep');
export const playLevelUpSound = () => soundManager.play('levelup');
export const playAchievementSound = () => soundManager.play('achievement');
export const playDeathSound = () => soundManager.play('death');
