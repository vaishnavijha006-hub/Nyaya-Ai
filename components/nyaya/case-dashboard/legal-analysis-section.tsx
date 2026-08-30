'use client';

import * as React from 'react';
import { Scale, BookOpen, ShieldAlert, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LegalAnalysisSectionProps {
  category?: string;
  acts?: string[];
  summary?: string;
  caveats?: string[];
  className?: string;
}

export function LegalAnalysisSection({
  category = 'Rental Security Deposit Recovery',
  acts = [
    'Transfer of Property Act, 1882 (Section 108)',
    'Uttar Pradesh Urban Buildings (Regulation of Letting, Rent and Eviction) Act, 1972',
    'Indian Contract Act, 1872 (Section 73 - Breach of Contract)'
  ],
  summary = 'Under Indian tenancy framework and general contract principles, a security deposit is refundable upon peaceful handover of possession unless genuine structural damage is proven. Withholding deposits without written itemized repair bills constitutes an actionable breach.',
  caveats = [
    'Preliminary AI analysis based on user-provided facts.',
    'Requires formal verification of the written lease agreement provisions.',
    'Consult a qualified advocate or DLSA representative before legal proceedings.'
  ],
  className,
}: LegalAnalysisSectionProps) {
  return (
    <div className={cn('legal-card p-5 space-y-4', className)}>
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Preliminary Legal Analysis
          </h3>
        </div>

        <Badge variant="outline" className="border-amber-500/30 text-amber-800 dark:text-amber-400 text-[10px]">
          Initial AI Assessment
        </Badge>
      </div>

      {/* Summary */}
      <div className="space-y-1 text-xs">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Legal Framing
        </h4>
        <p className="text-foreground/90 leading-relaxed bg-muted/30 p-3 rounded-xl border border-border/60">
          {summary}
        </p>
      </div>

      {/* Applicable Acts */}
      <div className="space-y-1.5 pt-1">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5" /> Applicable Statutes & Precedents
        </h4>
        <div className="space-y-1">
          {acts.map((act, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-foreground/90">
              <span className="text-amber-600 font-bold">•</span>
              <span>{act}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Important Caveats */}
      <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground space-y-1">
        <span className="font-semibold text-foreground flex items-center gap-1">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-600" /> Legal Disclaimer
        </span>
        <ul className="space-y-0.5 pl-1">
          {caveats.map((c, i) => (
            <li key={i}>- {c}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
