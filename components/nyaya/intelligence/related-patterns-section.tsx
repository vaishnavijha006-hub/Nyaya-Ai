'use client';

import * as React from 'react';
import Link from 'next/link';
import { Network, ArrowRight, Users, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function RelatedPatternsSection({ caseId, isEmployment = false, className }: { caseId: string; isEmployment?: boolean; className?: string }) {
  const checkEmp = isEmployment || caseId === 'case-2' || caseId === 'demo-case-2' || caseId.includes('2') || caseId.toLowerCase().includes('employment');

  return (
    <div className={cn('legal-card p-5 space-y-3.5 text-xs', className)}>
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Related Systemic Patterns
          </h3>
        </div>
        <Badge variant="outline" className="text-[9px] font-bold uppercase text-amber-800 border-amber-400">
          Intelligence Layer
        </Badge>
      </div>

      <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground text-xs">
              {checkEmp ? 'Unpaid Salary & Immediate Termination Pattern' : 'Repeated Security Deposit Deductions Pattern'}
            </span>
            <Badge className="bg-amber-600 text-white text-[9px]">{checkEmp ? '28 Cases' : '42 Cases'}</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {checkEmp
              ? 'This case shares factual & structural characteristics with 28 anonymised IT/employment salary claims in Bengaluru District.'
              : 'This case shares factual & structural characteristics with 42 anonymised tenant deposit disputes in Urban District.'}
          </p>
        </div>

        <Button asChild size="sm" variant="outline" className="h-8 text-xs font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-400 shrink-0">
          <Link href={checkEmp ? '/intelligence/pat-2' : '/intelligence/pat-1'} className="flex items-center gap-1">
            <span>View Pattern</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
