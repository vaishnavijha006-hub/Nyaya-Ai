'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, CheckCircle2, ShieldCheck, Scale, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ADRWorkspaceProps {
  caseId?: string;
  className?: string;
}

export function ADRWorkspace({ caseId = 'case-1', className }: ADRWorkspaceProps) {
  const routes = [
    {
      title: 'DLSA Lok Adalat (Pre-Litigation Conciliation)',
      why: 'Suitable for compoundable civil, property, & recovery disputes. Zero court fees.',
      required: ['Rent Agreement Copy', 'ID Proof (Aadhaar / PAN)', 'Statement of Security Deposit Claim'],
      status: 'RECOMMENDED',
    },
    {
      title: 'Permanent Lok Adalat (Public Utility Services)',
      why: 'Statutory authority under Section 22B of Legal Services Authorities Act for public utility & tenancy matters.',
      required: ['Public Utility Connection / Tenancy Proof', 'Written Grievance Notice'],
      status: 'AVAILABLE',
    },
    {
      title: 'Court-Annexed Mediation Center',
      why: 'Voluntary confidential mediation presided over by certified neutral mediators.',
      required: ['Consent of Both Parties'],
      status: 'AVAILABLE',
    },
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
              <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Alternative Dispute Resolution (ADR)
              </span>
            </div>
            <h1 className="font-display text-xl font-bold text-foreground">
              Lok Adalat &amp; Mediation Routing
            </h1>
          </div>
        </div>

        <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 text-xs px-3 py-1 font-semibold w-fit">
          Suitable for ADR
        </Badge>
      </div>

      {/* ADR Routes */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-foreground">Available Resolution Pathways</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {routes.map((r, i) => (
            <div key={i} className="legal-card p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] uppercase font-bold px-2 py-0.5',
                    r.status === 'RECOMMENDED'
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-400'
                      : 'border-blue-500/40 bg-blue-500/10 text-blue-800 dark:text-blue-400'
                  )}
                >
                  {r.status}
                </Badge>
                <h3 className="text-xs font-bold text-foreground">{r.title}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{r.why}</p>
              </div>

              <div className="pt-2 border-t border-border/50 space-y-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Required Checklist:
                </span>
                {r.required.map((req, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[11px] text-foreground/90">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
