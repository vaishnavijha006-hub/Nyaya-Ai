'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, HelpCircle, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ActionStatus =
  | 'RECOMMENDED'
  | 'AVAILABLE'
  | 'REQUIRES_INFORMATION'
  | 'REQUIRES_DOCUMENTS'
  | 'REQUIRES_REVIEW'
  | 'COMPLETED';

export interface ActionCardProps {
  id: string;
  title: string;
  category: 'SETTLEMENT' | 'PREPARATION' | 'LITIGATION' | 'SYSTEMIC';
  description: string;
  status: ActionStatus;
  whySuggested: string[];
  primaryCtaText: string;
  primaryCtaHref: string;
  className?: string;
}

export function ActionCard({
  id,
  title,
  category,
  description,
  status,
  whySuggested,
  primaryCtaText,
  primaryCtaHref,
  className,
}: ActionCardProps) {
  const [expanded, setExpanded] = React.useState(false);

  const statusBadge = React.useMemo(() => {
    switch (status) {
      case 'RECOMMENDED':
        return { label: 'Recommended', class: 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-400 font-bold' };
      case 'AVAILABLE':
        return { label: 'Available', class: 'border-blue-500/40 bg-blue-500/10 text-blue-800 dark:text-blue-400 font-semibold' };
      case 'REQUIRES_DOCUMENTS':
        return { label: 'Requires Documents', class: 'border-slate-400 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium' };
      case 'REQUIRES_INFORMATION':
        return { label: 'Requires Info', class: 'border-amber-400 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-medium' };
      case 'COMPLETED':
        return { label: 'Completed', class: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 font-semibold' };
      default:
        return { label: 'Available', class: 'border-border text-muted-foreground' };
    }
  }, [status]);

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-all space-y-3',
        status === 'RECOMMENDED'
          ? 'border-amber-500/40 bg-amber-500/5 shadow-xs'
          : 'border-border/80 bg-card hover:border-border',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn('text-[10px] uppercase tracking-wider px-2 py-0.5', statusBadge.class)}>
              {statusBadge.label}
            </Badge>
          </div>
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Reasoning Expander ("Why this action?") */}
      <div className="space-y-1.5 pt-1 border-t border-border/50">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline"
        >
          <HelpCircle className="h-3 w-3" />
          <span>Why this is suggested</span>
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {expanded && (
          <div className="text-[11px] bg-muted/40 p-3 rounded-lg border border-border/50 space-y-1 text-foreground/90 leading-relaxed">
            {whySuggested.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <span className="text-amber-500 font-bold">•</span>
                <span>{reason}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-1">
        <Button asChild size="sm" className="bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 font-semibold text-xs rounded-xl shadow-xs">
          <Link href={primaryCtaHref}>
            <span>{primaryCtaText}</span>
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
