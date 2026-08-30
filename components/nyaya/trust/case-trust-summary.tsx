'use client';

import * as React from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function CaseTrustSummary({ className }: { className?: string }) {
  return (
    <div className={cn('legal-card p-5 space-y-4 text-xs', className)}>
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Case Information &amp; Trust Status
          </h3>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Qualitative Audit</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl border border-border/80 bg-card space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Facts Captured:</span>
          <p className="font-bold text-foreground">✓ 14 Recorded (2 Need Review)</p>
        </div>

        <div className="p-3 rounded-xl border border-border/80 bg-card space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Documents:</span>
          <p className="font-bold text-foreground">✓ 2 Uploaded (1 Draft)</p>
        </div>

        <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1">
          <span className="text-[10px] text-amber-800 dark:text-amber-300 uppercase font-semibold">Conflicts:</span>
          <p className="font-bold text-amber-900 dark:text-amber-300">⚠ 1 Date Mismatch</p>
        </div>

        <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-1">
          <span className="text-[10px] text-purple-800 dark:text-purple-300 uppercase font-semibold">Human Review:</span>
          <p className="font-bold text-purple-900 dark:text-purple-300">Awaiting Advocate Review</p>
        </div>
      </div>
    </div>
  );
}
