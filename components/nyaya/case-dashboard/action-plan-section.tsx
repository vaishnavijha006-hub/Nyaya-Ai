'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Clock, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ActionStepItem {
  id: string;
  stepNumber: string;
  title: string;
  description: string;
  status: 'DONE' | 'CURRENT' | 'UPCOMING';
  ctaText?: string;
  ctaHref?: string;
}

interface ActionPlanSectionProps {
  caseId?: string;
  steps?: ActionStepItem[];
  className?: string;
}

const DEFAULT_ACTION_STEPS: ActionStepItem[] = [
  {
    id: 'step-1',
    stepNumber: '01',
    title: 'Upload Rental Agreement & Payment Proof',
    description: 'Provide written tenancy agreement and deposit payment receipt.',
    status: 'DONE',
  },
  {
    id: 'step-2',
    stepNumber: '02',
    title: 'Specify Security Deposit Amount & Dates',
    description: 'Confirm exact numerical amount and handover date.',
    status: 'CURRENT',
    ctaText: 'Add Details',
    ctaHref: '/chat?caseId=case-1',
  },
  {
    id: 'step-3',
    stepNumber: '03',
    title: 'Review Preliminary Legal Analysis',
    description: 'Review applicable statutory protections under UP Urban Buildings Act.',
    status: 'UPCOMING',
  },
  {
    id: 'step-4',
    stepNumber: '04',
    title: 'Draft Pre-Litigation Legal Notice',
    description: 'Generate 15-day statutory notice to landlord.',
    status: 'UPCOMING',
    ctaText: 'Draft Notice',
    ctaHref: '/legal-notice',
  },
  {
    id: 'step-5',
    stepNumber: '05',
    title: 'Compile Judge-Ready Case Package',
    description: 'Export structured case file with chronology and annexures.',
    status: 'UPCOMING',
  },
];

export function ActionPlanSection({
  caseId = 'case-1',
  steps = DEFAULT_ACTION_STEPS,
  className,
}: ActionPlanSectionProps) {
  return (
    <div className={cn('legal-card p-5 space-y-4', className)}>
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Your Action Plan
          </h3>
        </div>

        <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
          Chronological Steps
        </span>
      </div>

      <div className="space-y-3">
        {steps.map((step) => {
          const isDone = step.status === 'DONE';
          const isCurrent = step.status === 'CURRENT';

          return (
            <div
              key={step.id}
              className={cn(
                'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all',
                isCurrent
                  ? 'border-amber-500/40 bg-amber-500/10 shadow-xs ring-1 ring-amber-500/20'
                  : isDone
                  ? 'border-border/60 bg-muted/20'
                  : 'border-border/80 bg-card opacity-75'
              )}
            >
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                    isDone && 'bg-emerald-600 text-white dark:bg-emerald-500',
                    isCurrent && 'bg-amber-500 text-slate-950 font-extrabold',
                    step.status === 'UPCOMING' && 'border border-border text-muted-foreground'
                  )}
                >
                  {isDone ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : step.stepNumber}
                </span>

                <div className="space-y-0.5 min-w-0">
                  <h4
                    className={cn(
                      'text-xs font-bold',
                      isCurrent && 'text-amber-900 dark:text-amber-300 font-extrabold',
                      isDone && 'text-foreground line-through opacity-70',
                      step.status === 'UPCOMING' && 'text-muted-foreground'
                    )}
                  >
                    {step.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {isCurrent && step.ctaText && (
                <Button asChild size="sm" className="bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 font-semibold text-xs rounded-xl shrink-0">
                  <Link href={step.ctaHref || `/chat?caseId=${caseId}`}>
                    <span>{step.ctaText}</span>
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
