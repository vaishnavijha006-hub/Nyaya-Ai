'use client';

import * as React from 'react';
import { ShieldCheck, Lock, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function IntelligencePrivacyNotice({ className }: { className?: string }) {
  return (
    <div className={cn('p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/5 text-xs text-blue-900 dark:text-blue-300 space-y-1.5', className)}>
      <div className="flex items-center gap-2 font-bold text-xs">
        <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
        <span>ANONYMISED PATTERN ANALYSIS &amp; PRIVACY GUARANTEE</span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Pattern analysis uses anonymised, vector-clustered case representations. All personally identifiable information (PII) including names, Aadhaar numbers, PAN identifiers, contact numbers, and precise addresses are automatically stripped before similarity computation.
      </p>
    </div>
  );
}
