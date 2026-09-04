"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { WhatHappensNow } from '@/components/nyaya/case-dashboard/what-happens-now';
import { CaseImpactSummary } from '@/components/nyaya/case-impact-summary';
import { BeforeYouFileCard } from '@/components/nyaya/before-you-file-card';
import { FactsSection } from '@/components/nyaya/case-dashboard/facts-section';
import { ReadinessOverview } from '@/components/nyaya/case-dashboard/readiness-overview';
import { EvidenceDocumentsSection } from '@/components/nyaya/case-dashboard/evidence-documents-section';
import { DocumentPreparationSection } from '@/components/nyaya/case-dashboard/document-preparation-section';
import { LegalAnalysisSection } from '@/components/nyaya/case-dashboard/legal-analysis-section';
import { ResolutionPathwaysSection } from '@/components/nyaya/case-dashboard/resolution-pathways-section';
import { ActionPlanSection } from '@/components/nyaya/case-dashboard/action-plan-section';
import { PendencyImpactSection } from '@/components/nyaya/pendency-impact-section';
import { DelayTimelineSection } from '@/components/nyaya/case-dashboard/delay-timeline-section';
import { ActionCenter } from '@/components/nyaya/case-dashboard/action-center';
import { CaseTrustSummary } from '@/components/nyaya/trust/case-trust-summary';
import { FactConfirmationCard } from '@/components/nyaya/trust/fact-confirmation-card';
import { FactConflictPanel } from '@/components/nyaya/trust/fact-conflict-panel';
import { LegalSourceGrounding } from '@/components/nyaya/trust/legal-source-grounding';
import { RelatedPatternsSection } from '@/components/nyaya/intelligence/related-patterns-section';
import { ExplainRecommendation } from '@/components/nyaya/trust/explain-recommendation';
import { CaseAuditTimeline } from '@/components/nyaya/trust/case-audit-timeline';
import { CaseActivityTimeline } from '@/components/nyaya/case-dashboard/case-activity-timeline';
import { CaseDataControls } from '@/components/nyaya/case-data-controls';
import { useStreamingChat } from '@/hooks/use-streaming-chat';
import { FileText } from 'lucide-react';

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = (params.caseId as string) || 'case-1';

  const { state } = useStreamingChat({
    question: 'Check case updates',
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            <span>Nyaya Case Command Center</span>
          </div>
          <h1 className="text-2xl font-bold font-display text-foreground mt-0.5">
            Case Details: {caseId}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`/cases/${caseId}/case-package`}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span>Judge-Ready Case Package</span>
          </a>
        </div>
      </div>

      {/* QUESTION 5: WHAT SHOULD I DO NEXT? (Prioritized at Top) */}
      <section className="space-y-3">
        <WhatHappensNow
          stageTitle="Legal Analysis & Evidence Verification"
          stageDescription="Nyaya has extracted your dispute timeline and is auditing uploaded documents against applicable statutory remedies."
          nextStepTitle="Upload Rent Agreement & Receipts"
          nextStepRationale="Submitting your signed tenancy lease and transaction proof will allow Nyaya to complete evidence verification."
          primaryCtaText="Upload Evidence Documents"
          primaryCtaHref={`/cases/${caseId}/documents`}
        />
      </section>

      {/* Executive Case Impact Summary */}
      <section>
        <CaseImpactSummary />
      </section>

      {/* Pre-Litigation Checkpoint ("Before You File") */}
      <section>
        <BeforeYouFileCard />
      </section>

      {/* QUESTION 1: WHAT HAPPENED? (Facts & Chronology) */}
      <section>
        <FactsSection caseId={caseId} />
      </section>

      {/* QUESTION 3: WHAT EVIDENCE DO I HAVE? (Documents & Qualitative Readiness) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EvidenceDocumentsSection caseId={caseId} />
        <ReadinessOverview />
      </section>

      {/* DOCUMENT PREPARATION MATRIX */}
      <section>
        <DocumentPreparationSection />
      </section>

      {/* QUESTION 2 & 4: WHAT DOES NYAYA UNDERSTAND & WHAT LEGAL ISSUES APPLY? */}
      <section>
        <LegalAnalysisSection />
      </section>

      {/* RESOLUTION PATHWAYS ("Why This Path?" Explainability) */}
      <section>
        <ResolutionPathwaysSection caseId={caseId} />
      </section>

      {/* ACTION PLAN (WHAT • WHY • HOW) */}
      <section>
        <ActionPlanSection caseId={caseId} />
      </section>

      {/* PENDENCY REDUCTION SYSTEMIC IMPACT */}
      <section>
        <PendencyImpactSection />
      </section>

      {/* DELAY INTELLIGENCE & FACTUAL HEARINGS LOG */}
      <section>
        <DelayTimelineSection />
      </section>

      {/* TRUST, GROUNDING & PATTERNS */}
      <section className="space-y-6">
        <CaseTrustSummary />
        <FactConfirmationCard caseId={caseId} />
        <FactConflictPanel />
        <LegalSourceGrounding />
        <RelatedPatternsSection caseId={caseId} />
        <ExplainRecommendation />
        <ActionCenter caseId={caseId} />
      </section>

      {/* AUDIT TIMELINE & CONTROLS */}
      <section className="space-y-6">
        <CaseAuditTimeline />
        <CaseActivityTimeline />
        <CaseDataControls caseId={caseId} />
      </section>
    </div>
  );
}
