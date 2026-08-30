'use client';

import * as React from 'react';
import Link from 'next/link';
import { Scale, ArrowRight, Building2, Shield, FileText, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ResolutionPathwaysSectionProps {
  caseId?: string;
  className?: string;
}

export function ResolutionPathwaysSection({ caseId = 'case-1', className }: ResolutionPathwaysSectionProps) {
  const pathways = [
    {
      title: 'Pre-Litigation Settlement',
      why: 'Suitable when dispute is document-supported and parties are identifiable.',
      readiness: 'High Readiness',
      preparation: 'Rent Agreement & Payment Receipt attached.',
      ctaText: 'Start Settlement',
      ctaHref: `/cases/${caseId}/settlement`,
      badgeColor: 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-400 font-bold',
    },
    {
      title: 'Mediation / Lok Adalat (ADR)',
      why: 'Binding conciliation decree without court fees under Legal Services Authorities Act.',
      readiness: 'Available',
      preparation: 'DLSA pre-litigation application checklist ready.',
      ctaText: 'Explore ADR',
      ctaHref: `/cases/${caseId}/adr`,
      badgeColor: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 font-semibold',
    },
    {
      title: 'Government Legal Aid (DLSA)',
      why: 'Free advocate assignment for income categories under Section 12.',
      readiness: 'Eligibility Assessment Ready',
      preparation: 'Income proof and identity details required.',
      ctaText: 'Check Legal Aid',
      ctaHref: `/cases/${caseId}/legal-aid`,
      badgeColor: 'border-blue-500/40 bg-blue-500/10 text-blue-800 dark:text-blue-400 font-semibold',
    },
    {
      title: 'Litigation / Rent Control Court',
      why: 'Formal judicial filing before Rent Control Tribunal or Civil Court.',
      readiness: 'Requires Advocate Review',
      preparation: '9-Section Case Package required.',
      ctaText: 'Prepare Case Package',
      ctaHref: `/cases/${caseId}/case-package`,
      badgeColor: 'border-purple-500/40 bg-purple-500/10 text-purple-800 dark:text-purple-400 font-semibold',
    },
  ];

  return (
    <div className={cn('legal-card p-5 space-y-4', className)}>
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Available Resolution Pathways
          </h2>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase font-semibold">Non-Binding Options</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {pathways.map((p, i) => (
          <div key={i} className="p-4 rounded-xl border border-border/80 bg-card hover:border-border space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <Badge variant="outline" className={cn('text-[10px] uppercase px-2 py-0.5', p.badgeColor)}>
                {p.readiness}
              </Badge>
              <h3 className="text-xs font-bold text-foreground">{p.title}</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{p.why}</p>
            </div>

            <div className="pt-2 border-t border-border/50 space-y-2">
              <p className="text-[10px] text-muted-foreground">Preparation: <span className="font-semibold text-foreground">{p.preparation}</span></p>
              <Button asChild size="sm" variant="outline" className="w-full text-xs font-semibold rounded-xl">
                <Link href={p.ctaHref}>
                  <span>{p.ctaText}</span>
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
