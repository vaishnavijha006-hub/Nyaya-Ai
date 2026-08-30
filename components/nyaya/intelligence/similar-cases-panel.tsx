'use client';

import * as React from 'react';
import { ShieldCheck, Lock, FileText, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface AnonymisedCaseRef {
  refId: string; // e.g. "Case #NY-1042"
  category: string;
  jurisdiction: string;
  timeline: string;
  pathway: string;
  status: string;
}

const DEFAULT_ANONYMISED_CASES: AnonymisedCaseRef[] = [
  {
    refId: 'Case #NY-1042',
    category: 'Tenant Security Deposit',
    jurisdiction: 'Bengaluru Urban District',
    timeline: 'Filed 3 months ago',
    pathway: 'Pre-Litigation Settlement',
    status: 'Resolved via Out-of-Court Settlement',
  },
  {
    refId: 'Case #NY-1088',
    category: 'Tenant Security Deposit',
    jurisdiction: 'Bengaluru Urban District',
    timeline: 'Filed 2 months ago',
    pathway: 'Mediation / Lok Adalat',
    status: 'In Pre-Litigation Mediation',
  },
  {
    refId: 'Case #NY-1120',
    category: 'Tenant Security Deposit',
    jurisdiction: 'Bengaluru Rural District',
    timeline: 'Filed 1 month ago',
    pathway: 'DLSA Legal Aid Assistance',
    status: 'Advocate Notice Dispatched',
  },
];

export function SimilarCasesPanel({ cases = DEFAULT_ANONYMISED_CASES, className }: { cases?: AnonymisedCaseRef[]; className?: string }) {
  return (
    <div className={cn('legal-card p-5 space-y-4 text-xs', className)}>
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Anonymised Similar Case References
          </h3>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase font-semibold">100% PII Protected</span>
      </div>

      <div className="space-y-3">
        {cases.map((c) => (
          <div key={c.refId} className="p-3.5 rounded-xl border border-border/80 bg-card space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold font-mono text-foreground text-xs">{c.refId}</span>
              <Badge variant="outline" className="text-[9px] uppercase font-semibold text-emerald-800 border-emerald-400">
                {c.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-muted-foreground pt-1">
              <div>
                <span className="block text-[10px] uppercase font-semibold text-slate-500">Category:</span>
                <span className="font-medium text-foreground">{c.category}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-semibold text-slate-500">Jurisdiction:</span>
                <span className="font-medium text-foreground">{c.jurisdiction}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-semibold text-slate-500">Timeline &amp; Pathway:</span>
                <span className="font-medium text-foreground">{c.timeline} ({c.pathway})</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
