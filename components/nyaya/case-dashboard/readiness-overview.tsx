'use client';

import * as React from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function ReadinessOverview({ className }: { className?: string }) {
  const ReadinessItem = ({
    title,
    status,
    note,
  }: {
    title: string;
    status: 'READY' | 'PARTIALLY_READY' | 'NEEDS_INFO' | 'NEEDS_REVIEW';
    note: string;
  }) => {
    const badge = React.useMemo(() => {
      switch (status) {
        case 'READY':
          return { label: '✓ Ready', class: 'bg-emerald-600 text-white' };
        case 'PARTIALLY_READY':
          return { label: 'Partially Ready', class: 'border-blue-500/40 bg-blue-500/10 text-blue-800 dark:text-blue-300' };
        case 'NEEDS_INFO':
          return { label: 'Needs Info', class: 'border-amber-400 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300' };
        case 'NEEDS_REVIEW':
          return { label: 'Needs Review', class: 'border-slate-400 text-slate-700 dark:text-slate-300' };
        default:
          return { label: 'Available', class: 'border-border' };
      }
    }, [status]);

    return (
      <div className="p-3 rounded-xl border border-border/80 bg-card space-y-1 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-foreground">{title}</span>
          <Badge variant="outline" className={cn('text-[10px] px-2 py-0.5 font-semibold', badge.class)}>
            {badge.label}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground">{note}</p>
      </div>
    );
  };

  return (
    <div className={cn('legal-card p-5 space-y-4', className)}>
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Case Readiness Overview
          </h3>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Qualitative Assessment</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ReadinessItem title="Facts" status="READY" note="Sufficient facts captured for legal analysis." />
        <ReadinessItem title="Evidence" status="NEEDS_REVIEW" note="2 documents attached; proof review recommended." />
        <ReadinessItem title="Legal Analysis" status="READY" note="Statutory framework & remedies identified." />
        <ReadinessItem title="Resolution Path" status="READY" note="Pre-Litigation Settlement pathway identified." />
      </div>
    </div>
  );
}
