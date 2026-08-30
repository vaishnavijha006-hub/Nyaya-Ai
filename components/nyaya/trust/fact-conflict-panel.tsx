'use client';

import * as React from 'react';
import { AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ConflictItem {
  id: string;
  parameter: string;
  userStatement: string;
  documentRecord: string;
  documentName: string;
}

const DEFAULT_CONFLICTS: ConflictItem[] = [
  {
    id: 'conf-1',
    parameter: 'Deposit Payment Date',
    userStatement: '15 June 2025',
    documentRecord: '17 June 2025',
    documentName: 'UPI Payment Receipt.pdf',
  },
];

export function FactConflictPanel({ conflicts = DEFAULT_CONFLICTS, className }: { conflicts?: ConflictItem[]; className?: string }) {
  if (!conflicts.length) return null;

  return (
    <div className={cn('p-4 rounded-xl border border-red-500/40 bg-red-500/5 space-y-3 text-xs', className)}>
      <div className="flex items-center gap-2 text-red-900 dark:text-red-300 font-bold text-xs">
        <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
        <span>INFORMATION CONFLICT DETECTED</span>
      </div>

      <div className="space-y-3">
        {conflicts.map((c) => (
          <div key={c.id} className="p-3 rounded-lg border border-red-500/20 bg-background space-y-1 text-[11px]">
            <span className="font-bold text-foreground">{c.parameter}</span>
            <div className="grid grid-cols-2 gap-2 text-muted-foreground pt-1">
              <div>
                <span className="block text-[10px] font-semibold uppercase text-slate-500">Your Statement:</span>
                <span className="font-semibold text-foreground">{c.userStatement}</span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold uppercase text-slate-500">Document ({c.documentName}):</span>
                <span className="font-semibold text-foreground">{c.documentRecord}</span>
              </div>
            </div>
            <p className="text-[10px] text-amber-800 dark:text-amber-400 pt-1">
              ⚠ Nyaya AI cannot determine which date is correct. Silent overwriting is prevented.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
