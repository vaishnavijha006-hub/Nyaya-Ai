'use client';

import * as React from 'react';
import { HelpCircle, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function PatternExplanation({ className }: { className?: string }) {
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
          WHY AM I SEEING THIS PATTERN? (EXPLAIN PATTERN)
        </span>
        <Badge variant="outline" className="text-[9px] uppercase font-bold text-amber-800 border-amber-500/40">
          Strong Recurring Signal
        </Badge>
      </button>

      {expanded && (
        <div className="pt-2 border-t border-border/60 space-y-3">
          <div className="space-y-1.5">
            <span className="font-semibold text-muted-foreground text-[10px] uppercase">Contributing Pattern Signals:</span>
            <div className="flex items-start gap-1.5 text-[11px] text-foreground/90">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>42 anonymised cases share matching factual descriptors (unreasonable security deposit deductions).</span>
            </div>
            <div className="flex items-start gap-1.5 text-[11px] text-foreground/90">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Consistent document types uploaded (Rent Agreement + Bank Transfer Receipt).</span>
            </div>
            <div className="flex items-start gap-1.5 text-[11px] text-foreground/90">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Concentrated geographic cluster within Urban Municipal Rent Control jurisdiction.</span>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground italic border-t border-border/40 pt-2">
            ⚠️ This is an AI-generated pattern assessment based on observable semantic signals. It does NOT establish legal liability, prove identical legal merits, or substitute for qualified legal advocate review.
          </p>
        </div>
      )}
    </div>
  );
}
