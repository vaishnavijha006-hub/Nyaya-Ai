'use client';

import * as React from 'react';
import { FileText, CheckCircle2, AlertTriangle, Edit3, XCircle } from 'lucide-react';
import { FactStatusBadge, FactStatus } from './fact-status-badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface FactItem {
  id: string;
  label: string;
  value: string;
  sourceName: string;
  status: FactStatus;
  userStatement?: string;
  documentValue?: string;
}

export function FactVerificationCard({ fact, className }: { fact: FactItem; className?: string }) {
  const [factState, setFactState] = React.useState<FactStatus>(fact.status);

  return (
    <div className={cn('p-3.5 rounded-xl border border-border/80 bg-card space-y-2 text-xs', className)}>
      <div className="flex items-center justify-between">
        <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">{fact.label}</span>
        <FactStatusBadge status={factState} />
      </div>

      <div className="flex items-center justify-between">
        <span className="font-bold text-foreground text-sm">{fact.value}</span>
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <FileText className="h-3 w-3 text-slate-500" />
          {fact.sourceName}
        </span>
      </div>

      {fact.userStatement && fact.documentValue && factState === 'CONFLICTING' && (
        <div className="p-2.5 rounded-lg border border-red-500/30 bg-red-500/5 text-[11px] space-y-1 text-red-900 dark:text-red-300">
          <p>User statement: <span className="font-semibold">{fact.userStatement}</span></p>
          <p>Uploaded receipt: <span className="font-semibold">{fact.documentValue}</span></p>
          <p className="text-[10px] italic">⚠ These records do not currently match.</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/50">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setFactState('CONFIRMED');
            toast.success(`Fact "${fact.label}" confirmed cleanly`);
          }}
          className="h-7 text-[11px] text-emerald-700 hover:bg-emerald-50 font-medium px-2"
        >
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Confirm
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => toast.info(`Edit mode for ${fact.label}`)}
          className="h-7 text-[11px] text-muted-foreground hover:bg-muted font-medium px-2"
        >
          <Edit3 className="h-3 w-3 mr-1" />
          Edit
        </Button>
      </div>
    </div>
  );
}
