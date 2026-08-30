'use client';

import * as React from 'react';
import { FileText, UserCheck, CheckCircle2, Scale, ExternalLink, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type EvidenceSourceType =
  | 'USER_STATEMENT'
  | 'UPLOADED_DOCUMENT'
  | 'VERIFIED_DOCUMENT'
  | 'CASE_RECORD'
  | 'SYSTEM_EXTRACTED'
  | 'LEGAL_SOURCE'
  | 'LAWYER_REVIEW';

export interface EvidenceTraceItem {
  factLabel: string;
  factValue: string;
  sourceType: EvidenceSourceType;
  sourceTitle: string;
  verificationNote: string;
}

export function EvidenceTrace({ trace, className }: { trace: EvidenceTraceItem; className?: string }) {
  const sourceIcon = React.useMemo(() => {
    switch (trace.sourceType) {
      case 'UPLOADED_DOCUMENT':
      case 'VERIFIED_DOCUMENT':
        return <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />;
      case 'LEGAL_SOURCE':
        return <Scale className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />;
      case 'LAWYER_REVIEW':
        return <UserCheck className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />;
      default:
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />;
    }
  }, [trace.sourceType]);

  return (
    <div className={cn('p-3 rounded-xl border border-border/80 bg-card space-y-1.5 text-xs', className)}>
      <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground">{trace.factLabel}</span>
        <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-semibold">
          {trace.sourceType.replace('_', ' ')}
        </Badge>
      </div>

      <p className="font-bold text-foreground text-sm">{trace.factValue}</p>

      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1 border-t border-border/50">
        {sourceIcon}
        <span>Source: <strong className="text-foreground">{trace.sourceTitle}</strong> — {trace.verificationNote}</span>
      </div>
    </div>
  );
}
