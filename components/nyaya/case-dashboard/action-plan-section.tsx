'use client';

import * as React from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Clock, Circle, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ActionCardItem {
  id: string;
  status: 'DONE' | 'CURRENT' | 'UPCOMING';
  what: string;
  why: string;
  how: string;
  ctaText?: string;
  ctaHref?: string;
}

interface ActionPlanSectionProps {
  caseId?: string;
  actions?: ActionCardItem[];
  className?: string;
}

const DEFAULT_ACTIONS: ActionCardItem[] = [
  {
    id: 'act-1',
    status: 'DONE',
    what: 'Describe dispute facts & timeline during conversational intake',
    why: 'Extracts key dates, parties involved, and monetary claim amounts.',
    how: 'Completed during initial Ask Nyaya session.',
  },
  {
    id: 'act-2',
    status: 'CURRENT',
    what: 'Upload signed rent agreement & payment proof receipts',
    why: 'Establishes original tenancy terms, deposit amount, and lease refund clause.',
    how: 'Upload PDF or photo files from the Evidence & Documents section.',
    ctaText: 'Upload Documents',
    ctaHref: '/documents',
  },
  {
    id: 'act-3',
    status: 'UPCOMING',
    what: 'Draft formal 15-day pre-litigation Legal Demand Notice',
    why: 'Required under Indian law to give landlord statutory opportunity for amicable settlement.',
    how: 'Use Nyaya Legal Notice Drafter to generate court-formatted notice.',
    ctaText: 'Draft Legal Notice',
    ctaHref: '/legal-notice',
  },
  {
    id: 'act-4',
    status: 'UPCOMING',
    what: 'Compile Judge-Ready Case Package Dossier',
    why: 'Organizes facts, evidence matrix, and chronology into a clean dossier for advocate review.',
    how: 'Download PDF Case Dossier from the Case Package section.',
    ctaText: 'View Case Package',
    ctaHref: '/cases/case-1/case-package',
  },
];

export function ActionPlanSection({
  caseId = 'case-1',
  actions = DEFAULT_ACTIONS,
  className,
}: ActionPlanSectionProps) {
  const currentActions = actions.filter((a) => a.status === 'CURRENT');
  const upcomingActions = actions.filter((a) => a.status === 'UPCOMING');
  const doneActions = actions.filter((a) => a.status === 'DONE');

  return (
    <div className={cn('legal-card p-5 space-y-4', className)}>
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Structured Action Plan (WHAT • WHY • HOW)
          </h3>
        </div>
        <Badge variant="outline" className="border-amber-500/30 text-amber-800 dark:text-amber-400 text-[10px] font-semibold">
          Guided Steps
        </Badge>
      </div>

      {/* CURRENT ACTIONS (High Priority) */}
      {currentActions.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-400">
            Current Priority Step
          </span>
          {currentActions.map((act) => (
            <div key={act.id} className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-2 shadow-xs ring-1 ring-amber-500/20">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="outline" className="border-amber-500 bg-amber-500 text-slate-950 font-bold text-[10px]">
                  CURRENT STEP
                </Badge>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="font-extrabold text-foreground">WHAT: </span>
                  <span className="font-bold text-amber-900 dark:text-amber-300">{act.what}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">WHY: </span>
                  <span className="text-muted-foreground">{act.why}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">HOW: </span>
                  <span className="text-muted-foreground">{act.how}</span>
                </div>
              </div>

              {act.ctaText && (
                <div className="pt-2 border-t border-amber-500/20 flex justify-end">
                  <Button asChild size="sm" className="bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 font-semibold text-xs rounded-xl">
                    <Link href={act.ctaHref || '#'}>
                      <span>{act.ctaText}</span>
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* UPCOMING ACTIONS */}
      {upcomingActions.length > 0 && (
        <div className="space-y-2 pt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Upcoming Steps
          </span>
          <div className="space-y-2">
            {upcomingActions.map((act) => (
              <div key={act.id} className="rounded-xl border border-border/80 bg-card p-3.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{act.what}</span>
                  <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                    UPCOMING
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  <strong className="text-foreground">WHY:</strong> {act.why}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  <strong className="text-foreground">HOW:</strong> {act.how}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DONE ACTIONS */}
      {doneActions.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border/50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Completed Steps
          </span>
          <div className="space-y-1">
            {doneActions.map((act) => (
              <div key={act.id} className="flex items-center justify-between rounded-lg bg-muted/30 p-2.5 text-xs border border-border/40">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="line-through text-muted-foreground">{act.what}</span>
                </div>
                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                  DONE
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
