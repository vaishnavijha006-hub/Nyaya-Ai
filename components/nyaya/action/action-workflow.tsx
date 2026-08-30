'use client';

import * as React from 'react';
import { ActionStep, ActionStepItem } from './action-step';
import { ActionStatusBadge, ActionStepStatus } from './action-status';
import { cn } from '@/lib/utils';

interface ActionWorkflowProps {
  title?: string;
  status?: ActionStepStatus;
  steps?: ActionStepItem[];
  className?: string;
}

const DEFAULT_STEPS: ActionStepItem[] = [
  {
    stepNumber: 1,
    title: 'STEP 1: Review case facts',
    description: 'Extracted parties, tenancy date, and deposit details.',
    status: 'COMPLETED',
    attribution: 'USER_CONFIRMED',
  },
  {
    stepNumber: 2,
    title: 'STEP 2: Review uploaded evidence',
    description: 'Verified rent agreement and UPI payment receipt.',
    status: 'COMPLETED',
    attribution: 'AI_GENERATED',
  },
  {
    stepNumber: 3,
    title: 'STEP 3: Review pre-litigation notice draft',
    description: 'AI-generated notice framing 15-day settlement window.',
    status: 'ACTIVE',
    attribution: 'AI_GENERATED',
  },
  {
    stepNumber: 4,
    title: 'STEP 4: Confirm notice before saving / exporting',
    description: 'Requires citizen review before final document preparation.',
    status: 'UPCOMING',
  },
];

export function ActionWorkflow({
  title = 'Pre-Litigation Settlement Action Workflow',
  status = 'RECOMMENDED',
  steps = DEFAULT_STEPS,
  className,
}: ActionWorkflowProps) {
  return (
    <div className={cn('legal-card p-5 space-y-4', className)}>
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{title}</h3>
        <ActionStatusBadge status={status} />
      </div>

      <div className="space-y-4">
        {steps.map((st) => (
          <ActionStep key={st.stepNumber} item={st} />
        ))}
      </div>
    </div>
  );
}
