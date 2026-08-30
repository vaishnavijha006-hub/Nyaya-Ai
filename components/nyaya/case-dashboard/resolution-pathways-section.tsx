'use client';

import * as React from 'react';
import Link from 'next/link';
import { Scale, Users, FileText, Gavel, ShieldCheck, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PathwayItem {
  id: string;
  title: string;
  type: 'SETTLEMENT' | 'LEGAL_AID' | 'MEDIATION' | 'COLLECTIVE' | 'LITIGATION';
  description: string;
  whyApplies: string;
  recommended?: boolean;
  ctaText: string;
  ctaHref: string;
}

interface ResolutionPathwaysSectionProps {
  caseId?: string;
  pathways?: PathwayItem[];
  className?: string;
}

const DEFAULT_PATHWAYS: PathwayItem[] = [
  {
    id: 'pw-1',
    title: 'Pre-Litigation Legal Notice & Settlement',
    type: 'SETTLEMENT',
    description: 'Issue a formal, statutory legal notice to the landlord demanding deposit refund within 15 days before court filing.',
    whyApplies: 'Core facts are documented (rent agreement & bank receipt available); settlement potential is high.',
    recommended: true,
    ctaText: 'Draft Legal Notice',
    ctaHref: '/legal-notice',
  },
  {
    id: 'pw-2',
    title: 'DLSA Legal Aid Assistance',
    type: 'LEGAL_AID',
    description: 'Apply for free legal representation under the Legal Services Authorities Act, 1987.',
    whyApplies: 'Available if annual income falls below state legal aid threshold.',
    ctaText: 'Check Eligibility',
    ctaHref: '/lawyers',
  },
  {
    id: 'pw-3',
    title: 'Lok Adalat / Pre-litigation Mediation',
    type: 'MEDIATION',
    description: 'Present dispute before a District Legal Services Authority (DLSA) mediator for rapid binding settlement.',
    whyApplies: 'Low cost, non-adversarial, and legally binding under Section 21 of LSA Act.',
    ctaText: 'Explore Mediation',
    ctaHref: '/lawyers',
  },
];

export function ResolutionPathwaysSection({
  caseId = 'case-1',
  pathways = DEFAULT_PATHWAYS,
  className,
}: ResolutionPathwaysSectionProps) {
  return (
    <div className={cn('legal-card p-5 space-y-4', className)}>
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Possible Resolution Pathways
          </h3>
        </div>

        <span className="text-[11px] text-muted-foreground font-medium">
          Choose the most suitable path
        </span>
      </div>

      <div className="space-y-3">
        {pathways.map((pw) => (
          <div
            key={pw.id}
            className={cn(
              'rounded-xl border p-4 transition-all space-y-2.5',
              pw.recommended
                ? 'border-amber-500/40 bg-amber-500/5 shadow-xs'
                : 'border-border/80 bg-card hover:border-border'
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-bold text-foreground">{pw.title}</h4>
                  {pw.recommended && (
                    <Badge className="bg-amber-500 text-slate-950 hover:bg-amber-400 text-[10px] font-bold px-2 py-0">
                      Recommended
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{pw.description}</p>
              </div>
            </div>

            <div className="text-[11px] bg-muted/40 p-2.5 rounded-lg border border-border/50 text-foreground/90 leading-relaxed">
              <strong className="font-semibold text-foreground">Why this applies: </strong>
              {pw.whyApplies}
            </div>

            <div className="pt-1 flex justify-end">
              <Button asChild size="sm" className="bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 font-semibold text-xs rounded-xl">
                <Link href={pw.ctaHref}>
                  <span>{pw.ctaText}</span>
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
