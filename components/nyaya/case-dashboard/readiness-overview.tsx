'use client';

import * as React from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function ReadinessOverview({ className }: { className?: string }) {
  const categories = [
    {
      category: 'CASE INFORMATION',
      status: 'Good Progress',
      detail: 'Core timeline, parties, and dispute details extracted.',
      badgeClass: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 font-semibold',
    },
    {
      category: 'EVIDENCE',
      status: 'Needs 2 Documents',
      detail: 'Rent agreement uploaded; missing payment receipt & bank statement.',
      badgeClass: 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-400 font-semibold',
    },
    {
      category: 'LEGAL REVIEW',
      status: 'Preliminary',
      detail: 'Statutory grounds under Rent Control Act identified; requires advocate review.',
      badgeClass: 'border-blue-500/40 bg-blue-500/10 text-blue-800 dark:text-blue-400 font-semibold',
    },
    {
      category: 'ACTION READINESS',
      status: 'Not Yet Ready',
      detail: 'Complete evidence audit before issuing formal legal notice.',
      badgeClass: 'border-slate-500/40 bg-slate-500/10 text-slate-800 dark:text-slate-300 font-semibold',
    },
  ];

  const whatsMissing = [
    'Signed Rent Agreement page 3 or security deposit bank transfer receipt',
    'Confirmation of written eviction notice date',
    'Advocate review prior to formal tribunal filing',
  ];

  return (
    <div className={cn('legal-card p-5 space-y-4', className)}>
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Categorical Case Readiness Overview
          </h3>
        </div>
        <span className="text-[10px] text-muted-foreground font-semibold">Qualitative Audit</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((c) => (
          <div key={c.category} className="p-3 rounded-xl border border-border/80 bg-card space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground">{c.category}</span>
              <Badge variant="outline" className={cn('text-[10px] px-2 py-0.5', c.badgeClass)}>
                {c.status}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{c.detail}</p>
          </div>
        ))}
      </div>

      {/* What's Missing Checklist */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-2">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>What's Missing for Complete Readiness?</span>
        </div>
        <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
          {whatsMissing.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        Nyaya AI evaluates readiness categorically. We never display misleading win probabilities or percentage predictions.
      </p>
    </div>
  );
}
