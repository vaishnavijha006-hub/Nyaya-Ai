'use client';

import * as React from 'react';
import Link from 'next/link';
import { FileText, Download, Check, AlertCircle, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CasePackageSectionProps {
  caseId?: string;
  isReady?: boolean;
  annexuresCount?: number;
  className?: string;
}

export function CasePackageSection({
  caseId = 'case-1',
  isReady = false,
  annexuresCount = 2,
  className,
}: CasePackageSectionProps) {
  const sections = [
    { title: '1. Executive Case Summary', status: '✓ Complete' },
    { title: '2. Parties & Jurisdiction Block', status: '✓ Complete' },
    { title: '3. Factual Chronology', status: '✓ Complete' },
    { title: '4. Legal Issues & Applicable Acts', status: '✓ Complete' },
    { title: '5. Issue-Evidence Matrix', status: '✓ Complete' },
    { title: '6. Document Index & Annexures', status: `${annexuresCount} Attached` },
    { title: '7. Relief Requested & Statutory Prayer', status: '✓ Complete' },
  ];

  return (
    <div className={cn('legal-card p-5 space-y-4', className)}>
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Judge-Ready Case Package
          </h3>
        </div>

        <Badge variant="outline" className="border-amber-500/30 text-amber-800 dark:text-amber-400 text-[10px]">
          {isReady ? 'Ready for Download' : 'Partially Compiled'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {sections.map((s, idx) => (
          <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-card">
            <span className="font-medium text-foreground truncate">{s.title}</span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
              {s.status}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50">
        <p className="text-[11px] text-muted-foreground">
          Generates a structured court-ready PDF file for advocates or legal aid clinics.
        </p>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => toast.success('Case Package PDF compiled successfully')}
            className="bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 font-semibold text-xs rounded-xl"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Download Package
          </Button>
        </div>
      </div>
    </div>
  );
}
