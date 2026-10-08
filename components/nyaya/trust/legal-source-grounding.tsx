'use client';

import * as React from 'react';
import { Scale, BookOpen, FileCheck, CheckCircle2, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function LegalSourceGrounding({ isEmployment = false, className }: { isEmployment?: boolean; className?: string }) {
  const sources = isEmployment
    ? [
        {
          act: 'Payment of Wages Act, 1936 — Section 15',
          grounding: 'High Grounding',
          basis: 'Statutory claims arising out of unauthorized deductions or delayed payment of earned monthly salary.',
          facts: 'Offer Letter + Bank Statement Oct-Nov (Zero Salary Credit)',
        },
        {
          act: 'Karnataka Shops and Commercial Establishments Act, 1961 — Section 39',
          grounding: 'High Grounding',
          basis: 'Mandatory 30-day notice period or equivalent notice pay prior to termination of employment contract.',
          facts: 'Employment Offer Letter + Immediate Termination Email',
        },
      ]
    : [
        {
          act: 'Transfer of Property Act, 1882 — Section 108',
          grounding: 'High Grounding',
          basis: 'Duty of lessor to return advance security deposit upon peaceful surrender of leased premises, subject to reasonable wear and tear.',
          facts: 'Rent Agreement + ₹50,000 Payment Receipt',
        },
        {
          act: 'Consumer Protection Act, 2019 — Section 2(11)',
          grounding: 'High Grounding',
          basis: 'Unfair trade practice and deficiency of service rendered for consideration in rental property management.',
          facts: 'Move-out Notice + WhatsApp Notice Export',
        },
      ];

  return (
    <div className={cn('legal-card p-5 space-y-4 text-xs', className)}>
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Statutory Legal Source Grounding
          </h3>
        </div>
        <Badge variant="outline" className="text-[9px] font-bold uppercase text-amber-800 border-amber-400">
          Why Nyaya Says This
        </Badge>
      </div>

      <div className="space-y-3 text-[11px]">
        {sources.map((item, idx) => (
          <div key={idx} className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground">{item.act}</span>
              <Badge className="bg-emerald-600 text-white text-[9px]">{item.grounding}</Badge>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Statutory Basis: </strong>{item.basis}
            </p>
            <div className="pt-1 text-[10px] text-muted-foreground flex items-center gap-2 border-t border-border/50">
              <span>Facts Used: {item.facts}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
