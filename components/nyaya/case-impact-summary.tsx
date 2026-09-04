'use client';

import * as React from 'react';
import { Activity, ArrowRight, CheckCircle2, FileText, Scale } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CaseImpactSummaryProps {
  status?: string;
  stage?: string;
  nextAction?: string;
  possiblePaths?: string[];
  filingStatus?: string;
}

export function CaseImpactSummary({
  status = 'Active',
  stage = 'Legal Analysis & Evidence Verification',
  nextAction = 'Upload signed rent agreement or payment receipts',
  possiblePaths = ['Pre-Litigation Settlement', 'Mediation (ADR)', 'Litigation'],
  filingStatus = 'Not yet necessary (Pre-litigation candidate)',
}: CaseImpactSummaryProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 font-bold text-xs">
            <Activity className="h-3 w-3 mr-1" />
            {status}
          </Badge>
          <span className="text-xs font-semibold text-foreground">Case Executive Impact Summary</span>
        </div>
        <span className="text-[11px] text-muted-foreground">Supported by verified case data</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="rounded-xl bg-muted/40 p-3 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current Stage</span>
          <p className="font-semibold text-foreground">{stage}</p>
        </div>

        <div className="rounded-xl bg-muted/40 p-3 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Next Recommended Action</span>
          <p className="font-semibold text-amber-800 dark:text-amber-400">{nextAction}</p>
        </div>

        <div className="rounded-xl bg-muted/40 p-3 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Possible Pathways</span>
          <div className="flex flex-wrap gap-1 pt-0.5">
            {possiblePaths.map((path) => (
              <span key={path} className="rounded bg-background px-1.5 py-0.5 text-[10px] font-medium border border-border">
                {path}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-muted/40 p-3 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Court-Filing Status</span>
          <p className="font-semibold text-emerald-700 dark:text-emerald-400">{filingStatus}</p>
        </div>
      </div>
    </div>
  );
}
