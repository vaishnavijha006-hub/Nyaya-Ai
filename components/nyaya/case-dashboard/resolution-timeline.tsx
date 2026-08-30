'use client';

import * as React from 'react';
import { History, CheckCircle2, Clock, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ResolutionTimeline({ className }: { className?: string }) {
  const steps = [
    { title: 'Problem submitted', done: true },
    { title: 'Facts collected', done: true },
    { title: 'Evidence uploaded', done: true },
    { title: 'Preliminary analysis completed', done: true },
    { title: 'Resolution pathway selected', active: true },
    { title: 'Action in progress', done: false },
    { title: 'Resolution', done: false },
  ];

  return (
    <div className={cn('legal-card p-5 space-y-4', className)}>
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Resolution Journey Timeline
          </h3>
        </div>
      </div>

      <div className="space-y-3 text-xs">
        {steps.map((st, i) => (
          <div key={i} className="flex items-center gap-2.5">
            {st.done ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : st.active ? (
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-pulse shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className={cn('font-medium', st.active ? 'font-bold text-amber-700 dark:text-amber-400' : st.done ? 'text-foreground' : 'text-muted-foreground')}>
              {st.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
