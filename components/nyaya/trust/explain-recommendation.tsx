'use client';

import * as React from 'react';
import { HelpCircle, ChevronDown, ChevronUp, ShieldCheck, Scale, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ExplainRecommendationProps {
  title?: string;
  recommendation?: string;
  factors?: string[];
  evidenceUsed?: string[];
  missingInfo?: string[];
  className?: string;
}

export function ExplainRecommendation({
  title = 'Why this pathway?',
  recommendation = 'Pre-Litigation Settlement Notice',
  factors = [
    'A documented monetary dispute (₹50,000 security deposit) is identified.',
    'Supporting agreement & payment receipt uploaded.',
    'No previous settlement attempt recorded.',
    'Dispute type is compoundable and suitable for pre-litigation resolution.'
  ],
  evidenceUsed = ['Rent Agreement Contract.pdf', 'UPI Payment Receipt.pdf'],
  missingInfo = ['Landlord official advocate notice address'],
  className,
}: ExplainRecommendationProps) {
  const [expanded, setExpanded] = React.useState(true);

  return (
    <div className={cn('legal-card p-4 space-y-3 text-xs', className)}>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between font-bold text-foreground text-xs"
      >
        <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
          <HelpCircle className="h-4 w-4" />
          WHY THIS RECOMMENDATION? ({recommendation})
        </span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="pt-2 border-t border-border/60 space-y-3">
          <div className="space-y-1">
            <span className="font-semibold text-muted-foreground text-[10px] uppercase">Factors Considered:</span>
            {factors.map((f, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px] text-foreground/90">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{f}</span>
              </div>
            ))}
          </div>

          {evidenceUsed.length > 0 && (
            <div className="space-y-1">
              <span className="font-semibold text-muted-foreground text-[10px] uppercase">Evidence Considered:</span>
              <ul className="text-[11px] text-muted-foreground space-y-0.5 pl-4 list-disc">
                {evidenceUsed.map((ev, i) => (
                  <li key={i}>{ev}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground italic border-t border-border/40 pt-2">
            ⚠️ This is an AI-assisted recommendation based on observable facts, not a deterministic legal prediction or outcome guarantee.
          </p>
        </div>
      )}
    </div>
  );
}
