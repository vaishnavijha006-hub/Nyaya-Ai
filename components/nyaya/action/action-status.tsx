'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type ActionStepStatus =
  | 'RECOMMENDED'
  | 'REVIEW'
  | 'PREPARE'
  | 'CONFIRMATION'
  | 'COMPLETED';

export function ActionStatusBadge({ status }: { status: ActionStepStatus }) {
  const badgeConfig = React.useMemo(() => {
    switch (status) {
      case 'RECOMMENDED':
        return { label: 'Recommended', class: 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-400 font-bold' };
      case 'REVIEW':
        return { label: 'In Review', class: 'border-blue-500/40 bg-blue-500/10 text-blue-800 dark:text-blue-400 font-semibold' };
      case 'PREPARE':
        return { label: 'In Preparation', class: 'border-purple-500/40 bg-purple-500/10 text-purple-800 dark:text-purple-400 font-semibold' };
      case 'CONFIRMATION':
        return { label: 'Requires Confirmation', class: 'border-amber-500/40 bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-bold' };
      case 'COMPLETED':
        return { label: 'Completed', class: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 font-semibold' };
      default:
        return { label: 'Available', class: 'border-border text-muted-foreground' };
    }
  }, [status]);

  return (
    <Badge variant="outline" className={cn('text-[10px] uppercase tracking-wider px-2 py-0.5', badgeConfig.class)}>
      {badgeConfig.label}
    </Badge>
  );
}
