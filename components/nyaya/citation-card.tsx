'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Scale, FileText, BookOpen, Gavel } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Citation {
  id: string;
  title: string;
  source: string;
  section?: string;
  type: 'act' | 'case' | 'article' | 'regulation';
  url?: string;
  snippet?: string;
}

const typeMeta: Record<Citation['type'], { icon: typeof Scale; label: string; color: string }> = {
  act: { icon: Scale, label: 'Statute', color: 'text-primary' },
  case: { icon: Gavel, label: 'Case law', color: 'text-amber-500' },
  article: { icon: FileText, label: 'Article', color: 'text-emerald-500' },
  regulation: { icon: BookOpen, label: 'Regulation', color: 'text-sky-500' },
};

export function CitationCard({ citation, index = 0 }: { citation: Citation; index?: number }) {
  const meta = typeMeta[citation.type];
  const Icon = meta.icon;
  return (
    <motion.a
      href={citation.url || '#'}
      target={citation.url ? '_blank' : undefined}
      rel={citation.url ? 'noreferrer' : undefined}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -3 }}
      className="group glass flex flex-col gap-2 rounded-2xl p-4 transition-shadow hover:glow"
    >
      <div className="flex items-center justify-between">
        <div className={cn('flex items-center gap-1.5 text-xs font-semibold', meta.color)}>
          <Icon className="h-3.5 w-3.5" />
          {meta.label}
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {citation.source}
        </span>
      </div>
      <p className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors">
        {citation.title}
      </p>
      {citation.section && (
        <p className="text-xs text-muted-foreground">{citation.section}</p>
      )}
      {citation.snippet && (
        <p className="line-clamp-2 text-xs text-muted-foreground/80">{citation.snippet}</p>
      )}
    </motion.a>
  );
}

export function CitationList({ citations }: { citations: Citation[] }) {
  if (!citations.length) return null;
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {citations.map((c, i) => (
        <CitationCard key={c.id} citation={c} index={i} />
      ))}
    </div>
  );
}
