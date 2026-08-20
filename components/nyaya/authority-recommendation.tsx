import React from 'react';
import { ShieldAlert, ChevronRight, Scale, CheckCircle2 } from 'lucide-react';

interface AuthorityRecommendationProps {
  authority: string;
  reason: string;
  confidenceScore: number;
  onProceed?: () => void;
}

export function AuthorityRecommendation({ authority, reason, confidenceScore, onProceed }: AuthorityRecommendationProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Recommended Authority: {authority}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {reason}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {confidenceScore}% Match
              </span>
              <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400 px-2.5 py-1 rounded-full">
                <Scale className="h-3.5 w-3.5" />
                Appropriate Jurisdiction
              </span>
            </div>
          </div>
        </div>
        {onProceed && (
          <button
            onClick={onProceed}
            className="group flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Draft Complaint
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        )}
      </div>
    </div>
  );
}
