'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Download, CheckCircle2, AlertTriangle, ShieldCheck, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CasePackageWorkspaceProps {
  caseId?: string;
  className?: string;
}

export function CasePackageWorkspace({ caseId = 'case-1', className }: CasePackageWorkspaceProps) {
  const sections = [
    { num: 1, title: '1. Executive Case Summary', status: 'READY' },
    { num: 2, title: '2. Parties & Contact Details', status: 'READY' },
    { num: 3, title: '3. Factual Chronology of Events', status: 'READY' },
    { num: 4, title: '4. Legal Issues in Dispute', status: 'READY' },
    { num: 5, title: '5. Evidence Matrix', status: 'READY' },
    { num: 6, title: '6. Applicable Statutory Provisions', status: 'READY' },
    { num: 7, title: '7. Document Annexure Index', status: 'READY' },
    { num: 8, title: '8. Missing Facts & Documents', status: 'NEEDS_ATTENTION' },
    { num: 9, title: '9. Advocate Review Notes', status: 'READY' },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
            <Link href={`/cases/${caseId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Judge-Ready Structured Dossier
              </span>
            </div>
            <h1 className="font-display text-xl font-bold text-foreground">
              Case Package Readiness
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-400 text-xs px-3 py-1 font-semibold">
            80% Ready (8/9 Sections)
          </Badge>
          <Button
            size="sm"
            onClick={() => toast.success('Exporting Judge-Ready PDF Package...')}
            className="bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 font-semibold text-xs rounded-xl"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export Case Package PDF
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="legal-card p-4 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-foreground">Completeness Score</span>
          <span className="font-bold text-amber-700 dark:text-amber-400">80% (Prepared for Advocate Review)</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div className="bg-amber-500 h-2 rounded-full transition-all duration-500" style={{ width: '80%' }} />
        </div>
        <p className="text-[11px] text-muted-foreground pt-1">
          ⚠️ Prepared for advocate review. Does not substitute formal court filing procedures.
        </p>
      </div>

      {/* 9 Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map((sec) => (
          <div key={sec.num} className="legal-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">{sec.title}</span>
              {sec.status === 'READY' ? (
                <Badge className="bg-emerald-600 text-white text-[10px]">✓ Ready</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-400">⚠ Review</Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
