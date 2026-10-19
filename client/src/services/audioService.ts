/**
 * Universal Resilient Audio Service:
 * 1. Speech-to-Text (STT) compatible with Desktop Chrome, Edge, Safari, and Mobile.
 * 2. Brave Browser detection and clear resolution for Brave's privacy shield.
 * 3. Text-to-Speech (TTS) with Chromium audio keep-alive and natural voice selection.
 * 4. Fallback HTML5 MediaRecorder audio capture.
 */

class AudioService {
  private recognition: any = null;
  private isListening = false;
  private isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private accumulatedText = '';
  private restartTimer: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedAudioChunks: Blob[] = [];
  private micStream: MediaStream | null = null;

  // Platform detection
  private isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent || '');
  public isBrave =
    typeof navigator !== 'undefined' &&
    Boolean((navigator as any).brave || ((window as any).chrome && !(window as any).google && !/Edg/.test(navigator.userAgent)));

  // Check if browser has speech recognition
  isSpeechSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  // Energy level for 3D visualizer
  getAudioLevel(): number {
    return 0;
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
      onError('Speech Recognition is not supported in this browser. Please open in Google Chrome, Microsoft Edge, or Safari.');
      return false;
    }

    // Reset previous session
    this.stopListening();

    this.isListening = true;
    this.accumulatedText = '';

    const setupAndStart = () => {
      if (!this.isListening) return;

      try {
        const recognition = new SpeechRecognition();
        this.recognition = recognition;

        // In iOS WebKit, continuous: true silently breaks speech recognition.
        // On Desktop Chrome, continuous: true allows long streaming dictation.
        recognition.continuous = !this.isIOS;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.lang = navigator.language || 'en-US';

        let latestSessionTranscript = '';

        recognition.onstart = () => {
          console.log('[Voice STT] Speech recognition started');
        };

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';

          for (let i = 0; i < event.results.length; ++i) {
            const item = event.results[i];
            if (item && item[0]) {
              if (item.isFinal) {
                final += item[0].transcript;
              } else {
                interim += item[0].transcript;
              }
            }
          }

          latestSessionTranscript = (final || interim).trim();

          const combined = [this.accumulatedText, latestSessionTranscript]
            .filter(Boolean)
            .join(' ')
            .trim();

          if (combined) {
            onResult(combined, Boolean(final));
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('[Voice STT] Status/Error event:', event.error);

          // Benign events in Web Speech API: do not abort
          if (event.error === 'no-speech' || event.error === 'aborted') {
            return;
          }

          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            this.isListening = false;
            onError('Microphone access was denied. Please allow microphone permissions in your browser URL bar.');
            onEnd();
            return;
          }

          if (event.error === 'audio-capture') {
            this.isListening = false;
            onError('Microphone not detected or busy with another application.');
            onEnd();
            return;
          }

          // Brave Browser blocks Google Speech servers by default for privacy
          if (event.error === 'network') {
            this.isListening = false;
            const isBraveUser =
              Boolean((navigator as any).brave) ||
              /Brave/i.test(navigator.userAgent || '') ||
              window.location.hostname.includes('vercel.app');

            if (isBraveUser) {
              onError(
                '🦁 Brave Browser blocks Google Voice Recognition by default. In Brave: go to brave://settings/privacy, turn ON "Use Google services for voice recognition", then refresh (or open in Google Chrome / Edge).'
              );
            } else {
              onError(
                'Speech recognition service is blocked by your browser network or firewall. Please try in Google Chrome or Microsoft Edge.'
              );
            }
            onEnd();
            return;
          }
        };

        recognition.onend = () => {
          console.log('[Voice STT] Recognition session ended');

          // If session produced text, save it into accumulated history
          if (latestSessionTranscript) {
            this.accumulatedText = [this.accumulatedText, latestSessionTranscript]
              .filter(Boolean)
              .join(' ')
              .trim();
            latestSessionTranscript = '';
          }

          // If the user hasn't explicitly clicked stop, auto-restart fresh instance seamlessly
          if (this.isListening) {
            this.restartTimer = setTimeout(() => {
              if (this.isListening) {
                setupAndStart();
              }
            }, 100);
            return;
          }

          onEnd();
        };

        recognition.start();
      } catch (err: any) {
        console.error('[Voice STT] Initialization error:', err);
        this.isListening = false;
        onError(err?.message || 'Could not access speech recognition service.');
        onEnd();
      }
    };

    setupAndStart();
    return true;
  }

  // Stop voice recognition and terminate hardware audio streams
  stopListening(): void {
    this.isListening = false;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
      this.recognition = null;
    }
    // Hard terminate any active hardware media tracks to guarantee privacy
    if (this.micStream) {
      try {
        this.micStream.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
      } catch {}
      this.micStream = null;
    }
  }

  // Native MediaRecorder recording
  async startRecordingAudio(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return false;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.micStream = stream;
      this.mediaRecorder = new MediaRecorder(stream);
      this.recordedAudioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedAudioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(250);
      return true;
    } catch {
      return false;
    }
  }

  stopRecordingAudio(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.recordedAudioChunks, { type: mimeType });
        this.recordedAudioChunks = [];
        if (this.micStream) {
          this.micStream.getTracks().forEach((track) => track.stop());
          this.micStream = null;
        }
        this.mediaRecorder = null;
        resolve(blob);
      };

      try {
        this.mediaRecorder.stop();
      } catch {
        resolve(null);
      }
    });
  }

  // Text-To-Speech with Chromium audio keep-alive
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
