'use client';

import * as React from 'react';
import { Scale, BookOpen, FileCheck, CheckCircle2, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function LegalSourceGrounding({ className }: { className?: string }) {
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
        <div className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground">Transfer of Property Act, 1882 — Section 108</span>
            <Badge className="bg-emerald-600 text-white text-[9px]">High Grounding</Badge>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Statutory Basis:</strong> Duty of lessor to return advance security deposit upon peaceful surrender of leased premises, subject to reasonable wear and tear.
          </p>
          <div className="pt-1 text-[10px] text-muted-foreground flex items-center gap-2 border-t border-border/50">
            <span>Facts Used: Rent Agreement + ₹50,000 Payment Receipt</span>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground">Consumer Protection Act, 2019 — Section 2(11)</span>
            <Badge className="bg-emerald-600 text-white text-[9px]">High Grounding</Badge>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Statutory Basis:</strong> Unfair trade practice and deficiency of service rendered for consideration in rental property management.
          </p>
          <div className="pt-1 text-[10px] text-muted-foreground flex items-center gap-2 border-t border-border/50">
            <span>Facts Used: Move-out Notice + WhatsApp Notice Export</span>
          </div>
        </div>
      </div>
    </div>
  );
}
