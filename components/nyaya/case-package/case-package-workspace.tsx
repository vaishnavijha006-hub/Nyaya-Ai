'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Download, CheckCircle2, AlertTriangle, ShieldCheck, Scale, Info } from 'lucide-react';
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
    { num: 1, title: '1. Executive Case Summary', status: 'READY', desc: 'Overview of legal claim & dispute background.' },
    { num: 2, title: '2. Parties & Contact Details', status: 'READY', desc: 'Complainant & Respondent identity details.' },
    { num: 3, title: '3. Factual Chronology of Events', status: 'READY', desc: 'Date-wise timeline of agreement, dispute & notices.' },
    { num: 4, title: '4. Legal Issues in Dispute', status: 'READY', desc: 'Framed statutory issues under Indian law.' },
    { num: 5, title: '5. Evidence Matrix', status: 'READY', desc: 'Cross-reference of claims against uploaded proofs.' },
    { num: 6, title: '6. Applicable Statutory Provisions', status: 'READY', desc: 'Transfer of Property Act, Contract Act & Rent Control Acts.' },
    { num: 7, title: '7. Document Annexure Index', status: 'READY', desc: 'Indexed list of agreements, receipts & messages.' },
    { num: 8, title: '8. Missing Information & Gaps', status: 'NEEDS_ATTENTION', desc: 'Outstanding page 3 scan & payment confirmation.' },
    { num: 9, title: '9. Advocate Review Notes', status: 'READY', desc: 'Blank template for advocate legal opinion.' },
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
                Judge-Ready Case Package Dossier
              </span>
            </div>
            <h1 className="font-display text-xl font-bold text-foreground">
              Structured Case Organization
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-400 text-xs px-3 py-1 font-semibold">
            80% Prepared (8/9 Sections)
          </Badge>
          <Button
            size="sm"
            onClick={() => toast.success('Exporting Judge-Ready Case Package PDF...')}
            className="bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 font-semibold text-xs rounded-xl"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export Case Dossier PDF
          </Button>
        </div>
      </div>

      {/* Prominent Mandatory Safety & Legal Disclaimers */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-xs">
          <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Mandatory Disclosure &amp; Legal Status</span>
        </div>
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
          This package organizes your case information, chronology, and evidence matrix for easier review. It does <strong>not</strong> represent a court-approved document or formal judicial filing.
        </p>
        <div className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-400 font-semibold pt-1">
          <Info className="h-3.5 w-3.5 shrink-0 text-amber-600" />
          <span>Requires qualified advocate review before filing or formal reliance in any court or tribunal.</span>
        </div>
      </div>

      {/* 9 Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map((sec) => (
          <div key={sec.num} className="legal-card p-4 space-y-2 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">{sec.title}</span>
                {sec.status === 'READY' ? (
                  <Badge className="bg-emerald-600 text-white text-[10px]">✓ Ready</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-400 font-bold">⚠ Missing Info</Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{sec.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
