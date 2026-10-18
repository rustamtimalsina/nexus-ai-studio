/**
 * Resilient Audio Service:
 * 1. Speech-to-Text (Voice Recognition) with fresh instance recreation per session
 * 2. Web Audio API frequency analyzer for 3D visualizer
 * 3. Text-to-Speech with Chromium audio keep-alive
 */

class AudioService {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private recognition: any = null;
  private isListening = false;
  private isSpeaking = false;
  private freqData: Uint8Array | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  // Initialize microphone listener for audio-reactive 3D visualizer
  async initMicVisualizer(): Promise<boolean> {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }

      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      if (this.audioCtx && !this.micStream && navigator.mediaDevices?.getUserMedia) {
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        const source = this.audioCtx.createMediaStreamSource(this.micStream);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyser.smoothingTimeConstant = 0.8;
        source.connect(this.analyser);
        this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      }
      return true;
    } catch (err) {
      console.warn('Microphone stream access unavailable for visualizer:', err);
      return false;
    }
  }

  // Get normalized audio energy level (0.0 to 1.0)
  getAudioLevel(): number {
    if (!this.analyser || !this.freqData) return 0;
    try {
      (this.analyser.getByteFrequencyData as any)(this.freqData);
      let sum = 0;
      for (let i = 0; i < this.freqData.length; i++) {
        sum += this.freqData[i];
      }
      const avg = sum / this.freqData.length;
      return Math.min(avg / 128, 1.0);
    } catch {
      return 0;
    }
  }

  // Start voice recognition
  startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ): boolean {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError('Speech Recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return false;
    }

    if (this.isListening) {
      this.stopListening();
    }

    try {
      // Create fresh recognition instance every time to avoid InvalidStateError
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.isListening = true;

      // Try initializing visualizer in background (non-blocking)
      this.initMicVisualizer().catch(() => {});

      this.recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        onResult(final || interim, Boolean(final));
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition status:', event.error);
        if (event.error === 'not-allowed') {
          onError('Microphone permission denied. Please allow microphone access in your browser settings.');
        } else if (event.error !== 'no-speech') {
          onError(`Speech recognition notice: ${event.error}`);
        }
        this.isListening = false;
        onEnd();
      };

      this.recognition.onend = () => {
        this.isListening = false;
        onEnd();
      };

      this.recognition.start();
      return true;
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      onError(err?.message || 'Speech recognition initialization failed.');
      this.isListening = false;
      onEnd();
      return false;
    }
  }

  // Stop voice recognition
  stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }
    this.isListening = false;
  }

  // Text-To-Speech with Chromium keep-alive
  speak(text: string, onStart?: () => void, onEnd?: () => void): void {
    if (!('speechSynthesis' in window)) return;

    this.stopSpeaking();

    // Clean text: strip code blocks, math symbols, markdown
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/\$\$[\s\S]*?\$\$/g, 'Formula calculated.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*#_~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .slice(0, 600);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    this.currentUtterance = utterance;
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Pick a natural voice if available
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          (v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Samantha') ||
            v.name.includes('Daniel') ||
            v.name.includes('Jenny')) &&
          v.lang.startsWith('en')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    };

    setVoice();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = setVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    // Chromium fix: resume before speak
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.speak(utterance);
  }

  stopSpeaking(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
    }
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  getIsListening(): boolean {
    return this.isListening;
  }
}

export const audioService = new AudioService();
