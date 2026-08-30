'use client';

import * as React from 'react';
import { History, FileText, CheckCircle2, Scale, Users, ShieldAlert, Sparkles, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ActivityEventType =
  | 'USER_ACTION'
  | 'AI_ANALYSIS'
  | 'DOCUMENT'
  | 'LEGAL_PATHWAY'
  | 'SETTLEMENT'
  | 'ADR'
  | 'HEARING'
  | 'SYSTEM';

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  title: string;
  description: string;
  timestamp: string;
}

interface CaseActivityTimelineProps {
  events?: ActivityEvent[];
  className?: string;
}

const DEFAULT_EVENTS: ActivityEvent[] = [
  {
    id: 'act-ev-1',
    type: 'AI_ANALYSIS',
    title: 'Preliminary Legal Analysis Completed',
    description: 'Identified applicable provisions under UP Urban Buildings Act & Section 108 Transfer of Property Act.',
    timestamp: 'Today, 15:30',
  },
  {
    id: 'act-ev-2',
    type: 'DOCUMENT',
    title: 'UPI Deposit Payment Receipt Verified',
    description: 'Verified monetary transfer of ₹50,000 security deposit.',
    timestamp: 'Yesterday, 18:20',
  },
  {
    id: 'act-ev-3',
    type: 'USER_ACTION',
    title: 'Rent Agreement Uploaded',
    description: 'User uploaded written lease contract document.',
    timestamp: 'Yesterday, 14:10',
  },
  {
    id: 'act-ev-4',
    type: 'SYSTEM',
    title: 'Case Intake Initiated',
    description: 'Started natural language intake for Property & Tenancy dispute.',
    timestamp: '12 Aug 2026',
  },
];

export function CaseActivityTimeline({ events = DEFAULT_EVENTS, className }: CaseActivityTimelineProps) {
  return (
    <div className={cn('legal-card p-5 space-y-4', className)}>
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Case Activity History
          </h3>
        </div>

        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Factual Timeline
        </span>
      </div>

      <div className="relative pl-4 space-y-4 border-l border-border/60 ml-2">
        {events.map((ev) => (
          <div key={ev.id} className="relative space-y-0.5">
            {/* Timeline Dot */}
            <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-4 ring-background" />

            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground">{ev.title}</span>
              <span className="text-[10px] text-muted-foreground">{ev.timestamp}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{ev.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
