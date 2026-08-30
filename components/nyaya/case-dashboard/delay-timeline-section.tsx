'use client';

import * as React from 'react';
import { Clock, Calendar, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function DelayTimelineSection({ className }: { className?: string }) {
  const hearings = [
    { num: 1, date: '14 Feb 2026', purpose: 'First Appearance & Notice Service', outcome: 'Notice Issued', adjournment: 'None' },
    { num: 2, date: '28 Mar 2026', purpose: 'Written Statement Filing', outcome: 'Adjourned', adjournment: 'Party unavailable' },
    { num: 3, date: '15 May 2026', purpose: 'Frame Issues & Evidence', outcome: 'Adjourned', adjournment: 'Awaiting bank documents' },
  ];

  return (
    <div className={cn('legal-card p-5 space-y-4', className)}>
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Case Delay &amp; Hearing Log
          </h3>
        </div>
        <Badge variant="outline" className="border-amber-500/30 text-amber-800 dark:text-amber-400 text-[10px]">
          3 Hearings Recorded
        </Badge>
      </div>

      <div className="space-y-3 text-xs">
        {hearings.map((h) => (
          <div key={h.num} className="p-3 rounded-xl border border-border/80 bg-card space-y-1">
            <div className="flex justify-between font-bold text-foreground">
              <span>Hearing {h.num} — {h.purpose}</span>
              <span className="text-[10px] text-muted-foreground">{h.date}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Outcome: <span className="font-semibold text-foreground">{h.outcome}</span>
              {h.adjournment !== 'None' && ` • Reason: ${h.adjournment}`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
