'use client';

import * as React from 'react';
import Link from 'next/link';
import { Scale, ArrowRight, ShieldCheck, Info } from 'lucide-react';
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
      whySuggests: [
        'Dispute appears heavily document-driven (contracts, agreements, receipts)',
        'Monetary terms or arrears may be negotiable outside court',
        'Formal court filing may not be necessary at this preliminary stage',
      ],
      readiness: 'High Readiness',
      preparation: 'Rent Agreement & Payment Receipt attached.',
      ctaText: 'Explore Settlement Terms',
      ctaHref: `/cases/${caseId}/settlement`,
      badgeColor: 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-400 font-bold',
    },
    {
      title: 'Mediation / Lok Adalat (ADR)',
      whySuggests: [
        'Parties may have an ongoing relationship (tenancy, employment, business)',
        'Resolution may be achieved quickly without prolonged court trial',
        'Binding decree obtainable under Legal Services Authorities Act',
      ],
      readiness: 'Available',
      preparation: 'DLSA pre-litigation application checklist ready.',
      ctaText: 'Explore ADR & Mediation',
      ctaHref: `/cases/${caseId}/adr`,
      badgeColor: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 font-semibold',
    },
    {
      title: 'Government Legal Aid (DLSA)',
      whySuggests: [
        'Citizen indicators suggest eligibility under Section 12 criteria',
        'Potential need for state-assisted pro-bono advocate representation',
        'Free legal advice and document assistance available',
      ],
      readiness: 'Eligibility Assessment Ready',
      preparation: 'Income proof and identity details required.',
      ctaText: 'Check Legal Aid Eligibility',
      ctaHref: `/cases/${caseId}/legal-aid`,
      badgeColor: 'border-blue-500/40 bg-blue-500/10 text-blue-800 dark:text-blue-400 font-semibold',
    },
    {
      title: 'Formal Litigation / Court Filing',
      whySuggests: [
        'Dispute may require binding formal adjudication by a tribunal or magistrate',
        'Other pre-litigation pathways may be unsuitable or exhausted',
        'Requires structured case packaging and advocate representation',
      ],
      readiness: 'Requires Advocate Review',
      preparation: '9-Section Case Package required.',
      ctaText: 'Prepare Case Package Dossier',
      ctaHref: `/cases/${caseId}/case-package`,
      badgeColor: 'border-purple-500/40 bg-purple-500/10 text-purple-800 dark:text-purple-400 font-semibold',
    },
  ];

  return (
    <div className={cn('legal-card p-5 space-y-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Resolution Pathways &amp; Explainability
          </h2>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase font-semibold border-amber-500/30 text-amber-800 dark:text-amber-400">
          Preliminary Suggestions
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {pathways.map((p, i) => (
          <div key={i} className="p-4 rounded-xl border border-border/80 bg-card hover:border-border space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={cn('text-[10px] uppercase px-2 py-0.5', p.badgeColor)}>
                  {p.readiness}
                </Badge>
              </div>

              <h3 className="text-xs font-bold text-foreground">{p.title}</h3>

              {/* Why Nyaya Suggests Exploring This */}
              <div className="rounded-lg bg-muted/50 p-2.5 space-y-1 border border-border/40">
                <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                  Why Nyaya suggests exploring this:
                </p>
                <ul className="space-y-1 text-[11px] text-muted-foreground list-disc list-inside">
                  {p.whySuggests.map((reason, rIdx) => (
                    <li key={rIdx} className="leading-snug">{reason}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-2 border-t border-border/50 space-y-2">
              <p className="text-[10px] text-muted-foreground">
                Preparation: <span className="font-semibold text-foreground">{p.preparation}</span>
              </p>
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

      <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-3 text-[11px] text-muted-foreground">
        <Info className="h-4 w-4 text-amber-500 shrink-0" />
        <span>
          <strong>Explainability Disclaimer:</strong> Nyaya AI suggests exploring these options based on your recorded facts. Nyaya does not dictate or decide your final legal route.
        </span>
      </div>
    </div>
  );
}
