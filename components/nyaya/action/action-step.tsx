'use client';

import * as React from 'react';
import { CheckCircle2, Clock, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActionStepItem {
  stepNumber: number;
  title: string;
  description?: string;
  status: 'COMPLETED' | 'ACTIVE' | 'UPCOMING';
  attribution?: 'AI_GENERATED' | 'USER_CONFIRMED' | 'LAWYER_REVIEWED';
}

export function ActionStep({ item }: { item: ActionStepItem }) {
  return (
    <div className="flex items-start gap-3 text-xs">
      <div className="mt-0.5 shrink-0">
        {item.status === 'COMPLETED' ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        ) : item.status === 'ACTIVE' ? (
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-pulse" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground">{item.title}</span>
          {item.attribution && (
            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-semibold">
              {item.attribution.replace('_', ' ')}
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-[11px] text-muted-foreground leading-relaxed">{item.description}</p>
        )}
      </div>
    </div>
  );
}
