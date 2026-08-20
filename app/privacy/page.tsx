'use client';

import * as React from 'react';
import { SiteHeader } from '@/components/nyaya/site-header';
import { SiteFooter } from '@/components/nyaya/site-footer';
import { ConsentCenter } from '@/components/nyaya/consent-center';
import { DataSharingHistory } from '@/components/nyaya/data-sharing-history';
import { GovernanceStatus } from '@/components/nyaya/governance-status';
import { PrivacyCenter } from '@/components/nyaya/privacy-center';
import { useStreamingChat } from '@/hooks/use-streaming-chat';

export default function PrivacyDashboardPage() {
  const { state } = useStreamingChat({ question: '' });
  
  // Mock data for display purposes
  const consentData = {
    message: "A request has been made to share your case summary with the Legal Aid Society.",
    purpose: "To match you with a pro bono lawyer.",
    details: "This sharing includes basic case facts, timeline, and requested relief."
  };

  const historyData = [
    { target: "District Court Portal", purpose: "Complaint filing", timestamp: new Date().toISOString(), status: "shared" },
    { target: "Third-party Marketing", purpose: "Analytics", timestamp: new Date(Date.now() - 86400000).toISOString(), status: "blocked" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 container max-w-6xl py-8 mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Privacy & Data Rights Center</h1>
          <p className="text-muted-foreground mt-2">
            Manage your data sharing preferences, view access history, and exercise your privacy rights.
          </p>
        </div>

        <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <PrivacyCenter streamState={state} />
            <ConsentCenter data={consentData} />
            <DataSharingHistory history={historyData} />
          </div>
          
          <div className="lg:col-span-1 space-y-8">
            <GovernanceStatus status={{ state: 'healthy', checksRun: 342, blockedCount: 12, consentCount: 5 }} />
            
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <h3 className="font-semibold text-lg mb-4">Your Rights</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">•</span> Right to be informed
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span> Right to access
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span> Right to withdraw consent
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span> Right to data portability
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
