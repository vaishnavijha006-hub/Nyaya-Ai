'use client';

import * as React from 'react';
import { Scale, BookOpen, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LegalSourceCardProps {
  actName?: string;
  section?: string;
  provisionText?: string;
  aiInterpretation?: string;
  lastVerified?: string;
  className?: string;
}

export function LegalSourceCard({
  actName = 'Transfer of Property Act, 1882',
  section = 'Section 108 — Rights and Liabilities of Lessor and Lessee',
  provisionText = 'The lessor is bound to return the security deposit upon peaceful determination of the lease unless specific tenant breach is proved.',
  aiInterpretation = 'Based on the facts provided, this section supports your claim for refund of ₹50,000 security deposit.',
  lastVerified = '12 Aug 2026',
  className,
}: LegalSourceCardProps) {
  return (
    <div className={cn('legal-card p-4 space-y-3 text-xs', className)}>
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="font-bold text-foreground">{actName}</span>
        </div>
        <Badge variant="outline" className="text-[9px] uppercase font-bold text-amber-800 border-amber-400">
          Statutory Source
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="p-3 rounded-lg border border-border/80 bg-muted/20 space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">STATUTORY TEXT ({section}):</span>
          <p className="text-[11px] text-foreground font-mono leading-relaxed">{provisionText}</p>
        </div>

        <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-500/5 space-y-1">
          <span className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">AI INTERPRETATION:</span>
          <p className="text-[11px] text-foreground leading-relaxed">{aiInterpretation}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
        <span>Verified Official Legal Source</span>
        <span>Last Verified: {lastVerified}</span>
      </div>
    </div>
  );
}
