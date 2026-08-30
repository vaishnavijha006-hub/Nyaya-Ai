'use client';

import * as React from 'react';
import { Check, Circle, Dot, Scale, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface JourneyStep {
  id: string;
  label: string;
  description?: string;
  status?: 'completed' | 'active' | 'upcoming';
}

export const DEFAULT_LEGAL_STEPS: JourneyStep[] = [
  { id: 'problem', label: 'Problem', description: 'Describe your situation in plain language' },
  { id: 'facts', label: 'Facts', description: 'Extract & verify core legal facts' },
  { id: 'evidence', label: 'Evidence', description: 'Review documents & supporting proof' },
  { id: 'analysis', label: 'Legal Analysis', description: 'Apply statutes, case law & regulations' },
  { id: 'pathway', label: 'Resolution Path', description: 'Identify optimal legal pathway (ADR, Aid, PIL)' },
  { id: 'action', label: 'Action', description: 'Draft filings, notices, or applications' },
  { id: 'resolution', label: 'Resolution', description: 'Achieve formal resolution' },
];

interface NyayaPathProps {
  currentStepIndex?: number;
  steps?: JourneyStep[];
  variant?: 'compact' | 'detailed';
  className?: string;
  onStepClick?: (step: JourneyStep, index: number) => void;
}

export function NyayaPath({
  currentStepIndex = 3, // Defaults to 'Legal Analysis' active for demonstration
  steps = DEFAULT_LEGAL_STEPS,
  variant = 'compact',
  className,
  onStepClick,
}: NyayaPathProps) {
  const computedSteps = React.useMemo(() => {
    return steps.map((step, idx) => {
      let status: 'completed' | 'active' | 'upcoming' = 'upcoming';
      if (idx < currentStepIndex) status = 'completed';
      else if (idx === currentStepIndex) status = 'active';
      return { ...step, status };
    });
  }, [steps, currentStepIndex]);

  if (variant === 'compact') {
    return (
      <div className={cn('w-full rounded-xl border border-border/80 bg-card p-3.5 shadow-sm', className)}>
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-amber-600 dark:text-amber-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your Legal Journey
            </span>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            Step {currentStepIndex + 1} of {computedSteps.length}:{' '}
            <strong className="font-semibold text-foreground">{computedSteps[currentStepIndex]?.label}</strong>
          </span>
        </div>

        {/* Responsive Horizontal Progress Line */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 no-scrollbar">
          {computedSteps.map((step, idx) => {
            const isCompleted = step.status === 'completed';
            const isActive = step.status === 'active';
            const isLast = idx === computedSteps.length - 1;

            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  disabled={!onStepClick}
                  onClick={() => onStepClick?.(step, idx)}
                  className={cn(
                    'group flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-all',
                    isActive && 'bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold ring-1 ring-amber-500/30',
                    isCompleted && 'text-slate-700 dark:text-slate-300 hover:bg-muted',
                    step.status === 'upcoming' && 'text-muted-foreground/60 opacity-70'
                  )}
                  title={`${step.label}: ${step.description}`}
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] transition-colors',
                      isCompleted && 'bg-emerald-600 text-white dark:bg-emerald-500',
                      isActive && 'bg-amber-500 text-slate-950 font-bold',
                      step.status === 'upcoming' && 'border border-border bg-muted/50 text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    ) : isActive ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-950" />
                    ) : (
                      idx + 1
                    )}
                  </span>
                  <span className="whitespace-nowrap">{step.label}</span>
                </button>

                {!isLast && (
                  <ChevronRight
                    className={cn(
                      'h-3 w-3 shrink-0',
                      idx < currentStepIndex ? 'text-emerald-500/70' : 'text-border'
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  // Detailed Vertical / Card Variant
  return (
    <div className={cn('rounded-xl border border-border/80 bg-card p-5 shadow-sm', className)}>
      <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Legal Journey Progression
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Structured 7-step path to resolution
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
          <Scale className="h-3.5 w-3.5" />
          Active: {computedSteps[currentStepIndex]?.label}
        </div>
      </div>

      <div className="relative space-y-4 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/60">
        {computedSteps.map((step, idx) => {
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';

          return (
            <div
              key={step.id}
              className={cn(
                'relative flex items-start gap-3.5 rounded-lg p-2.5 transition-all',
                isActive && 'bg-amber-500/10 border border-amber-500/20 shadow-xs'
              )}
            >
              <span
                className={cn(
                  'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all',
                  isCompleted && 'bg-emerald-600 text-white dark:bg-emerald-500 ring-4 ring-emerald-500/10',
                  isActive && 'bg-amber-500 text-slate-950 font-bold ring-4 ring-amber-500/20',
                  step.status === 'upcoming' && 'border border-border bg-card text-muted-foreground'
                )}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : idx + 1}
              </span>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center justify-between">
                  <h4
                    className={cn(
                      'text-sm font-semibold',
                      isActive && 'text-amber-800 dark:text-amber-400',
                      isCompleted && 'text-foreground',
                      step.status === 'upcoming' && 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </h4>
                  {isCompleted && (
                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      Completed
                    </span>
                  )}
                  {isActive && (
                    <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                      In Progress
                    </span>
                  )}
                </div>
                {step.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
