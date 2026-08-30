'use client';

import * as React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, CheckCircle2, ShieldCheck, FileCheck, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WhatHappensNowProps {
  stage?: string;
  stageTitle?: string;
  stageDescription?: string;
  nextStepTitle?: string;
  nextStepRationale?: string;
  primaryCtaText?: string;
  primaryCtaHref?: string;
  className?: string;
}

export function WhatHappensNow({
  stage = 'LEGAL_ANALYSIS',
  stageTitle = 'Analyzing Legal Provisions',
  stageDescription = 'Nyaya has gathered your core dispute facts and is reviewing applicable Indian statutes (UP Urban Buildings Act & Section 108 of Transfer of Property Act).',
  nextStepTitle = 'Upload Rent Agreement & Receipts',
  nextStepRationale = 'Providing the written lease agreement will allow Nyaya to verify notice period requirements and contractual refund clauses.',
  primaryCtaText = 'Review & Upload Documents',
  primaryCtaHref = '/cases/case-1/documents',
  className,
}: WhatHappensNowProps) {
  return (
    <div className={cn('rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 shadow-xs space-y-4', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
              Current Case Stage &amp; Status
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">
              {stageTitle}
            </h2>
          </div>
        </div>

        <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 w-fit">
          Nyaya is active
        </span>
      </div>

      <p className="text-xs text-foreground/90 leading-relaxed">
        {stageDescription}
      </p>

      {/* Immediate Next Action Card */}
      <div className="rounded-xl border border-border/70 bg-card p-4 space-y-2.5">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Recommended Action Required
          </span>
          <h3 className="text-xs font-bold text-foreground">
            {nextStepTitle}
          </h3>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {nextStepRationale}
        </p>

        <div className="pt-1 flex items-center gap-3">
          <Button asChild size="sm" className="bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 font-semibold rounded-xl text-xs shadow-sm">
            <Link href={primaryCtaHref}>
              <span>{primaryCtaText}</span>
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
