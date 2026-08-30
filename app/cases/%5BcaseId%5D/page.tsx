'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/nyaya/app-shell';
import { NyayaPath } from '@/components/nyaya/nyaya-path';
import { CaseContextPanel } from '@/components/nyaya/case-context-panel';
import { CaseDashboardHeader } from '@/components/nyaya/case-dashboard/case-dashboard-header';
import { WhatHappensNow } from '@/components/nyaya/case-dashboard/what-happens-now';
import { FactsSection } from '@/components/nyaya/case-dashboard/facts-section';
import { EvidenceDocumentsSection } from '@/components/nyaya/case-dashboard/evidence-documents-section';
import { StillNeededSection } from '@/components/nyaya/case-dashboard/still-needed-section';
import { LegalAnalysisSection } from '@/components/nyaya/case-dashboard/legal-analysis-section';
import { ResolutionPathwaysSection } from '@/components/nyaya/case-dashboard/resolution-pathways-section';
import { ActionPlanSection } from '@/components/nyaya/case-dashboard/action-plan-section';
import { CasePackageSection } from '@/components/nyaya/case-dashboard/case-package-section';
import { DelayTimelineSection } from '@/components/nyaya/case-dashboard/delay-timeline-section';
import { useStreamingChat } from '@/hooks/use-streaming-chat';

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = (params.caseId as string) || 'case-1';

  // Sync state with streaming engine
  const { state } = useStreamingChat({
    question: "Check case status",
    conversationId: caseId,
  });

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8 space-y-6 bg-background">
        {/* Case Header */}
        <CaseDashboardHeader
          caseId={caseId}
          title="Rental Security Deposit Recovery"
          category="Property & Rent"
          status="ACTION_REQUIRED"
          jurisdiction="Ghaziabad, Uttar Pradesh"
          startedDate="12 Aug 2026"
          lastUpdated="14 Aug 2026"
        />

        {/* Signature NyayaPath 2.0 Stage Tracker */}
        <NyayaPath currentStepIndex={3} variant="detailed" />

        {/* 2-Column Responsive Grid (Main Content 68% / Context Rail 32%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Workspace Column (8 cols - 68%) */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Dynamic "What Happens Now?" Component */}
            <WhatHappensNow
              stageTitle="Analyzing Applicable Legal Provisions"
              stageDescription="Nyaya has extracted core tenancy dates and parties, and is evaluating protections under Section 108 of the Transfer of Property Act and UP Urban Buildings Rent Act."
              nextStepTitle="Upload Rent Agreement & Receipt Proof"
              nextStepRationale="The lease agreement will allow Nyaya to verify notice period compliance and calculate refundable security deposit obligations."
              primaryCtaText="Review & Upload Documents"
              primaryCtaHref={`/cases/${caseId}/documents`}
            />

            {/* 2. Structured Facts & Confirmed Details */}
            <FactsSection
              caseId={caseId}
              userRole="Tenant (User)"
              oppositeParty="Landlord (Rakesh Kumar)"
              jurisdiction="Ghaziabad, Uttar Pradesh"
            />

            {/* 3. Evidence & Documents Status Grid */}
            <EvidenceDocumentsSection caseId={caseId} />

            {/* 4. Information Still Needed */}
            <StillNeededSection caseId={caseId} />

            {/* 5. Preliminary Legal Analysis */}
            <LegalAnalysisSection />

            {/* 6. Possible Resolution Pathways */}
            <ResolutionPathwaysSection caseId={caseId} />

            {/* 7. Step-by-Step Action Plan */}
            <ActionPlanSection caseId={caseId} />

            {/* 8. Judge-Ready Case Package Overview */}
            <CasePackageSection caseId={caseId} />

            {/* 9. Delay Intelligence Overview */}
            <DelayTimelineSection />
          </div>

          {/* Context Rail Column (4 cols - 32%) */}
          <div className="lg:col-span-4 sticky top-20">
            <CaseContextPanel
              caseClassification={state.caseClassification}
              journeyStage={state.journeyStage || 'LEGAL_ANALYSIS'}
              documentRequest={state.documentRequest}
              documentVerified={state.documentVerified}
              legalAnalysis={state.legalAnalysis}
              caseAnalysis={state.caseAnalysis}
              actionPlan={state.actionPlan}
              className="rounded-xl border border-border/80 shadow-xs"
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
