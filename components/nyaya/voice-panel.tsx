'use client';

/**
 * voice-panel.tsx — Standalone Voice UI Panel for Nyaya AI.
 *
 * Shows:
 *   - A large, animated microphone button for Speech-to-Text recording.
 *   - Real-time status: Idle → Recording → Transcribing → Done.
 *   - A Text-to-Speech section: paste/type text and play it back.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, Square, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { transcribeAudio, synthesizeSpeech } from '@/lib/speech';

// ─── Types ────────────────────────────────────────────────────────────────────

type RecordState = 'idle' | 'recording' | 'transcribing' | 'done' | 'error';
type SpeakState  = 'idle' | 'loading'  | 'playing'     | 'error';

// ─── STT Section ──────────────────────────────────────────────────────────────

interface STTSectionProps {
  onTranscribed?: (text: string) => void;
}

export function STTSection({ onTranscribed }: STTSectionProps) {
  const [state, setState] = React.useState<RecordState>('idle');
  const [transcript, setTranscript] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  // Cleanup on unmount
  React.useEffect(() => () => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const startRecording = async () => {
    setTranscript('');
    setErrorMsg('');

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMsg('Audio recording is not supported in this browser.');
      setState('error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      streamRef.current = stream;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e: BlobEvent) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;

        if (chunks.length === 0) {
          setErrorMsg('No audio captured. Please try again.');
          setState('error');
          return;
        }

        setState('transcribing');
        try {
          const text = await transcribeAudio(
            new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
          );
          setTranscript(text);
          setState('done');
          onTranscribed?.(text);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Transcription failed.';
          setErrorMsg(msg);
          setState('error');
          toast.error(msg);
        }
      };

      recorder.start();
      setState('recording');
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow access and try again.'
          : 'Could not access microphone.';
      setErrorMsg(msg);
      setState('error');
      toast.error(msg);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const reset = () => {
    setTranscript('');
    setErrorMsg('');
    setState('idle');
  };

  const isRecording   = state === 'recording';
  const isTranscribing = state === 'transcribing';
  const isDone        = state === 'done';
  const isError       = state === 'error';

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Big mic button */}
      <div className="relative flex items-center justify-center">
        {/* Pulsing ring — only when recording */}
        {isRecording && (
          <>
            <span className="absolute inline-flex h-28 w-28 animate-ping rounded-full bg-rose-500/20" />
            <span className="absolute inline-flex h-24 w-24 animate-ping rounded-full bg-rose-500/30 delay-150" style={{ animationDelay: '0.3s' }} />
          </>
        )}

        <motion.button
          whileTap={{ scale: 0.93 }}
          whileHover={{ scale: isTranscribing ? 1 : 1.04 }}
          onClick={isRecording ? stopRecording : (isDone || isError ? reset : startRecording)}
          disabled={isTranscribing}
          className={cn(
            'relative z-10 flex h-20 w-20 items-center justify-center rounded-full shadow-xl transition-all duration-300',
            isRecording
              ? 'bg-rose-500 text-white shadow-rose-500/40'
              : isTranscribing
              ? 'cursor-not-allowed bg-primary/20 text-primary'
              : isDone
              ? 'bg-emerald-500 text-white shadow-emerald-500/40'
              : isError
              ? 'bg-destructive/20 text-destructive'
              : 'bg-gradient-to-br from-primary to-accent text-white shadow-primary/40'
          )}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isTranscribing ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : isRecording ? (
            <Square className="h-7 w-7 fill-current" />
          ) : isDone ? (
            <CheckCircle2 className="h-8 w-8" />
          ) : isError ? (
            <AlertCircle className="h-8 w-8" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </motion.button>
      </div>

      {/* Status label */}
      <AnimatePresence mode="wait">
        <motion.p
          key={state}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className={cn(
            'text-center text-sm font-medium',
            isRecording   && 'text-rose-500',
            isTranscribing && 'text-primary',
            isDone        && 'text-emerald-500',
            isError       && 'text-destructive',
            state === 'idle' && 'text-muted-foreground'
          )}
        >
          {state === 'idle'        && 'Tap the mic to start speaking'}
          {isRecording             && '🔴 Recording… tap again to stop'}
          {isTranscribing          && 'Transcribing your speech with Whisper…'}
          {isDone                  && '✓ Transcription complete'}
          {isError                 && (errorMsg || 'Something went wrong')}
        </motion.p>
      </AnimatePresence>

      {/* Transcript result */}
      <AnimatePresence>
        {(isDone || isError) && transcript && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass w-full rounded-2xl p-4"
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Transcript
            </p>
            <p className="text-sm leading-relaxed text-foreground">{transcript}</p>
            <button
              onClick={reset}
              className="mt-3 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Record again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── TTS Section ──────────────────────────────────────────────────────────────

export function TTSSection() {
  const [text, setText] = React.useState(
    'Article 21 of the Constitution of India guarantees the right to life and personal liberty.'
  );
  const [speakState, setSpeakState] = React.useState<SpeakState>('idle');
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = React.useRef<string | null>(null);

  React.useEffect(() => () => {
    audioRef.current?.pause();
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
  }, []);

  const stopAudio = () => {
    audioRef.current?.pause();
    if (audioUrlRef.current) { URL.revokeObjectURL(audioUrlRef.current); audioUrlRef.current = null; }
    audioRef.current = null;
    setSpeakState('idle');
  };

  const speak = async () => {
    if (speakState === 'playing') { stopAudio(); return; }
    if (!text.trim()) { toast.error('Please enter some text to speak.'); return; }

    setSpeakState('loading');
    try {
      const blob = await synthesizeSpeech(text.trim());
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        if (audioUrlRef.current) { URL.revokeObjectURL(audioUrlRef.current); audioUrlRef.current = null; }
        audioRef.current = null;
        setSpeakState('idle');
      };
      audio.onerror = () => {
        stopAudio();
        setSpeakState('error');
        toast.error('Failed to play the audio.');
      };
      await audio.play();
      setSpeakState('playing');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Text-to-speech failed.';
      setSpeakState('error');
      toast.error(msg);
    }
  };

  const isLoading = speakState === 'loading';
  const isPlaying = speakState === 'playing';
  const isError   = speakState === 'error';

  return (
    <div className="flex flex-col gap-4">
      {/* Text input */}
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); if (isPlaying) stopAudio(); }}
        rows={4}
        placeholder="Type or paste text to hear it spoken…"
        className="glass w-full resize-none rounded-2xl p-4 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50"
      />

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          onClick={speak}
          disabled={isLoading || !text.trim()}
          size="lg"
          className={cn(
            'flex-1 rounded-xl gap-2 h-12 font-semibold transition-all',
            isPlaying && 'bg-rose-500 hover:bg-rose-600'
          )}
        >
          {isLoading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Generating audio…</>
          ) : isPlaying ? (
            <><Square className="h-4 w-4 fill-current" /> Stop</>
          ) : (
            <><Volume2 className="h-4 w-4" /> Listen with Piper TTS</>
          )}
        </Button>

        {(isPlaying || isError) && (
          <button
            onClick={stopAudio}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            aria-label="Stop audio"
          >
            <MicOff className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Status */}
      <AnimatePresence>
        {(isLoading || isPlaying || isError) && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'text-center text-xs font-medium',
              isLoading && 'text-primary',
              isPlaying && 'text-emerald-500',
              isError   && 'text-destructive'
            )}
          >
            {isLoading && '⏳ Fetching audio from Piper TTS server…'}
            {isPlaying && '🔊 Playing audio — powered by Piper ONNX (Hindi voice)'}
            {isError   && '⚠ Audio generation failed. Is the backend running?'}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Combined Panel ────────────────────────────────────────────────────────────

export function VoicePanel({ onTranscribed }: { onTranscribed?: (text: string) => void }) {
  const [tab, setTab] = React.useState<'stt' | 'tts'>('stt');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-3xl p-6 sm:p-8"
    >
      {/* Tab header */}
      <div className="mb-6 flex items-center gap-1 rounded-xl bg-muted/40 p-1">
        <button
          onClick={() => setTab('stt')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all',
            tab === 'stt'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Mic className="h-4 w-4" />
          Speech → Text
        </button>
        <button
          onClick={() => setTab('tts')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all',
            tab === 'tts'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Volume2 className="h-4 w-4" />
          Text → Speech
        </button>
      </div>

      {/* Panel content */}
      <AnimatePresence mode="wait">
        {tab === 'stt' ? (
          <motion.div
            key="stt"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <STTSection onTranscribed={onTranscribed} />
          </motion.div>
        ) : (
          <motion.div
            key="tts"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <TTSSection />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Powered-by footer */}
      <div className="mt-6 border-t border-border/60 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Mic className="h-3 w-3" />
          STT: OpenAI Whisper (base model)
        </span>
        <span className="flex items-center gap-1.5">
          <Volume2 className="h-3 w-3" />
          TTS: Piper ONNX · hi_IN-pratham-medium
        </span>
      </div>
    </motion.div>
  );
}
