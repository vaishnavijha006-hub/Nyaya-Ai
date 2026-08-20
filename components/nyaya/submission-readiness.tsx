import React from 'react';
import { AlertCircle, CheckCircle2, ListChecks } from 'lucide-react';

interface Requirement {
  id: string;
  description: string;
  isMet: boolean;
}

interface SubmissionReadinessProps {
  score: number;
  requirements: Requirement[];
}

export function SubmissionReadiness({ score, requirements }: SubmissionReadinessProps) {
  const isReady = score >= 80;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            Submission Readiness
          </h3>
        </div>
        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${isReady ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'}`}>
          {isReady ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{score}% Ready</span>
        </div>
      </div>
      
      <div className="space-y-3">
        {requirements.map((req) => (
          <div key={req.id} className="flex items-start gap-3 rounded-lg border border-border/50 p-3 bg-muted/30">
            {req.isMet ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 text-amber-500 shrink-0" />
            )}
            <span className={`text-sm leading-relaxed ${req.isMet ? 'text-foreground' : 'text-muted-foreground'}`}>
              {req.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
