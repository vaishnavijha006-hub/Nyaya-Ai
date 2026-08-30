'use client';

import * as React from 'react';
import Link from 'next/link';
import { Users, FileText, ArrowRight, ShieldAlert, Scale, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PatternItem {
  id: string;
  title: string;
  category: string;
  affectedCount: number;
  timePeriod: string;
  jurisdiction: string;
  commonIssue: string;
  commonContributingFactor: string;
  evidencePattern: string;
  status: 'RECURRING_SIGNAL' | 'POTENTIAL_SYSTEMIC_ISSUE' | 'REQUIRES_HUMAN_REVIEW';
  suggestedPathways: string[];
}

export function PatternCard({ pattern, className }: { pattern: PatternItem; className?: string }) {
  const statusBadge = React.useMemo(() => {
    switch (pattern.status) {
      case 'POTENTIAL_SYSTEMIC_ISSUE':
        return <Badge className="bg-purple-600 text-white text-[9px] uppercase font-bold">Potential Systemic Issue</Badge>;
      case 'RECURRING_SIGNAL':
        return <Badge className="bg-amber-600 text-white text-[9px] uppercase font-bold">Recurring Pattern Detected</Badge>;
      default:
        return <Badge variant="outline" className="text-[9px] uppercase font-semibold">Requires Legal Review</Badge>;
    }
  }, [pattern.status]);

  return (
    <div className={cn('legal-card p-5 space-y-4 text-xs hover:border-amber-500/50 transition-colors', className)}>
      <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              {pattern.category}
            </Badge>
            {statusBadge}
          </div>
          <h3 className="font-bold text-foreground text-base">{pattern.title}</h3>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold shrink-0">
          <Users className="h-3.5 w-3.5" />
          <span>{pattern.affectedCount} Similar Cases</span>
        </div>
      </div>

      <div className="space-y-2 text-[11px]">
        <div>
          <span className="font-semibold text-muted-foreground uppercase text-[10px]">Common Issue:</span>
          <p className="text-foreground font-medium">{pattern.commonIssue}</p>
        </div>

        <div>
          <span className="font-semibold text-muted-foreground uppercase text-[10px]">Evidence Pattern:</span>
          <p className="text-muted-foreground flex items-center gap-1">
            <FileText className="h-3 w-3 text-slate-500 shrink-0" />
            {pattern.evidencePattern}
          </p>
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
          <span>Scope: {pattern.jurisdiction}</span>
          <span>Timeline: {pattern.timePeriod}</span>
        </div>
      </div>

      <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {pattern.suggestedPathways.map((pw, i) => (
            <span key={i} className="text-[10px] bg-muted px-2 py-0.5 rounded-md font-medium text-foreground">
              {pw}
            </span>
          ))}
        </div>

        <Button asChild size="sm" variant="ghost" className="h-8 text-xs font-bold text-amber-700 hover:text-amber-800 dark:text-amber-400">
          <Link href={`/intelligence/${pattern.id}`} className="flex items-center gap-1">
            <span>Explore Pattern</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
