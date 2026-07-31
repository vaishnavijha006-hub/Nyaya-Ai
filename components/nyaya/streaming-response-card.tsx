'use client';

/**
 * StreamingResponseCard.tsx — Phase 8 Streaming Chat Bubble for Nyaya AI.
 * Renders status indicator → streaming text → source cards → action bar.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, ThumbsUp, ThumbsDown, Sparkles, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { SourceCardList } from '@/components/nyaya/source-card';
import { StreamingStatus, StreamCursor } from '@/components/nyaya/streaming-status';
import { cn } from '@/lib/utils';
import { synthesizeSpeech } from '@/lib/speech';
import type { SourceCitation } from '@/components/nyaya/source-card';

// Language metadata map (mirrors ai-response-card.tsx)
const languageMeta: Record<string, { flag: string; label: string; style: string }> = {
  en: { flag: '🇬🇧', label: 'English',   style: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  hi: { flag: '🇮🇳', label: 'Hindi',     style: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
  mr: { flag: '🇮🇳', label: 'Marathi',   style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  ta: { flag: '🇮🇳', label: 'Tamil',     style: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  te: { flag: '🇮🇳', label: 'Telugu',    style: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  bn: { flag: '🇮🇳', label: 'Bengali',   style: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' },
  gu: { flag: '🇮🇳', label: 'Gujarati',  style: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' },
  kn: { flag: '🇮🇳', label: 'Kannada',   style: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
  ml: { flag: '🇮🇳', label: 'Malayalam', style: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
  pa: { flag: '🇮🇳', label: 'Punjabi',   style: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20' },
  ur: { flag: '🇮🇳', label: 'Urdu',      style: 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/20' },
};

export interface StreamingResponseCardProps {
  /** Accumulated streamed text from useStreamingChat */
  streamedText: string;
  /** Latest status message from backend */
  statusMessage: string | null;
  /** True once first token arrived */
  isStreaming: boolean;
  /** True once done event received */
  isDone: boolean;
  /** Phase 6 citations from sources event */
  sourceCitations: SourceCitation[];
  /** Error string if stream failed */
  error?: string | null;
  /** ISO language code detected by backend */
  detectedLanguage?: string;
}

export function StreamingResponseCard({
  streamedText,
  statusMessage,
  isStreaming,
  isDone,
  sourceCitations,
  error,
  detectedLanguage = 'en',
}: StreamingResponseCardProps) {
  const [copied, setCopied] = React.useState(false);
  const [feedback, setFeedback] = React.useState<'up' | 'down' | null>(null);
  const [speaking, setSpeaking] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  // Mutable ref for the text container — updated directly to avoid reconciliation
  const textRef = React.useRef<HTMLParagraphElement>(null);

  // Keep DOM text node in sync with streamedText without a React re-render
  React.useEffect(() => {
    if (textRef.current) {
      textRef.current.textContent = streamedText;
    }
  }, [streamedText]);

  React.useEffect(
    () => () => {
      audioRef.current?.pause();
      if (audioRef.current?.src) URL.revokeObjectURL(audioRef.current.src);
    },
    []
  );

  const copy = async () => {
    if (!streamedText) return;
    try {
      await navigator.clipboard.writeText(streamedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard unavailable */ }
  };

  const audioUrlRef = React.useRef<string | null>(null);

  const speak = async (): Promise<void> => {
    if (audioRef.current) {
      audioRef.current.pause();
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      audioRef.current = null;
      setSpeaking(false);
      return;
    }
    if (!streamedText) return;
    setSpeaking(true);
    try {
      const blob = await synthesizeSpeech(streamedText);
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      const audioUrl = URL.createObjectURL(blob);
      audioUrlRef.current = audioUrl;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
        audioRef.current = null;
        setSpeaking(false);
      };
      await audio.play();
    } catch (err) {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      setSpeaking(false);
      audioRef.current = null;
      toast.error(err instanceof Error ? err.message : 'Could not play audio response.');
    }
  };

  const langMeta =
    languageMeta[detectedLanguage] ??
    { flag: '🇮🇳', label: 'Indic', style: 'bg-accent/10 text-accent border-accent/20' };

  const showContent = isStreaming || isDone;
  const showActions = isDone && !error;
  const showSources = isDone && sourceCitations.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="glass-strong rounded-3xl p-5 sm:p-6"
    >
      <div className="flex items-start gap-3">
        {/* Nyaya AI avatar */}
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-md shadow-primary/30">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Nyaya AI</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                Verified
              </span>
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold shadow-sm uppercase tracking-wide',
                langMeta.style
              )}
            >
              <span className="text-xs" aria-hidden="true">{langMeta.flag}</span>
              {langMeta.label}
            </span>
          </div>

          {/* ── Phase 8: Status indicator ─────────────────────────────────── */}
          <StreamingStatus
            statusMessage={statusMessage}
            isStreaming={isStreaming}
            isDone={isDone}
          />

          {/* ── Streaming / final text ────────────────────────────────────── */}
          {showContent && (
            <div
              aria-live="polite"
              aria-label="Legal answer"
              className="relative"
            >
              {/* Text node updated via ref — no React reconciliation */}
              <p
                ref={textRef}
                className="whitespace-pre-line text-[15px] leading-relaxed text-foreground/90"
              />
              {/* Blinking cursor — visible only while streaming */}
              {isStreaming && !isDone && <StreamCursor />}
            </div>
          )}

          {/* Error state */}
          {error && (
            <p className="mt-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
              ⚠️ {error}
            </p>
          )}

          {/* ── Source Cards (Phase 7) — after sources event ──────────────── */}
          {showSources && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
            >
              <SourceCardList citations={sourceCitations} />
            </motion.div>
          )}

          {/* ── Action bar — only after done ──────────────────────────────── */}
          {showActions && (
            <div className="mt-4 flex items-center gap-1 border-t border-border/60 pt-3">
              <button
                onClick={copy}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={copied ? 'Copied to clipboard' : 'Copy answer to clipboard'}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </button>

              <button
                onClick={speak}
                aria-label={speaking ? 'Stop audio response' : 'Play audio response'}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  speaking && 'text-primary'
                )}
              >
                <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                {speaking ? 'Stop' : 'Listen'}
              </button>

              <button
                onClick={() => setFeedback('up')}
                aria-label="Mark answer as helpful"
                aria-pressed={feedback === 'up'}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  feedback === 'up' && 'text-emerald-500'
                )}
              >
                <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
              </button>

              <button
                onClick={() => setFeedback('down')}
                aria-label="Mark answer as not helpful"
                aria-pressed={feedback === 'down'}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  feedback === 'down' && 'text-rose-500'
                )}
              >
                <ThumbsDown className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
