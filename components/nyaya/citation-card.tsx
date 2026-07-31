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
  page?: number;
  article_number?: string;
  relevance_score?: number;
  origin?: 'vector' | 'insights';
}

const typeMeta: Record<Citation['type'], { icon: typeof Scale; label: string; color: string }> = {
  act: { icon: Scale, label: 'Statute', color: 'text-primary' },
  case: { icon: Gavel, label: 'Case law', color: 'text-amber-500' },
  article: { icon: FileText, label: 'Article', color: 'text-emerald-500' },
  regulation: { icon: BookOpen, label: 'Regulation', color: 'text-sky-500' },
};

import { KnowledgeClusterBadge } from '@/components/nyaya/knowledge-cluster-badge';

export function CitationCard({ citation, index = 0 }: { citation: Citation; index?: number }) {
  const meta = typeMeta[citation.type] ?? typeMeta['act'];
  const Icon = meta.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -3 }}
      className="group glass flex flex-col gap-2 rounded-2xl p-4 transition-shadow hover:glow relative overflow-hidden"
    >
      {/* Relevance Score Indicator Bar */}
      {citation.relevance_score !== undefined && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-muted-foreground/10">
          <div 
            className="h-full bg-emerald-500 transition-all" 
            style={{ width: `${Math.round(citation.relevance_score * 100)}%` }}
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className={cn('flex items-center gap-1.5 text-xs font-semibold', meta.color)}>
          <Icon className="h-3.5 w-3.5" />
          {meta.label}
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {citation.source}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors">
          {citation.title}
        </p>
        
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {citation.article_number && (
            <KnowledgeClusterBadge article={citation.article_number} />
          )}
          {citation.page && (
            <span className="inline-flex items-center rounded-md bg-secondary/50 px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
              Page {citation.page}
            </span>
          )}
          {citation.relevance_score !== undefined && (
            <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-500">
              Match: {Math.round(citation.relevance_score * 100)}%
            </span>
          )}
        </div>
      </div>

      {citation.section && (
        <p className="text-xs text-muted-foreground">{citation.section}</p>
      )}
      {citation.snippet && (
        <p className="line-clamp-2 text-xs text-muted-foreground/80 leading-normal">{citation.snippet}</p>
      )}
    </motion.div>
  );
}

export function CitationList({ citations }: { citations: Citation[] }) {
  if (!citations.length) return null;
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {citations.map((c, i) => (
        <CitationCard key={c.id || `${c.title}-${i}`} citation={c} index={i} />
      ))}
    </div>
  );
}
