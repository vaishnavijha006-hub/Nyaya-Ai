'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NextBestActionProps {
  title?: string;
  rationale?: string;
  primaryCtaText?: string;
  primaryCtaHref?: string;
  secondaryCtaText?: string;
  onSecondaryClick?: () => void;
  className?: string;
}

export function NextBestAction({
  title = "Upload your Rental Agreement",
  rationale = "The rental agreement is required to establish tenancy terms, notice period compliance, and security deposit refund obligations.",
  primaryCtaText = "Upload Document",
  primaryCtaHref = "/cases/case-1/documents",
  secondaryCtaText = "I'll do this later",
  onSecondaryClick,
  className,
}: NextBestActionProps) {
  return (
    <div className={cn('rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 shadow-sm space-y-4', className)}>
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-slate-950 font-bold text-xs">
          !
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
            Recommended Next Step
          </span>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Why this matters:
        </p>
        <p className="text-xs text-foreground/90 leading-relaxed">
          {rationale}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button asChild size="sm" className="bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 font-semibold rounded-xl text-xs shadow-sm">
          <Link href={primaryCtaHref}>
            <span>{primaryCtaText}</span>
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>

        {secondaryCtaText && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSecondaryClick}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {secondaryCtaText}
          </Button>
        )}
      </div>
    </div>
  );
}
