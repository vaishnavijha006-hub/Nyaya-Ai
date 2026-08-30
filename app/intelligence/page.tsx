'use client';

import * as React from 'react';
import { AppShell } from '@/components/nyaya/app-shell';
import { Reveal } from '@/components/nyaya/reveal';
import { IntelligencePrivacyNotice } from '@/components/nyaya/intelligence/intelligence-privacy-notice';
import { IntelligenceOverview } from '@/components/nyaya/intelligence/intelligence-overview';
import { PatternCard, PatternItem } from '@/components/nyaya/intelligence/pattern-card';
import { Network, HelpCircle, Filter } from 'lucide-react';

const MOCK_PATTERNS: PatternItem[] = [
  {
    id: 'pat-1',
    title: 'Repeated Security Deposit Withholding',
    category: 'Tenant / Real Estate',
    affectedCount: 42,
    timePeriod: 'Past 90 Days',
    jurisdiction: 'Bengaluru Urban District',
    commonIssue: 'Landlords withholding security deposits post move-out without documented repair receipts.',
    commonContributingFactor: 'Lack of mandatory pre-occupancy inspection checklists.',
    evidencePattern: 'Rent Agreements + UPI Deposit Records + WhatsApp Notices',
    status: 'POTENTIAL_SYSTEMIC_ISSUE',
    suggestedPathways: ['Pre-Litigation Settlement', 'Mediation / Lok Adalat', 'DLSA Collective Review'],
  },
  {
    id: 'pat-2',
    title: 'Delayed Builder Possession & Super Area Escalation',
    category: 'Real Estate / Consumer',
    affectedCount: 28,
    timePeriod: 'Past 180 Days',
    jurisdiction: 'RERA Karnataka / State Consumer Commission',
    commonIssue: 'Unilateral delay in apartment handover with demand for extra charges.',
    commonContributingFactor: 'Unfair contract clauses in Builder-Buyer Agreements.',
    evidencePattern: 'Allotment Letters + Payment Receipts + Construction Delay Notices',
    status: 'RECURRING_SIGNAL',
    suggestedPathways: ['RERA Regulatory Complaint', 'Consumer Commission Referral', 'Collective Notice'],
  },
  {
    id: 'pat-3',
    title: 'Unlawful Gig Worker Account Suspension',
    category: 'Labor / Commercial',
    affectedCount: 19,
    timePeriod: 'Past 60 Days',
    jurisdiction: 'Labour Commissionerate',
    commonIssue: 'Immediate platform account deactivation without notice or dispute hearing.',
    commonContributingFactor: 'Automated algorithmic rating thresholds without human review.',
    evidencePattern: 'App Screenshots + Earnings Statements + Support Ticket Logs',
    status: 'REQUIRES_HUMAN_REVIEW',
    suggestedPathways: ['Labour Officer Conciliation', 'Legal Aid Assistance'],
  },
];

export default function IntelligencePage() {
  const [selectedCategory, setSelectedCategory] = React.useState('ALL');

  const filteredPatterns = React.useMemo(() => {
    if (selectedCategory === 'ALL') return MOCK_PATTERNS;
    return MOCK_PATTERNS.filter((p) => p.category.toLowerCase().includes(selectedCategory.toLowerCase()));
  }, [selectedCategory]);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <Reveal>
          <div className="space-y-4 border-b border-border/60 pb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-400">
                <Network className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Patterns Across Cases</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Nyaya AI identifies recurring legal issues across anonymised case information to highlight problems that may benefit from systemic resolution.
                </p>
              </div>
            </div>
            <IntelligencePrivacyNotice />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Systemic Intelligence Metrics
            </h2>
            <IntelligenceOverview />
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Filter className="h-3.5 w-3.5" />
                Detected Pattern Discovery ({filteredPatterns.length})
              </h2>
              <div className="flex gap-1 text-xs">
                {['ALL', 'Tenant', 'Real Estate', 'Labor'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      selectedCategory === cat ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold border border-amber-500/30' : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatterns.map((pat) => (
                <PatternCard key={pat.id} pattern={pat} />
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </AppShell>
  );
}
