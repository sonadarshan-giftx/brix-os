import { useState, useEffect, useRef, useCallback } from 'react';

/* ═══════════════════════════════════════════════════
   USE SPEECH — Voice-to-text + Text-to-speech
   Features:
   - Push-to-talk: hold button, speak, release
   - Always-on continuous listening mode
   - Wake word detection ("Hey Aria", "Aria")
   - Indian English accent default for TTS
   - Proper single-instance recognition management
   ═══════════════════════════════════════════════════ */

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [listeningMode, setListeningMode] = useState<'off' | 'pushtotalk' | 'continuous'>('off');

  // Core refs
  const recognitionRef = useRef<any>(null);
  const isRunningRef = useRef(false);
  const finalBufferRef = useRef('');
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modeRef = useRef<'off' | 'pushtotalk' | 'continuous'>('off');

  /* ── Sync mode ref ──────────────────── */
  useEffect(() => { modeRef.current = listeningMode; }, [listeningMode]);

  /* ── Load voices ────────────────────── */
  useEffect(() => {
    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length === 0) return;
      setVoices(available);

      const indianVoice = available.find(v =>
        v.lang.includes('en-IN') ||
        v.name.includes('Raveena') ||
        v.name.includes('Aditi') ||
        v.name.includes('Ivy') ||
        v.name.includes('Neerja')
      );
      const englishVoice = available.find(v =>
        v.lang.startsWith('en') ||
        v.name.includes('Google US English') ||
        v.name.includes('Samantha')
      );
      setSelectedVoice(indianVoice || englishVoice || available[0] || null);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  /* ── Stop any running recognition ───── */
  const stopRecognition = useCallback(() => {
    isRunningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* */ }
      recognitionRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    setIsListening(false);
    setListeningMode('off');
    setInterimTranscript('');
  }, []);

  /* ── Create recognition instance ────── */
  const createRecognition = useCallback((mode: 'pushtotalk' | 'continuous') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError('Speech recognition not supported. Use Chrome or Edge.');
      return null;
    }

    // Stop any existing instance first
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* */ }
      recognitionRef.current = null;
    }

    setSpeechError(null);

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    recognition.maxAlternatives = 1;

    let localBuffer = '';

    recognition.onstart = () => {
      isRunningRef.current = true;
      setIsListening(true);
      setListeningMode(mode);
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let finalChunk = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const t = result[0].transcript;
        if (result.isFinal) {
          finalChunk += t + ' ';
        } else {
          interim += t;
        }
      }

      setInterimTranscript(interim);

      if (finalChunk) {
        localBuffer += finalChunk;
        finalBufferRef.current = localBuffer.trim();
        setTranscript(finalBufferRef.current);

        // In push-to-talk mode, auto-stop after 2 seconds of silence
        if (mode === 'pushtotalk') {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            stopRecognition();
          }, 2000);
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') return; // Ignore no-speech
      if (event.error === 'aborted') return;   // Ignore abort (we trigger this)
      setSpeechError(`Speech error: ${event.error}. Try again.`);
      isRunningRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      // Only restart in continuous mode and only if we haven't explicitly stopped
      if (modeRef.current === 'continuous' && isRunningRef.current) {
        setTimeout(() => {
          if (modeRef.current === 'continuous' && isRunningRef.current) {
            try {
              const newRec = createRecognition('continuous');
              newRec?.start();
            } catch { /* */ }
          }
        }, 300);
      } else {
        isRunningRef.current = false;
        setIsListening(false);
        setListeningMode('off');
      }
    };

    recognitionRef.current = recognition;
    return recognition;
  }, [stopRecognition]);

  /* ── Push to Talk ───────────────────── */
  const startPushToTalk = useCallback(() => {
    finalBufferRef.current = '';
    setTranscript('');
    setInterimTranscript('');

    const recognition = createRecognition('pushtotalk');
    if (recognition) {
      try { recognition.start(); } catch (e) {
        setSpeechError('Could not start microphone. Check permissions.');
      }
    }
  }, [createRecognition]);

  /* ── Continuous Listening ───────────── */
  const startContinuousListening = useCallback(() => {
    finalBufferRef.current = '';
    setTranscript('');
    setInterimTranscript('');

    const recognition = createRecognition('continuous');
    if (recognition) {
      try { recognition.start(); } catch (e) {
        setSpeechError('Could not start microphone. Check permissions.');
      }
    }
  }, [createRecognition]);

  /* ── Stop listening ─────────────────── */
  const stopListening = useCallback(() => {
    isRunningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* */ }
      recognitionRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    setIsListening(false);
    setListeningMode('off');
    setInterimTranscript('');
  }, []);

  /* ── Reset transcript ───────────────── */
  const resetTranscript = useCallback(() => {
    finalBufferRef.current = '';
    setTranscript('');
    setInterimTranscript('');
  }, []);

  /* ── Check wake word in text ────────── */
  const detectWakeWord = useCallback((text: string): boolean => {
    const lower = text.toLowerCase().trim();
    const phrases = ['hey aria', 'okay aria', 'hi aria', 'hello aria', 'yo aria', 'hey sage', 'hey pixel', 'hey echo', 'hey kai'];
    for (const p of phrases) {
      if (lower.includes(p)) return true;
    }
    // Fuzzy match for "Aria" variations
    const ariaMatch = lower.match(/\b(ar[yi]?a|area|aaria|arya|ariah|ariya|areya)\b/);
    return !!ariaMatch;
  }, []);

  /* ── Text-to-Speech ─────────────────── */
  const speak = useCallback((text: string, voiceName?: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    let voice = selectedVoice;
    if (voiceName) {
      voice = voices.find(v => v.name === voiceName) || selectedVoice;
    }
    if (voice) utterance.voice = voice;

    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [voices, selectedVoice]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  /* ── Cleanup on unmount ─────────────── */
  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* */ }
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  return {
    // Listening state
    isListening,
    listeningMode, // 'off' | 'pushtotalk' | 'continuous'

    // Transcript
    transcript,
    interimTranscript,
    speechError,

    // Controls
    startPushToTalk,
    startContinuousListening,
    stopListening,
    resetTranscript,

    // Wake word helper
    detectWakeWord,

    // TTS
    isSpeaking,
    voices,
    selectedVoice,
    setSelectedVoice,
    speak,
    stopSpeaking,
  };
}
