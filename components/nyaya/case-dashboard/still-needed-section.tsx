'use client';

import * as React from 'react';
import Link from 'next/link';
import { HelpCircle, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface StillNeededItem {
  id: string;
  field: string;
  reason: string;
  ctaText?: string;
  ctaHref?: string;
}

interface StillNeededSectionProps {
  caseId?: string;
  items?: StillNeededItem[];
  className?: string;
}

const DEFAULT_STILL_NEEDED: StillNeededItem[] = [
  {
    id: 'sn-1',
    field: 'Exact Security Deposit Amount',
    reason: 'Needed to establish disputed claim value for pre-litigation settlement or legal aid application.',
    ctaText: 'Add Details',
  },
  {
    id: 'sn-2',
    field: 'Copy of Written Notice or Email',
    reason: 'Helps verify whether statutory 30-day notice requirement was honored.',
    ctaText: 'Upload Document',
  },
];

export function StillNeededSection({
  caseId = 'case-1',
  items = DEFAULT_STILL_NEEDED,
  className,
}: StillNeededSectionProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn('legal-card p-5 space-y-3 border-amber-500/20 bg-amber-500/5', className)}>
      <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2.5">
        <HelpCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
          Information Still Needed
        </h3>
      </div>

      <div className="space-y-2 text-xs">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-amber-500/20 bg-card">
            <div className="space-y-0.5 min-w-0">
              <p className="font-semibold text-foreground">{item.field}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{item.reason}</p>
            </div>

            <Button asChild size="sm" variant="outline" className="h-7 text-xs px-2.5 rounded-lg border-amber-500/30 text-amber-800 dark:text-amber-400 font-semibold shrink-0">
              <Link href={item.ctaHref || `/chat?caseId=${caseId}`}>
                <span>{item.ctaText || 'Add Information'}</span>
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
