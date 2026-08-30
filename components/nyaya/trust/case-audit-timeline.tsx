'use client';

import * as React from 'react';
import { History, User, Sparkles, Scale, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type AuditActor = 'USER' | 'NYAYA_AI' | 'LAWYER' | 'SYSTEM';

export interface AuditEventItem {
  id: string;
  actor: AuditActor;
  actionTitle: string;
  timestamp: string;
  details?: string;
}

const DEFAULT_AUDIT_EVENTS: AuditEventItem[] = [
  {
    id: 'aud-1',
    actor: 'USER',
    actionTitle: 'User added payment receipt',
    timestamp: 'Today, 14:30',
    details: 'Uploaded UPI deposit transfer receipt (₹50,000).',
  },
  {
    id: 'aud-2',
    actor: 'NYAYA_AI',
    actionTitle: 'Nyaya AI extracted payment date & amount',
    timestamp: 'Today, 14:31',
    details: 'Extracted deposit date: 12 Jan 2025.',
  },
  {
    id: 'aud-3',
    actor: 'USER',
    actionTitle: 'User confirmed extracted fact',
    timestamp: 'Today, 14:32',
    details: 'Citizen confirmed extracted deposit date.',
  },
  {
    id: 'aud-4',
    actor: 'NYAYA_AI',
    actionTitle: 'Pre-Litigation Settlement notice recommended',
    timestamp: 'Today, 14:35',
    details: 'Formulated 15-day statutory settlement proposal.',
  },
];

export function CaseAuditTimeline({ events = DEFAULT_AUDIT_EVENTS, className }: { events?: AuditEventItem[]; className?: string }) {
  const actorBadge = (actor: AuditActor) => {
    switch (actor) {
      case 'USER':
        return <Badge className="bg-blue-600 text-white text-[9px]">USER</Badge>;
      case 'NYAYA_AI':
        return <Badge className="bg-amber-600 text-white text-[9px]">NYAYA AI</Badge>;
      case 'LAWYER':
        return <Badge className="bg-purple-600 text-white text-[9px]">LAWYER</Badge>;
      default:
        return <Badge variant="outline" className="text-[9px]">SYSTEM</Badge>;
    }
  };

  return (
    <div className={cn('legal-card p-5 space-y-4 text-xs', className)}>
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-slate-700 dark:text-slate-300" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Case Audit Trail
          </h3>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Actor-Tagged History</span>
      </div>

      <div className="relative pl-4 space-y-3 border-l border-border/60 ml-2">
        {events.map((ev) => (
          <div key={ev.id} className="relative space-y-1">
            <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-slate-600 ring-4 ring-background" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {actorBadge(ev.actor)}
                <span className="font-bold text-foreground">{ev.actionTitle}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{ev.timestamp}</span>
            </div>
            {ev.details && <p className="text-[11px] text-muted-foreground">{ev.details}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
