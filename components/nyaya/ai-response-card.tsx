'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import { CitationList, type Citation } from '@/components/nyaya/citation-card';
import { TypingDots } from '@/components/nyaya/loading';
import { cn } from '@/lib/utils';

export interface AIResponse {
  id: string;
  content: string;
  citations?: Citation[];
  pending?: boolean;
}

export function AIResponseCard({ response }: { response: AIResponse }) {
  const [copied, setCopied] = React.useState(false);
  const [feedback, setFeedback] = React.useState<'up' | 'down' | null>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(response.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

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
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-sm font-semibold">Nyaya AI</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
              Verified
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

          {!response.pending && response.citations && response.citations.length > 0 && (
            <CitationList citations={response.citations} />
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
