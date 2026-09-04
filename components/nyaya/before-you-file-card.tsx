'use client';

import * as React from 'react';
import { AlertCircle, Scale, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BeforeYouFileCardProps {
  disputeType?: string;
  suggestedPathway?: string;
}

export function BeforeYouFileCard({
  disputeType = 'Property / Tenancy Dispute',
  suggestedPathway = 'Pre-Litigation Settlement & Mediation',
}: BeforeYouFileCardProps) {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-400 font-bold text-xs">
            Pre-Litigation Checkpoint
          </Badge>
          <span className="text-xs text-muted-foreground">Dispute Type: {disputeType}</span>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl bg-amber-500/5 p-3 border border-amber-500/20">
        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-foreground">Before filing a case in court</h4>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Consider whether this dispute can be resolved through another available pathway before initiating formal litigation. Court proceedings can involve extended delays and significant expense.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg border border-border/80 bg-background p-2.5 space-y-1">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>1. Direct Settlement</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Issue a structured Legal Notice &amp; proposal terms.</p>
        </div>

        <div className="rounded-lg border border-border/80 bg-background p-2.5 space-y-1">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>2. Institutional Mediation</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Neutral third-party facilitated agreement.</p>
        </div>

        <div className="rounded-lg border border-border/80 bg-background p-2.5 space-y-1">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span>3. DLSA Legal Aid</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Assisted representation for eligible citizens.</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
        <span>Nyaya helps you explore options. It does not dictate whether you should sue.</span>
        <span className="font-semibold text-amber-700 dark:text-amber-400">Suggested Route: {suggestedPathway}</span>
      </div>
    </div>
  );
}
