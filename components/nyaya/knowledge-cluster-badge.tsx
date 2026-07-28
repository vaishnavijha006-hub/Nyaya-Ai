'use client';

import * as React from 'react';

// Color classes mapping for different constitutional categories
const clusterConfigs: Record<string, { label: string; bg: string; text: string; border: string }> = {
  'Fundamental Rights': {
    label: 'Fundamental Rights',
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-500/20 dark:border-purple-500/30',
  },
  'Directive Principles': {
    label: 'Directive Principles',
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-500/20 dark:border-blue-500/30',
  },
  'Fundamental Duties': {
    label: 'Fundamental Duties',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-500/20 dark:border-emerald-500/30',
  },
  'Judiciary': {
    label: 'Judiciary',
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-500/20 dark:border-amber-500/30',
  },
  'Emergency Provisions': {
    label: 'Emergency Provisions',
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-500/20 dark:border-rose-500/30',
  },
  'Union & States': {
    label: 'Union & States',
    bg: 'bg-sky-500/10 dark:bg-sky-500/20',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-500/20 dark:border-sky-500/30',
  },
  'General Provisions': {
    label: 'General Provisions',
    bg: 'bg-slate-500/10 dark:bg-slate-500/20',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-500/20 dark:border-slate-500/30',
  },
};

export function getClusterCategory(articleStr: string): string {
  if (!articleStr) return 'General Provisions';
  
  // Clean string and extract numbers
  const cleaned = articleStr.replace(/[^0-9]/g, '');
  if (!cleaned) return 'General Provisions';
  
  const val = parseInt(cleaned, 10);

  // Check specific 51A condition
  if (articleStr.toUpperCase().includes('51A') || articleStr.toUpperCase().includes('51 A')) {
    return 'Fundamental Duties';
  }

  // Basic ranges mapping
  if (val >= 12 && val <= 35) return 'Fundamental Rights';
  if (val >= 36 && val <= 51) return 'Directive Principles';
  if (val >= 124 && val <= 147) return 'Judiciary';
  if (val >= 352 && val <= 360) return 'Emergency Provisions';
  if (val >= 245 && val <= 263) return 'Union & States';

  return 'General Provisions';
}

export function KnowledgeClusterBadge({ article }: { article: string }) {
  const category = getClusterCategory(article);
  const config = clusterConfigs[category] || clusterConfigs['General Provisions'];

  return (
    <span 
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium tracking-wide shadow-sm transition-all ${config.bg} ${config.text} ${config.border}`}
      title={`Belongs to cluster: ${config.label}`}
    >
      Art. {article} • {config.label}
    </span>
  );
}
