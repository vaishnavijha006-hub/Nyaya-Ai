'use client';

import * as React from 'react';
import { Scale, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type ResolutionStageState =
  | 'INTAKE'
  | 'ANALYSIS'
  | 'SETTLEMENT'
  | 'ADR'
  | 'LEGAL_AID'
  | 'LITIGATION_PREPARATION'
  | 'ACTIVE_LITIGATION'
  | 'RESOLVED'
  | 'CLOSED';

interface ResolutionStatusProps {
  currentState?: ResolutionStageState;
  className?: string;
}

export function ResolutionStatus({ currentState = 'SETTLEMENT', className }: ResolutionStatusProps) {
  const stages: Array<{ state: ResolutionStageState; label: string; description: string }> = [
    { state: 'INTAKE', label: '1. Fact Intake', description: 'Gathering core facts & dates' },
    { state: 'ANALYSIS', label: '2. Legal Analysis', description: 'Statutory framework review' },
    { state: 'SETTLEMENT', label: '3. Pre-Litigation Notice', description: 'Settlement & negotiation' },
    { state: 'ADR', label: '4. Mediation / ADR', description: 'Lok Adalat / Conciliation' },
    { state: 'LITIGATION_PREPARATION', label: '5. Case Package', description: 'Advocate review & court filing' },
    { state: 'RESOLVED', label: '6. Resolution', description: 'Dispute resolved & closed' },
  ];

  const currentIdx = stages.findIndex((s) => s.state === currentState);

  return (
    <div className={cn('legal-card p-5 space-y-4', className)}>
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Resolution Pathway Progress
          </h3>
        </div>

        <Badge variant="outline" className="border-amber-500/30 text-amber-800 dark:text-amber-400 text-[10px]">
          Active Stage: Pre-Litigation Settlement
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        {stages.map((st, idx) => {
          const isDone = idx < (currentIdx >= 0 ? currentIdx : 2);
          const isCurrent = idx === (currentIdx >= 0 ? currentIdx : 2);

          return (
            <div
              key={st.state}
              className={cn(
                'p-3 rounded-xl border space-y-1 transition-all',
                isCurrent
                  ? 'border-amber-500/40 bg-amber-500/10 shadow-xs'
                  : isDone
                  ? 'border-border/60 bg-muted/20 opacity-80'
                  : 'border-border/60 bg-card opacity-60'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">{st.label}</span>
                {isDone && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                {isCurrent && <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />}
              </div>
              <p className="text-[10px] text-muted-foreground">{st.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
