'use client';

import * as React from 'react';
import { Clock, Calendar, AlertCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface HearingRecord {
  num: number;
  date: string;
  purpose: string;
  outcome: string;
  reasonRecorded?: string;
}

interface DelayTimelineSectionProps {
  hearings?: HearingRecord[];
  timeElapsedMonths?: number;
  incompleteData?: boolean;
  className?: string;
}

const DEFAULT_HEARINGS: HearingRecord[] = [
  { num: 1, date: '14 Feb 2026', purpose: 'First Appearance & Notice Service', outcome: 'Notice Issued', reasonRecorded: 'Procedure step' },
  { num: 2, date: '28 Mar 2026', purpose: 'Written Statement Filing', outcome: 'Adjourned', reasonRecorded: 'Respondent counsel requested time for reply' },
  { num: 3, date: '15 May 2026', purpose: 'Frame Issues & Evidence', outcome: 'Adjourned', reasonRecorded: 'Awaiting bank transaction certified records' },
];

export function DelayTimelineSection({
  hearings = DEFAULT_HEARINGS,
  timeElapsedMonths = 6,
  incompleteData = false,
  className,
}: DelayTimelineSectionProps) {
  const totalHearings = hearings.length;
  const recordedAdjournments = hearings.filter((h) => h.outcome === 'Adjourned').length;

  return (
    <div className={cn('legal-card p-5 space-y-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Delay Intelligence &amp; Factual Hearing Log
          </h3>
        </div>
        <Badge variant="outline" className="border-amber-500/30 text-amber-800 dark:text-amber-400 text-[10px] font-semibold">
          Factual Court Record
        </Badge>
      </div>

      {/* Summary Stat Badges */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-xl border border-border/80 bg-muted/40 p-2.5 space-y-0.5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Hearings</span>
          <p className="font-extrabold text-foreground text-sm">{totalHearings}</p>
        </div>
        <div className="rounded-xl border border-border/80 bg-muted/40 p-2.5 space-y-0.5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Recorded Adjournments</span>
          <p className="font-extrabold text-amber-800 dark:text-amber-400 text-sm">{recordedAdjournments}</p>
        </div>
        <div className="rounded-xl border border-border/80 bg-muted/40 p-2.5 space-y-0.5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Time Elapsed</span>
          <p className="font-extrabold text-foreground text-sm">{timeElapsedMonths} Months</p>
        </div>
      </div>

      {incompleteData && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-900 dark:text-amber-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>Delay information is incomplete. Additional hearing dates pending court portal sync.</span>
        </div>
      )}

      {/* Factual Hearing Log */}
      <div className="space-y-2 text-xs">
        {hearings.map((h) => (
          <div key={h.num} className="p-3 rounded-xl border border-border/80 bg-card space-y-1">
            <div className="flex justify-between font-bold text-foreground">
              <span>Hearing #{h.num} — {h.purpose}</span>
              <span className="text-[10px] text-muted-foreground font-mono">{h.date}</span>
            </div>
            <div className="text-[11px] text-muted-foreground space-y-0.5">
              <p>Outcome: <span className="font-semibold text-foreground">{h.outcome}</span></p>
              {h.reasonRecorded && (
                <p>Reason recorded for adjournment: <span className="italic text-slate-700 dark:text-slate-300">"{h.reasonRecorded}"</span></p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40">
        <Info className="h-3.5 w-3.5 text-amber-500 shrink-0" />
        <span>Factual reporting derived strictly from recorded order sheets and party submissions.</span>
      </div>
    </div>
  );
}
