'use client';

/**
 * SourceCard.tsx — Phase 7 Legal Source Cards for Nyaya AI.
 *
 * Renders structured citation metadata from the Phase 6 backend response.
 * Consumes the citations[] array returned by POST /chat.
 *
 * Features:
 *   - Color-coded confidence bar (green ≥95%, yellow 80-94%, red <80%)
 *   - Document type icon (Constitution / Act / Judgment)
 *   - Knowledge cluster badge for constitutional articles
 *   - Animated entry with stagger
 *   - Keyboard focusable, ARIA-labelled, high-contrast text
 *   - Mobile: vertical stack, Desktop: grid
 *   - Empty citations → renders nothing (no empty card)
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Scale, BookOpen, Gavel, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getClusterCategory } from '@/components/nyaya/knowledge-cluster-badge';

// ── Phase 6 CitationItem schema (mirrors backend Pydantic model) ──────────────
export interface SourceCitation {
  act_name: string;
  document_type: string;
  part?: string | null;
  chapter?: string | null;
  article?: string | null;
  section?: string | null;
  page?: number | null;
  confidence: number;
  chunk_id: string;
}

// ── Document type visual config ───────────────────────────────────────────────
const docTypeMeta: Record<string, { icon: typeof Scale; accent: string; badge: string }> = {
  Constitution: {
    icon: BookOpen,
    accent: 'from-violet-500 to-indigo-500',
    badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  },
  Act: {
    icon: Scale,
    accent: 'from-sky-500 to-cyan-500',
    badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  },
  Judgment: {
    icon: Gavel,
    accent: 'from-amber-500 to-orange-500',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  Unknown: {
    icon: FileText,
    accent: 'from-slate-500 to-slate-400',
    badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  },
};

function getDocTypeMeta(docType: string) {
  return docTypeMeta[docType] ?? docTypeMeta.Unknown;
}

// ── Confidence color logic ────────────────────────────────────────────────────
function confidenceColor(pct: number): string {
  if (pct >= 95) return 'bg-emerald-500';
  if (pct >= 80) return 'bg-amber-400';
  return 'bg-rose-500';
}

function confidenceTextColor(pct: number): string {
  if (pct >= 95) return 'text-emerald-600 dark:text-emerald-400';
  if (pct >= 80) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

function confidenceBg(pct: number): string {
  if (pct >= 95) return 'bg-emerald-500/10 border-emerald-500/20';
  if (pct >= 80) return 'bg-amber-400/10 border-amber-400/20';
  return 'bg-rose-500/10 border-rose-500/20';
}

// ── Single Source Card ────────────────────────────────────────────────────────
export function SourceCard({ citation, index = 0 }: { citation: SourceCitation; index?: number }) {
  const [expanded, setExpanded] = React.useState(false);
  const pct = Math.round(citation.confidence * 100);
  const meta = getDocTypeMeta(citation.document_type);
  const Icon = meta.icon;

  // Build the primary reference label
  const refLabel = citation.article
    ? `Article ${citation.article}`
    : citation.section
    ? `Section ${citation.section}`
    : null;

  // Knowledge cluster (only for constitutional articles)
  const clusterCategory =
    citation.document_type === 'Constitution' && citation.article
      ? getClusterCategory(citation.article)
      : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="group relative flex flex-col rounded-2xl border border-border/60 bg-card/60 shadow-sm backdrop-blur-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 hover:border-primary/30 hover:shadow-md transition-all duration-200"
      aria-label={`Legal source: ${citation.act_name}${refLabel ? `, ${refLabel}` : ''}${citation.page != null ? `, Page ${citation.page}` : ''}, confidence ${pct}%`}
    >
      {/* Confidence top bar */}
      <div className="h-[3px] w-full bg-border/40" aria-hidden="true">
        <motion.div
          className={cn('h-full', confidenceColor(pct))}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: index * 0.07 + 0.2, ease: 'easeOut' }}
        />
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-3 p-4">
        {/* Header row: doc type badge + icon */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Gradient icon pill */}
            <div
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm',
                meta.accent
              )}
              aria-hidden="true"
            >
              <Icon className="h-3.5 w-3.5" />
            </div>
            {/* Document type badge */}
            <span
              className={cn(
                'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                meta.badge
              )}
            >
              {citation.document_type}
            </span>
          </div>

          {/* Confidence badge */}
          <span
            className={cn(
              'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold tabular-nums',
              confidenceBg(pct),
              confidenceTextColor(pct)
            )}
            title={`Retrieval confidence: ${pct}%`}
          >
            {pct}%
          </span>
        </div>

        {/* Act name */}
        <div>
          <p className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
            📄 {citation.act_name}
          </p>

          {/* Meta row */}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {citation.part && (
              <span className="inline-flex items-center rounded-md bg-secondary/50 px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                Part {citation.part}
              </span>
            )}
            {citation.chapter && (
              <span className="inline-flex items-center rounded-md bg-secondary/50 px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                Chapter {citation.chapter}
              </span>
            )}
            {refLabel && (
              <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                {refLabel}
              </span>
            )}
            {citation.page != null && (
              <span className="inline-flex items-center rounded-md bg-secondary/50 px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                Page {citation.page}
              </span>
            )}
          </div>

          {/* Cluster badge for constitutional articles */}
          {clusterCategory && clusterCategory !== 'General Provisions' && (
            <div className="mt-1.5">
              <span className="inline-flex items-center rounded-md border border-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {clusterCategory}
              </span>
            </div>
          )}
        </div>

        {/* Confidence progress bar */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] font-medium text-muted-foreground">Confidence</span>
            <span className={cn('text-[10px] font-bold tabular-nums', confidenceTextColor(pct))}>
              {pct}%
            </span>
          </div>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-border/50"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Confidence ${pct}%`}
          >
            <motion.div
              className={cn('h-full rounded-full', confidenceColor(pct))}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, delay: index * 0.07 + 0.25, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Expandable chunk ID */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between rounded-lg bg-muted/30 px-2.5 py-1.5 text-left transition-colors hover:bg-muted/60 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          aria-expanded={expanded}
          aria-label={expanded ? 'Hide chunk ID' : 'Show chunk ID'}
        >
          <span className="text-[10px] font-medium text-muted-foreground">Chunk ID</span>
          {expanded ? (
            <ChevronUp className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
          )}
        </button>
        {expanded && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="font-mono text-[10px] text-muted-foreground/70 break-all px-1"
          >
            {citation.chunk_id}
          </motion.p>
        )}
      </div>

      {/* Bottom "Retrieved from Indexed Knowledge Base" label */}
      <div className="border-t border-border/40 bg-muted/20 px-4 py-1.5">
        <p className="text-[10px] text-muted-foreground/60">Retrieved from Indexed Knowledge Base</p>
      </div>
    </motion.article>
  );
}

// ── Source List (multiple cards) ──────────────────────────────────────────────
export function SourceCardList({ citations }: { citations: SourceCitation[] }) {
  // Empty state: render nothing
  if (!citations || citations.length === 0) return null;

  return (
    <section aria-label={`Sources (${citations.length})`} className="mt-4">
      {/* Section header */}
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Sources
        </h3>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
          {citations.length}
        </span>
      </div>

      {/* Responsive grid: 1 col mobile, 2 col sm+ */}
      <div className="grid gap-3 sm:grid-cols-2">
        {citations.map((c, i) => (
          <SourceCard key={c.chunk_id ? `${c.chunk_id}-${i}` : `source-${i}`} citation={c} index={i} />
        ))}
      </div>
    </section>
  );
}
