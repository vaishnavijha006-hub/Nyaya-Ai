'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type FactStatus =
  | 'CONFIRMED'
  | 'USER_PROVIDED'
  | 'DOCUMENT_SUPPORTED'
  | 'NEEDS_REVIEW'
  | 'CONFLICTING'
  | 'MISSING';

export function FactStatusBadge({ status }: { status: FactStatus }) {
  const config = React.useMemo(() => {
    switch (status) {
      case 'CONFIRMED':
        return { label: '✓ Confirmed', class: 'bg-emerald-600 text-white font-bold' };
      case 'DOCUMENT_SUPPORTED':
        return { label: '✓ Document-Supported', class: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 font-semibold' };
      case 'USER_PROVIDED':
        return { label: 'User-Provided', class: 'border-blue-500/40 bg-blue-500/10 text-blue-800 dark:text-blue-400 font-semibold' };
      case 'NEEDS_REVIEW':
        return { label: '⚠ Needs Review', class: 'border-slate-400 bg-slate-100 text-slate-800 dark:text-slate-300 font-medium' };
      case 'CONFLICTING':
        return { label: '⚠ Conflicting', class: 'border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-400 font-bold' };
      case 'MISSING':
        return { label: '❓ Missing', class: 'border-amber-400 bg-amber-50 text-amber-900 dark:text-amber-300 font-medium' };
      default:
        return { label: 'User-Provided', class: 'border-border' };
    }
  }, [status]);

  return (
    <Badge variant="outline" className={cn('text-[10px] uppercase tracking-wider px-2 py-0.5', config.class)}>
      {config.label}
    </Badge>
  );
}
