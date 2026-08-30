'use client';

import * as React from 'react';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DelayTimelineSectionProps {
  hearingsCount?: number;
  adjournmentsCount?: number;
  elapsedTime?: string;
  latestHearingDate?: string;
  reasonRecorded?: string;
  className?: string;
}

export function DelayTimelineSection({
  hearingsCount = 6,
  adjournmentsCount = 2,
  elapsedTime = '4 months',
  latestHearingDate = '12 Aug 2026',
  reasonRecorded = 'Awaiting document submission by respondent',
  className,
}: DelayTimelineSectionProps) {
  return (
    <div className={cn('legal-card p-5 space-y-3', className)}>
      <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Case Timeline & Hearing History
          </h3>
        </div>

        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Factual Intelligence
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-center">
        <div className="p-2.5 rounded-lg border border-border/70 bg-card">
          <span className="text-[10px] text-muted-foreground">Elapsed Time</span>
          <p className="font-bold text-foreground mt-0.5">{elapsedTime}</p>
        </div>

        <div className="p-2.5 rounded-lg border border-border/70 bg-card">
          <span className="text-[10px] text-muted-foreground">Hearings</span>
          <p className="font-bold text-foreground mt-0.5">{hearingsCount}</p>
        </div>

        <div className="p-2.5 rounded-lg border border-border/70 bg-card">
          <span className="text-[10px] text-muted-foreground">Adjournments</span>
          <p className="font-bold text-foreground mt-0.5">{adjournmentsCount}</p>
        </div>

        <div className="p-2.5 rounded-lg border border-border/70 bg-card">
          <span className="text-[10px] text-muted-foreground">Latest Hearing</span>
          <p className="font-bold text-foreground mt-0.5">{latestHearingDate}</p>
        </div>
      </div>

      <div className="text-xs bg-muted/40 p-2.5 rounded-lg border border-border/50 space-y-0.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Latest Recorded Adjournment Indicator:
        </span>
        <p className="text-foreground/90 leading-relaxed font-medium">{reasonRecorded}</p>
      </div>
    </div>
  );
}
