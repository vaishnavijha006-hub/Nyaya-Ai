'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, ThumbsUp, ThumbsDown, Sparkles, Volume2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { CitationList, type Citation } from '@/components/nyaya/citation-card';
import { SourceCardList, type SourceCitation } from '@/components/nyaya/source-card';
import { TypingDots } from '@/components/nyaya/loading';
import { cn } from '@/lib/utils';
import { synthesizeSpeech } from '@/lib/speech';

export interface AIResponse {
  id: string;
  content: string;
  citations?: Citation[];
  /** Phase 6: structured source citations — rendered as SourceCards */
  sourceCitations?: SourceCitation[];
  pending?: boolean;
  detected_language?: string;
}

import { ResearchNotesPanel } from '@/components/nyaya/research-notes-panel';

// Localized flag configurations mapped to ISO language codes
const languageMeta: Record<string, { flag: string; label: string; style: string }> = {
  en: { flag: '🇬🇧', label: 'English', style: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  hi: { flag: '🇮🇳', label: 'Hindi', style: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
  mr: { flag: '🇮🇳', label: 'Marathi', style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  ta: { flag: '🇮🇳', label: 'Tamil', style: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  te: { flag: '🇮🇳', label: 'Telugu', style: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  bn: { flag: '🇮🇳', label: 'Bengali', style: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' },
  gu: { flag: '🇮🇳', label: 'Gujarati', style: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' },
  kn: { flag: '🇮🇳', label: 'Kannada', style: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
  ml: { flag: '🇮🇳', label: 'Malayalam', style: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
  pa: { flag: '🇮🇳', label: 'Punjabi', style: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20' },
  ur: { flag: '🇮🇳', label: 'Urdu', style: 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/20' },
  hinglish: { flag: '🇮🇳', label: 'Hinglish', style: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' }
};

export function AIResponseCard({ response }: { response: AIResponse }) {
  const [copied, setCopied] = React.useState(false);
  const [feedback, setFeedback] = React.useState<'up' | 'down' | null>(null);
  const [speaking, setSpeaking] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => () => {
    audioRef.current?.pause();
    if (audioRef.current?.src) URL.revokeObjectURL(audioRef.current.src);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(response.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  const [loadingAudio, setLoadingAudio] = React.useState(false);

  const speak = async (): Promise<void> => {
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
      setSpeaking(false);
      setLoadingAudio(false);
      return;
    }

    setLoadingAudio(true);
    let audioUrl: string | null = null;
    try {
      const createdAudioUrl = URL.createObjectURL(await synthesizeSpeech(response.content));
      audioUrl = createdAudioUrl;
      const audio = new Audio(createdAudioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(createdAudioUrl);
        audioRef.current = null;
        setSpeaking(false);
      };
      setLoadingAudio(false);
      setSpeaking(true);
      await audio.play();
    } catch (error) {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setSpeaking(false);
      setLoadingAudio(false);
      audioRef.current = null;
      toast.error(error instanceof Error ? error.message : 'Could not play the audio response.');
    }
  };

  const langCode = response.detected_language || 'en';
  const metaLang = languageMeta[langCode] || { flag: '🇮🇳', label: 'Indic', style: 'bg-accent/10 text-accent border-accent/20' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="glass-strong rounded-3xl p-5 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-md shadow-primary/30">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Nyaya AI</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                Verified
              </span>
            </div>
            
            <span className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold shadow-sm uppercase tracking-wide', metaLang.style)}>
              <span className="text-xs">{metaLang.flag}</span>
              {metaLang.label}
            </span>
          </div>
          {response.pending ? (
            <div className="py-2">
              <TypingDots />
            </div>
          ) : (
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">
              {response.content}
            </p>
          )}

          {/* Phase 6: SourceCardList — renders when backend citations[] available */}
          {!response.pending && response.sourceCitations && response.sourceCitations.length > 0 && (
            <SourceCardList citations={response.sourceCitations} />
          )}

          {/* Legacy CitationList — fallback when only sources[] available */}
          {!response.pending && (!response.sourceCitations || response.sourceCitations.length === 0) && response.citations && response.citations.length > 0 && (
            <CitationList citations={response.citations} />
          )}

          {!response.pending && response.citations && response.citations.length > 0 && (
            <ResearchNotesPanel answer={response.content} citations={response.citations} />
          )}

          {!response.pending && (
            <div className="mt-4 flex items-center gap-1 border-t border-border/60 pt-3">
              <button
                onClick={copy}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={speak}
                disabled={loadingAudio}
                aria-label={speaking ? 'Stop audio response' : 'Play audio response'}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground',
                  (speaking || loadingAudio) && 'text-primary'
                )}
              >
                {loadingAudio ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
                {loadingAudio ? 'Loading...' : speaking ? 'Stop' : 'Listen'}
              </button>
              <button
                onClick={() => setFeedback('up')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent/10 hover:text-foreground',
                  feedback === 'up' && 'text-emerald-500'
                )}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setFeedback('down')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent/10 hover:text-foreground',
                  feedback === 'down' && 'text-rose-500'
                )}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
