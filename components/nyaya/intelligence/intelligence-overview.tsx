'use client';

import * as React from 'react';
import { Layers, Network, Scale, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function IntelligenceOverview({ className }: { className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs', className)}>
      <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[10px] uppercase font-bold tracking-wider">Cases Analysed</span>
          <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <p className="text-xl font-bold text-foreground">1,248</p>
        <span className="text-[10px] text-muted-foreground">Anonymised records</span>
      </div>

      <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[10px] uppercase font-bold tracking-wider">Recurring Patterns</span>
          <Network className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <p className="text-xl font-bold text-foreground">14</p>
        <span className="text-[10px] text-muted-foreground">Clusters identified</span>
      </div>

      <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1">
        <div className="flex items-center justify-between text-amber-800 dark:text-amber-300">
          <span className="text-[10px] uppercase font-bold tracking-wider">High-Impact</span>
          <ShieldAlert className="h-4 w-4 text-amber-600" />
        </div>
        <p className="text-xl font-bold text-amber-900 dark:text-amber-300">3</p>
        <span className="text-[10px] text-amber-800/80 dark:text-amber-300/80">&gt; 30 cases affected</span>
      </div>

      <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-1">
        <div className="flex items-center justify-between text-purple-800 dark:text-purple-300">
          <span className="text-[10px] uppercase font-bold tracking-wider">Systemic Issues</span>
          <Scale className="h-4 w-4 text-purple-600" />
        </div>
        <p className="text-xl font-bold text-purple-900 dark:text-purple-300">2</p>
        <span className="text-[10px] text-purple-800/80 dark:text-purple-300/80">PIL/DLSA review candidate</span>
      </div>

      <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
        <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300">
          <span className="text-[10px] uppercase font-bold tracking-wider">Early Resolution</span>
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        </div>
        <p className="text-xl font-bold text-emerald-900 dark:text-emerald-300">184</p>
        <span className="text-[10px] text-emerald-800/80 dark:text-emerald-300/80">Disputes settled out-of-court</span>
      </div>
    </div>
  );
}
