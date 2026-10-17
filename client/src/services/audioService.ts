/**
 * Audio Service providing:
 * 1. Microphone capture & Web Audio API Analyser for real-time frequency reactivity
 * 2. Speech-to-Text (Voice Recognition)
 * 3. Text-to-Speech (Speech Synthesis)
 */

class AudioService {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private recognition: any = null;
  private isListening = false;
  private isSpeaking = false;
  private freqData: Uint8Array | null = null;

  constructor() {
    // Setup Speech Recognition if supported
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
    }
  }

  // Initialize microphone listener for audio-reactive 3D visualizer
  async initMicVisualizer(): Promise<boolean> {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      if (!this.micStream) {
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
      console.warn('Microphone access denied or unavailable for visualizer:', err);
      return false;
    }
  }

  // Get normalized audio energy level (0.0 to 1.0)
  getAudioLevel(): number {
    if (!this.analyser || !this.freqData) return 0;
    (this.analyser.getByteFrequencyData as any)(this.freqData);

    let sum = 0;
    for (let i = 0; i < this.freqData.length; i++) {
      sum += this.freqData[i];
    }
    const avg = sum / this.freqData.length;
    return Math.min(avg / 128, 1.0); // Normalized
  }

  // Start voice recognition
  startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ): boolean {
    if (!this.recognition) {
      onError('Speech Recognition is not supported in this browser. Try Chrome, Edge, or Safari.');
      return false;
    }

    if (this.isListening) {
      this.stopListening();
      return false;
    }

    try {
      this.initMicVisualizer();
      this.isListening = true;

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
        console.error('Speech recognition error:', event.error);
        onError(event.error);
        this.isListening = false;
      };

      this.recognition.onend = () => {
        this.isListening = false;
        onEnd();
      };

      this.recognition.start();
      return true;
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      onError(err?.message || 'Speech recognition failed to start');
      this.isListening = false;
      return false;
    }
  }

  // Stop voice recognition
  stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {}
      this.isListening = false;
    }
  }

  // Text-To-Speech
  speak(text: string, onStart?: () => void, onEnd?: () => void): void {
    if (!('speechSynthesis' in window)) return;

    this.stopSpeaking();

    // Strip code blocks and markdown syntax from spoken text
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*#_~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .slice(0, 500); // speak first 500 chars for concise voice response

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Pick a natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')) &&
        v.lang.startsWith('en')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  stopSpeaking(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
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
