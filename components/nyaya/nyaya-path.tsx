'use client';

import * as React from 'react';
import { CheckCircle2, Circle, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NyayaPathStep {
  id: string;
  name: string;
  shortName: string;
  humanLabel: string;
  description: string;
}

export const LEGAL_JOURNEY_STEPS: NyayaPathStep[] = [
  {
    id: 'problem',
    name: 'Problem',
    shortName: 'Problem',
    humanLabel: 'Problem Stated',
    description: 'Initial natural language description of dispute.',
  },
  {
    id: 'facts',
    name: 'Facts',
    shortName: 'Facts',
    humanLabel: 'Gathering Facts',
    description: 'Extracting dates, parties, jurisdiction & core events.',
  },
  {
    id: 'evidence',
    name: 'Evidence',
    shortName: 'Evidence',
    humanLabel: 'Reviewing Evidence',
    description: 'Verifying contracts, payment receipts & notices.',
  },
  {
    id: 'analysis',
    name: 'Legal Analysis',
    shortName: 'Analysis',
    humanLabel: 'Analyzing Law',
    description: 'Identifying applicable Indian statutes & precedents.',
  },
  {
    id: 'pathway',
    name: 'Resolution Path',
    shortName: 'Path',
    humanLabel: 'Exploring Pathways',
    description: 'Evaluating settlement, mediation, legal aid or court.',
  },
  {
    id: 'action',
    name: 'Action',
    shortName: 'Action',
    humanLabel: 'Executing Action',
    description: 'Drafting legal notices, applications & case package.',
  },
  {
    id: 'resolution',
    name: 'Resolution',
    shortName: 'Resolution',
    humanLabel: 'Resolution',
    description: 'Final binding agreement, award, or court disposition.',
  },
];

interface NyayaPathProps {
  currentStepIndex?: number;
  variant?: 'compact' | 'detailed';
  className?: string;
}

export function NyayaPath({
  currentStepIndex = 3,
  variant = 'compact',
  className,
}: NyayaPathProps) {
  const activeStep = LEGAL_JOURNEY_STEPS[Math.min(currentStepIndex, LEGAL_JOURNEY_STEPS.length - 1)];

  return (
    <div className={cn('legal-card p-4 space-y-3', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Legal Journey Stage
          </h3>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">Current Stage:</span>
          <span className="font-bold text-amber-700 dark:text-amber-400">
            {activeStep.humanLabel} ({currentStepIndex + 1}/7)
          </span>
        </div>
      </div>

      {/* 7-Step Progress Tracker */}
      <div className="grid grid-cols-7 gap-1 pt-1">
        {LEGAL_JOURNEY_STEPS.map((step, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isActive = idx === currentStepIndex;
          const isUpcoming = idx > currentStepIndex;

          return (
            <div key={step.id} className="flex flex-col items-center gap-1 group text-center min-w-0">
              {/* Connector & Circle */}
              <div
                className={cn(
                  'h-1.5 w-full rounded-full transition-colors',
                  isCompleted && 'bg-emerald-600 dark:bg-emerald-500',
                  isActive && 'bg-amber-500 ring-2 ring-amber-500/30',
                  isUpcoming && 'bg-border/60'
                )}
              />

              <div className="hidden sm:flex flex-col items-center w-full min-w-0">
                <span
                  title={step.name}
                  className={cn(
                    'text-[9px] font-semibold transition-colors block w-full truncate leading-tight',
                    isCompleted && 'text-emerald-700 dark:text-emerald-400 font-bold',
                    isActive && 'text-amber-900 dark:text-amber-300 font-extrabold',
                    isUpcoming && 'text-muted-foreground/70'
                  )}
                >
                  {step.shortName || step.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Stage Detail Explanation */}
      {variant === 'detailed' && (
        <div className="text-xs bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 space-y-0.5 mt-2">
          <span className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1">
            <ArrowRight className="h-3.5 w-3.5 text-amber-600" /> What Nyaya is doing now:
          </span>
          <p className="text-foreground/90 leading-relaxed">{activeStep.description}</p>
        </div>
      )}
    </div>
  );
}
