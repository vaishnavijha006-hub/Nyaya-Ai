'use client';

import * as React from 'react';
import { Scale, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function PILSuitabilityCard({ className }: { className?: string }) {
  return (
    <div className={cn('legal-card p-5 space-y-3.5 text-xs', className)}>
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            PIL Suitability Assessment (Preliminary)
          </h3>
        </div>
        <Badge variant="outline" className="text-[9px] font-bold uppercase text-purple-800 border-purple-400">
          Moderate Indication
        </Badge>
      </div>

      <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-2">
        <span className="font-bold text-purple-900 dark:text-purple-300 text-xs">Potential PIL Relevance Detected</span>
        <ul className="text-[11px] text-foreground/90 space-y-1 list-disc pl-4">
          <li>Issue appears to affect multiple tenants across municipal zone.</li>
          <li>Pattern demonstrates recurring non-compliance with statutory notice requirements.</li>
          <li>Widespread impact on public welfare and citizen housing security.</li>
        </ul>
      </div>

      <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1 text-amber-900 dark:text-amber-300 text-[11px]">
        <div className="flex items-center gap-1.5 font-bold text-xs text-amber-800 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Why this does NOT automatically mean a PIL should be filed:</span>
        </div>
        <p className="leading-relaxed text-[10px]">
          Individual dispute remedies (Rent Controller / Consumer Commission) must be evaluated first. Article 226 / 32 maintainability requires constitutional advocate verification. Nyaya AI does NOT file PILs or declare legal maintainability.
        </p>
      </div>
    </div>
  );
}
