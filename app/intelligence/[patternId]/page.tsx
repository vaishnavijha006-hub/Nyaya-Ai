'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Network, ShieldCheck, FileText, CheckCircle2, Scale, AlertTriangle, Users } from 'lucide-react';
import { AppShell } from '@/components/nyaya/app-shell';
import { Reveal } from '@/components/nyaya/reveal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PatternExplanation } from '@/components/nyaya/intelligence/pattern-explanation';
import { SimilarCasesPanel } from '@/components/nyaya/intelligence/similar-cases-panel';
import { PILSuitabilityCard } from '@/components/nyaya/intelligence/pil-suitability-card';
import { SystemicActionCard } from '@/components/nyaya/intelligence/systemic-action-card';

export default function PatternDetailPage() {
  const params = useParams();
  const patternId = (params?.patternId as string) || 'pat-1';

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <Reveal>
          <div className="space-y-4 border-b border-border/60 pb-6">
            <Button asChild size="sm" variant="ghost" className="h-8 text-xs font-semibold text-muted-foreground hover:text-foreground">
              <Link href="/intelligence" className="flex items-center gap-1">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Pattern Discovery
              </Link>
            </Button>

            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    Tenant / Real Estate
                  </Badge>
                  <Badge className="bg-amber-600 text-white text-[9px] uppercase font-bold">
                    Potential Systemic Issue
                  </Badge>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Repeated Security Deposit Withholding ({patternId})
                </h1>
                <p className="text-xs text-muted-foreground">
                  Anonymised pattern analysis of 42 security deposit withholding cases in Bengaluru Urban District.
                </p>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold shrink-0">
                <Users className="h-4 w-4" />
                <span>42 Similar Cases</span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Section 1: Transparent Pattern Explanation */}
        <Reveal delay={0.1}>
          <PatternExplanation />
        </Reveal>

        {/* Section 2 & 3: What Cases Have in Common vs What Makes Them Different */}
        <Reveal delay={0.2}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="legal-card p-5 space-y-3 text-xs">
              <span className="font-bold text-foreground uppercase tracking-wider text-[10px]">What Cases Have In Common:</span>
              <ul className="space-y-2 text-[11px] text-muted-foreground">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Landlord withheld full security deposit (₹30,000 to ₹1,00,000) post lease termination.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>No itemized damage invoices or repair receipts provided to tenant prior to deduction.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Tenants fulfilled 30-day statutory notice period as stipulated in rent agreement.</span>
                </li>
              </ul>
            </div>

            <div className="legal-card p-5 space-y-3 text-xs">
              <span className="font-bold text-foreground uppercase tracking-wider text-[10px]">What Makes These Cases Different:</span>
              <ul className="space-y-2 text-[11px] text-muted-foreground">
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>Varied lease durations (11 months vs 2-year registered residential leases).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>Difference in formal legal notice issuance prior to Nyaya AI intake.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>Individual landlord private ownership vs institutional property management firms.</span>
                </li>
              </ul>
            </div>
          </div>
        </Reveal>

        {/* Section 4 & 5: Common Evidence & Common Legal Issues */}
        <Reveal delay={0.3}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="legal-card p-5 space-y-3 text-xs">
              <span className="font-bold text-foreground uppercase tracking-wider text-[10px]">Common Evidence Pattern:</span>
              <div className="space-y-1.5 text-[11px]">
                <p className="flex items-center gap-1.5 text-foreground font-semibold">
                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                  Rent Agreement Contract (PDF / Image)
                </p>
                <p className="flex items-center gap-1.5 text-foreground font-semibold">
                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                  UPI / Bank Transfer Advance Security Receipt
                </p>
                <p className="flex items-center gap-1.5 text-foreground font-semibold">
                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                  WhatsApp Move-out Notice Communication Export
                </p>
              </div>
            </div>

            <div className="legal-card p-5 space-y-3 text-xs">
              <span className="font-bold text-foreground uppercase tracking-wider text-[10px]">Common Legal Issues:</span>
              <div className="space-y-1 text-[11px] text-muted-foreground">
                <p><strong className="text-foreground">Transfer of Property Act, 1882 (Sec. 108):</strong> Duty of lessor to refund deposit upon peaceful surrender.</p>
                <p><strong className="text-foreground">Consumer Protection Act, 2019:</strong> Deficiency in housing rental service rendered for consideration.</p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Section 6 & 7: Geographic Distribution & Anonymised Similar Cases */}
        <Reveal delay={0.4}>
          <SimilarCasesPanel />
        </Reveal>

        {/* Section 8 & 9 & 10: Systemic Action & PIL Suitability */}
        <Reveal delay={0.5}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SystemicActionCard />
            <PILSuitabilityCard />
          </div>
        </Reveal>

        {/* Human Review Boundaries Footer */}
        <Reveal delay={0.6}>
          <div className="p-4 rounded-xl border border-border bg-card space-y-1 text-xs text-muted-foreground">
            <span className="font-bold text-foreground uppercase text-[10px] tracking-wider">Human Legal Review Requirement:</span>
            <p className="text-[11px] leading-relaxed">
               Nyaya AI pattern detection provides preliminary cluster signals. Human advocate or Legal Services Authority review is mandatory before initiating collective notices or systemic regulatory filings.
            </p>
          </div>
        </Reveal>
      </div>
    </AppShell>
  );
}
