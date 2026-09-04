'use client';

import * as React from 'react';
import { Scale, TrendingDown, Clock, ShieldCheck, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function PendencyImpactSection() {
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-card p-6 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400">
            <Scale className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-foreground">
              Why Resolution Before Litigation Matters
            </h3>
            <p className="text-xs text-muted-foreground">
              Nyaya AI's Systemic Pendency-Reduction Philosophy
            </p>
          </div>
        </div>

        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-400 text-xs">
          Illustrative Model Estimate
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <TrendingDown className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Avoid Unnecessary Filings</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Resolving document-driven disputes through settlement or Lok Adalat prevents premature litigation from burdening sub-ordinate courts.
          </p>
          <div className="pt-2 text-[11px] text-muted-foreground font-medium">
            Status: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Pre-litigation candidate</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>Time-to-Resolution Impact</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Formal trials in civil or rent disputes often average 2–5 years. Mediated settlement can resolve within 15–45 days.
          </p>
          <div className="pt-2 text-[11px] text-muted-foreground font-medium">
            Est. Savings: <span className="text-amber-700 dark:text-amber-400 font-semibold">Model-based ~18 months</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Structured Case Quality</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Even if litigation is unavoidable, organized evidence and clean chronology reduce unnecessary adjournments.
          </p>
          <div className="pt-2 text-[11px] text-muted-foreground font-medium">
            Package Readiness: <span className="text-blue-600 dark:text-blue-400 font-semibold">Judge-Ready Format</span>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-[11px] text-muted-foreground">
        <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="leading-normal">
          <strong>Transparency Note:</strong> Systemic impact numbers are model-based estimates designed to illustrate judicial burden reduction. Nyaya AI does not guarantee specific court timelines or case outcomes.
        </p>
      </div>
    </div>
  );
}
