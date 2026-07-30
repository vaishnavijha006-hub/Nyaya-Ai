'use client';

/**
 * StreamingStatus.tsx — Phase 8 Streaming Status Indicator for Nyaya AI.
 *
 * Displays a live progress indicator before and during LLM answer streaming.
 * Progresses through: Searching → Reading → Generating → (hidden when tokens arrive)
 *
 * Accessibility: aria-live="polite" region so screen readers announce status.
 * Performance: Pure CSS animations, no timers, purely driven by prop updates.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, Brain, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StreamPhase = 'idle' | 'searching' | 'reading' | 'generating' | 'streaming' | 'done';

interface StreamingStatusProps {
  /** Current status message from backend status events */
  statusMessage: string | null;
  /** Whether token streaming has started (hides the status bar) */
  isStreaming: boolean;
  /** Whether the full response is complete */
  isDone: boolean;
  className?: string;
}

// ── Icon + color map per status keyword ──────────────────────────────────────
function resolvePhaseFromMessage(msg: string): StreamPhase {
  const lower = msg.toLowerCase();
  if (lower.includes('searching')) return 'searching';
  if (lower.includes('reading')) return 'reading';
  if (lower.includes('generating')) return 'generating';
  return 'searching';
}

const phaseConfig: Record<StreamPhase, { icon: typeof Search; color: string; ring: string }> = {
  idle:       { icon: Search,       color: 'text-muted-foreground',                ring: 'ring-border' },
  searching:  { icon: Search,       color: 'text-sky-500 dark:text-sky-400',       ring: 'ring-sky-500/30' },
  reading:    { icon: BookOpen,     color: 'text-violet-500 dark:text-violet-400', ring: 'ring-violet-500/30' },
  generating: { icon: Brain,        color: 'text-amber-500 dark:text-amber-400',   ring: 'ring-amber-500/30' },
  streaming:  { icon: Brain,        color: 'text-emerald-500',                     ring: 'ring-emerald-500/30' },
  done:       { icon: CheckCircle2, color: 'text-emerald-500',                     ring: 'ring-emerald-500/30' },
};

// ── Blinking cursor for token streaming ──────────────────────────────────────
export function StreamCursor() {
  return (
    <span
      aria-hidden="true"
      className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[1px] rounded-full bg-primary animate-pulse"
    />
  );
}

// ── Main status component ─────────────────────────────────────────────────────
export function StreamingStatus({
  statusMessage,
  isStreaming,
  isDone,
  className,
}: StreamingStatusProps) {
  // Hide entirely once tokens start arriving or response is done
  if (isStreaming || isDone || !statusMessage) return null;

  const phase = resolvePhaseFromMessage(statusMessage);
  const { icon: Icon, color, ring } = phaseConfig[phase];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={statusMessage}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={cn('flex items-center gap-3 py-2', className)}
        // Accessibility: polite live region so screen readers read each status
        role="status"
        aria-live="polite"
        aria-label={statusMessage}
      >
        {/* Animated icon ring */}
        <div
          className={cn(
            'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-2',
            ring
          )}
        >
          {/* Pulsing outer ring */}
          <span
            className={cn(
              'absolute inset-0 rounded-xl ring-2 animate-ping opacity-30',
              ring
            )}
            aria-hidden="true"
          />
          <Icon className={cn('h-4 w-4', color)} aria-hidden="true" />
        </div>

        {/* Status text with step dots */}
        <div className="flex flex-col gap-0.5">
          <p className={cn('text-sm font-medium leading-tight', color)}>{statusMessage}</p>
          {/* Three animated progress dots */}
          <div className="flex items-center gap-1" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn('h-1 w-1 rounded-full animate-bounce', color.replace('text-', 'bg-'))}
                style={{ animationDelay: `${i * 0.18}s`, animationDuration: '0.9s' }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Streaming skeleton (shimmering placeholder lines while tokens come in) ───
export function StreamingSkeleton({ linesVisible = true }: { linesVisible?: boolean }) {
  if (!linesVisible) return null;
  return (
    <div className="space-y-2 py-1" aria-hidden="true">
      {[95, 80, 70].map((w, i) => (
        <div
          key={i}
          className="h-3 rounded-full bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer"
          style={{ width: `${w}%`, animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}
