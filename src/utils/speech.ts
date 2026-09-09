/**
 * Offline Voice Alert Engine
 * Uses browser Web Speech API (speechSynthesis) and Web Audio API oscillators.
 * Operates 100% locally and offline without external network requests.
 */

class AudioAlertService {
  private synth: SpeechSynthesis | null = null;
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private voicesLoaded: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
        // Pre-warm voices
        if (this.synth.onvoiceschanged !== undefined) {
          this.synth.onvoiceschanged = () => {
            this.voicesLoaded = true;
          };
        }
      }
    }
  }

  private initAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.synth) {
      this.synth.cancel();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Plays a distinct mission buzzer or confirmation chime using offline Web Audio synth
   */
  public playTone(type: 'warning' | 'success' | 'info') {
    if (this.isMuted) return;
    try {
      const ctx = this.initAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'warning') {
        // Two-tone warning buzzer
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(320, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'success') {
        // High-pitched pleasant confirmation chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else {
        // Subtle click/tick
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  /**
   * Speaks text using offline client speech synthesis (like pyttsx3 in Python)
   */
  public speak(text: string, isWarning: boolean = false) {
    if (this.isMuted) return;

    this.playTone(isWarning ? 'warning' : 'success');

    if (!this.synth) return;

    try {
      // Cancel previous utterances to avoid queue backlog
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = isWarning ? 1.05 : 1.0;
      utterance.volume = 1.0;

      // Select an English voice if available
      const voices = this.synth.getVoices();
      const englishVoice = voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('English')));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      this.synth.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis offline fallback:', err);
    }
  }

  /**
   * Speak SOP skip warning
   */
  public speakWarning(requiredStepNumber: number, stepTitle: string) {
    const text = `Warning! Please complete Step ${requiredStepNumber}, ${stepTitle}, first.`;
    this.speak(text, true);
  }

  /**
   * Speak Step Success
   */
  public speakStepCompleted(stepNumber: number, stepTitle: string, nextTitle?: string) {
    let text = `Step ${stepNumber} verified: ${stepTitle} completed.`;
    if (nextTitle) {
      text += ` Next step: ${nextTitle}.`;
    } else {
      text += ` All BAS experiment steps successfully completed.`;
    }
    this.speak(text, false);
  }
}

export const audioAlert = new AudioAlertService();
