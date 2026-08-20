import * as React from 'react';
import { SiteHeader } from '@/components/nyaya/site-header';
import { SiteFooter } from '@/components/nyaya/site-footer';
import { HumanReviewStatus } from '@/components/nyaya/human-review-status';
import { GovernanceStatus } from '@/components/nyaya/governance-status';

export default function AdminGovernancePage() {
  const reviews = [
    { title: "High-risk Domestic Violence Case", reason: "Automated analysis flagged severe immediate danger. Lawyer review required before providing procedural advice." },
    { title: "Complex Property Dispute", reason: "Conflicting evidence provided by user. Confidence score 45% (below 80% threshold)." }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 container max-w-6xl py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Governance Center</h1>
            <p className="text-muted-foreground mt-2">
              Oversee the Legal Safety Engine, monitor automated safeguards, and resolve human-in-the-loop reviews.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-medium">System Secure</span>
          </div>
        </div>

        <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <HumanReviewStatus reviews={reviews} />
            
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="font-semibold text-lg">Recent Engine Actions</h3>
              </div>
              <div className="p-0">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
                    <tr>
                      <th className="px-6 py-3">Timestamp</th>
                      <th className="px-6 py-3">Action</th>
                      <th className="px-6 py-3">Trigger</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr className="bg-white dark:bg-black/20">
                      <td className="px-6 py-4 whitespace-nowrap">Just now</td>
                      <td className="px-6 py-4 font-medium">Blocked PII extraction</td>
                      <td className="px-6 py-4">Unverified LLM Prompt</td>
                      <td className="px-6 py-4 text-emerald-600">Success</td>
                    </tr>
                    <tr className="bg-white dark:bg-black/20">
                      <td className="px-6 py-4 whitespace-nowrap">2m ago</td>
                      <td className="px-6 py-4 font-medium">Triggered Consent Flow</td>
                      <td className="px-6 py-4">Pro-bono matching</td>
                      <td className="px-6 py-4 text-amber-600">Pending User</td>
                    </tr>
                    <tr className="bg-white dark:bg-black/20">
                      <td className="px-6 py-4 whitespace-nowrap">15m ago</td>
                      <td className="px-6 py-4 font-medium">Escalated to Review</td>
                      <td className="px-6 py-4">Low confidence legal citation</td>
                      <td className="px-6 py-4 text-destructive">Pending Lawyer</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-1 space-y-8">
            <GovernanceStatus status={{ state: 'healthy', checksRun: 1542, blockedCount: 89, consentCount: 430 }} />
            
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full justify-start text-left px-4 py-2 border rounded-md hover:bg-muted/50 transition-colors text-sm font-medium">
                  Update Consent Policies
                </button>
                <button className="w-full justify-start text-left px-4 py-2 border rounded-md hover:bg-muted/50 transition-colors text-sm font-medium">
                  Review Blocked Transactions
                </button>
                <button className="w-full justify-start text-left px-4 py-2 border rounded-md hover:bg-muted/50 transition-colors text-sm font-medium">
                  Generate Compliance Report
                </button>
                <button className="w-full justify-start text-left px-4 py-2 border rounded-md hover:bg-muted/50 transition-colors text-sm font-medium text-destructive border-destructive/20 hover:bg-destructive/10">
                  Halt All Automated Decisions
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
