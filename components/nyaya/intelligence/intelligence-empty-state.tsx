'use client';

import * as React from 'react';
import { Network, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function IntelligenceEmptyState({
  type = 'EMPTY',
  className,
}: {
  type?: 'EMPTY' | 'INSUFFICIENT_DATA' | 'ERROR';
  className?: string;
}) {
  if (type === 'ERROR') {
    return (
      <div className={cn('p-8 text-center rounded-2xl border border-red-500/30 bg-red-500/5 space-y-3', className)}>
        <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
        <h3 className="text-sm font-bold text-foreground">Pattern Analysis Temporarily Unavailable</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Systemic pattern computation is currently updating. Your individual case files and legal journey remain fully functional and unaffected.
        </p>
      </div>
    );
  }

  if (type === 'INSUFFICIENT_DATA') {
    return (
      <div className={cn('p-8 text-center rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-3', className)}>
        <FileText className="h-8 w-8 text-amber-600 mx-auto" />
        <h3 className="text-sm font-bold text-foreground">More Case Information Required</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          More anonymised case details are required before a reliable recurring pattern signal can be identified.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('p-8 text-center rounded-2xl border border-border/80 bg-card space-y-3', className)}>
      <Network className="h-8 w-8 text-muted-foreground mx-auto" />
      <h3 className="text-sm font-bold text-foreground">No Recurring Patterns Identified Yet</h3>
      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
        No recurring systemic patterns have been detected from the current dataset of anonymised cases.
      </p>
    </div>
  );
}
