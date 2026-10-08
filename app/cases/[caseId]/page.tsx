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
import { CourtLookupSection } from '@/components/nyaya/case-dashboard/court-lookup-section';
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
  const isEmployment = caseId === 'case-2' || caseId === 'demo-case-2' || caseId.includes('2') || caseId.toLowerCase().includes('employment');

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
            {isEmployment && <span className="bg-amber-500/20 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded text-[10px] font-extrabold">EMPLOYMENT & LABOR</span>}
          </div>
          <h1 className="text-2xl font-bold font-display text-foreground mt-0.5">
            {isEmployment ? 'Employment Contract & Salary Claim' : `Case Details: ${caseId}`}
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
          stageTitle={isEmployment ? "Reviewing Evidence & Labor Provisions (3/7)" : "Legal Analysis & Evidence Verification (4/7)"}
          stageDescription={isEmployment ? "Nyaya has extracted your employment dispute timeline and is auditing uploaded offer letters against Payment of Wages Act & Karnataka Shops Act." : "Nyaya has extracted your dispute timeline and is auditing uploaded documents against applicable statutory remedies."}
          nextStepTitle={isEmployment ? "Upload Offer Letter & Salary Bank Statements" : "Upload Rent Agreement & Receipts"}
          nextStepRationale={isEmployment ? "Submitting your employment contract and bank statements confirming zero salary credit will allow Nyaya to verify notice pay clauses." : "Submitting your signed tenancy lease and transaction proof will allow Nyaya to complete evidence verification."}
          primaryCtaText={isEmployment ? "Upload Employment Documents" : "Upload Evidence Documents"}
          primaryCtaHref={`/cases/${caseId}/documents`}
        />
      </section>

      {/* Executive Case Impact Summary */}
      <section>
        <CaseImpactSummary
          status="Active"
          stage={isEmployment ? "Reviewing Evidence & Labor Provisions" : "Legal Analysis & Evidence Verification"}
          nextAction={isEmployment ? "Upload offer letter or salary bank statement" : "Upload signed rent agreement or payment receipts"}
          possiblePaths={isEmployment ? ["Labor Conciliation", "Legal Notice", "DLSA Legal Aid"] : ["Pre-Litigation Settlement", "Mediation (ADR)", "Litigation"]}
          filingStatus={isEmployment ? "Pre-conciliation candidate (Labor Officer)" : "Not yet necessary (Pre-litigation candidate)"}
        />
      </section>

      {/* Pre-Litigation Checkpoint ("Before You File") */}
      <section>
        <BeforeYouFileCard
          disputeType={isEmployment ? "Employment & Labor Dispute" : "Property / Tenancy Dispute"}
          suggestedPathway={isEmployment ? "Labor Commissioner Conciliation & Legal Notice" : "Pre-Litigation Settlement & Mediation"}
        />
      </section>

      {/* QUESTION 1: WHAT HAPPENED? (Facts & Chronology) */}
      <section>
        <FactsSection
          caseId={caseId}
          userRole={isEmployment ? "Employee (Kavita Verma)" : "Tenant (User)"}
          oppositeParty={isEmployment ? "Employer (Apex Tech Solutions Pvt Ltd)" : "Landlord (Rakesh Kumar)"}
          jurisdiction={isEmployment ? "Bengaluru, Karnataka" : "Ghaziabad, Uttar Pradesh"}
          agreementDate={isEmployment ? "01 Mar 2024" : "12 Jan 2025"}
          noticeDate={isEmployment ? "15 Dec 2025" : "02 Jul 2026"}
          disputeDate={isEmployment ? "01 Jan 2026" : "01 Aug 2026"}
          keyFacts={isEmployment ? [
            'Employment offer letter signed on 01 Mar 2024 specifying 30-day mandatory notice pay clause.',
            'Monthly salary of ₹75,000 unpaid for October and November 2025.',
            'Termination email issued on 15 Dec 2025 with immediate effect without statutory notice pay.',
            'Employer failed to respond to informal email demands for pending wages.'
          ] : undefined}
        />
      </section>

      {/* QUESTION 3: WHAT EVIDENCE DO I HAVE? (Documents & Qualitative Readiness) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EvidenceDocumentsSection
          caseId={caseId}
          documents={isEmployment ? [
            {
              id: 'doc-1',
              name: 'Offer Letter & Employment Contract.pdf',
              type: 'Employment Contract',
              status: 'VERIFIED',
              uploadedDate: '10 Aug 2026',
              whyItMatters: 'Confirms 30-day mandatory notice pay obligation and monthly wage structure.',
              whatYouCanDo: 'Verified and locked in case dossier.',
            },
            {
              id: 'doc-2',
              name: 'Bank Statement (Oct-Nov).pdf',
              type: 'Payment Record',
              status: 'VERIFIED',
              uploadedDate: '10 Aug 2026',
              whyItMatters: 'Proves zero salary credit for 2 consecutive months.',
              whatYouCanDo: 'Verified and linked to monetary claim.',
            },
            {
              id: 'doc-3',
              name: 'Termination Email.eml',
              type: 'Notice Letter',
              status: 'NEEDS_REVIEW',
              uploadedDate: '10 Aug 2026',
              whyItMatters: 'Proves immediate termination without mandatory 30-day notice period.',
              whatYouCanDo: 'Review timestamp to confirm contract violation.',
            },
            {
              id: 'doc-4',
              name: 'Form K Wage Claim Draft',
              type: 'Labor Grievance Form',
              status: 'MISSING',
              whyItMatters: 'Establishes formal statutory claim before Labor Conciliation Officer.',
              whatYouCanDo: 'Generate wage claim draft using Nyaya Document Drafter.',
            },
          ] : undefined}
        />
        <ReadinessOverview isEmployment={isEmployment} />
      </section>

      {/* DOCUMENT PREPARATION MATRIX */}
      <section>
        <DocumentPreparationSection
          documents={isEmployment ? [
            {
              id: 'doc-1',
              name: 'Offer Letter & Employment Contract',
              whyItMatters: 'Establishes contractual relationship, 30-day notice clause, and wage structure.',
              status: 'VERIFIED',
            },
            {
              id: 'doc-2',
              name: 'Salary Bank Account Statement (Oct & Nov)',
              whyItMatters: 'Proves non-credit of ₹1,50,000 earned monthly wages.',
              status: 'VERIFIED',
            },
            {
              id: 'doc-3',
              name: '15-Day Statutory Demand Notice Draft',
              whyItMatters: 'AI-generated notice demanding salary & notice pay within 15-day window.',
              status: 'DRAFT',
            },
            {
              id: 'doc-4',
              name: 'Form K Labor Conciliation Petition',
              whyItMatters: 'Mandatory filing for Bengaluru Labor Conciliation Officer.',
              status: 'MISSING',
            },
          ] : undefined}
        />
      </section>

      {/* QUESTION 2 & 4: WHAT DOES NYAYA UNDERSTAND & WHAT LEGAL ISSUES APPLY? */}
      <section>
        <LegalAnalysisSection
          category={isEmployment ? "Employment & Wage Recovery Dispute" : undefined}
          level1Plain={isEmployment ? "In simple terms: Employers cannot terminate employees without paying earned salary or providing required notice pay unless gross misconduct is legally proven under Indian labor law." : undefined}
          level2Issues={isEmployment ? [
            "Non-payment of earned wages under Payment of Wages Act, 1936",
            "Breach of employment contract terms regarding mandatory 30-day notice pay",
            "Arbitrary termination without statutory severance pay",
          ] : undefined}
          level3WhyApply={isEmployment ? [
            "Offer letter explicitly stipulates 30-day notice pay upon termination.",
            "Bank statements confirm zero salary credit for October and November 2025.",
            "Termination email shows immediate discharge without cause or misconduct inquiry.",
          ] : undefined}
          level4Uncertainties={isEmployment ? [
            "Whether employer recorded any prior performance appraisal notes before termination.",
            "Confirmation of exact gratuity eligibility based on duration of service.",
          ] : undefined}
          level5Law={isEmployment ? [
            "Payment of Wages Act, 1936 (Section 15 — Claims arising out of deductions from wages)",
            "Industrial Disputes Act, 1947 (Section 25F — Conditions precedent to retrenchment)",
            "Karnataka Shops and Commercial Establishments Act, 1961 (Section 39 — Notice of Termination)",
          ] : undefined}
        />
      </section>

      {/* RESOLUTION PATHWAYS ("Why This Path?" Explainability) */}
      <section>
        <ResolutionPathwaysSection caseId={caseId} isEmployment={isEmployment} />
      </section>

      {/* ACTION PLAN (WHAT • WHY • HOW) */}
      <section>
        <ActionPlanSection caseId={caseId} isEmployment={isEmployment} />
      </section>

      {/* PENDENCY REDUCTION SYSTEMIC IMPACT */}
      <section>
        <PendencyImpactSection />
      </section>

      {/* DELAY INTELLIGENCE & FACTUAL HEARINGS LOG */}
      <section className="space-y-6">
        <CourtLookupSection caseId={caseId} />
        <DelayTimelineSection />
      </section>

      {/* TRUST, GROUNDING & PATTERNS */}
      <section className="space-y-6">
        <CaseTrustSummary />
        <FactConfirmationCard caseId={caseId} />
        <FactConflictPanel />
        <LegalSourceGrounding isEmployment={isEmployment} />
        <RelatedPatternsSection caseId={caseId} isEmployment={isEmployment} />
        <ExplainRecommendation
          recommendation={isEmployment ? "Labor Conciliation & Salary Demand Notice" : undefined}
          factors={isEmployment ? [
            "A documented unpaid wage claim (2 months salary + notice pay) is established.",
            "Offer letter and bank statements uploaded and verified.",
            "No prior misconduct or warning letters delivered by employer.",
            "Dispute falls within statutory conciliation framework under Payment of Wages Act."
          ] : undefined}
          evidenceUsed={isEmployment ? ["Offer Letter & Employment Contract.pdf", "Bank Statement (Oct-Nov).pdf"] : undefined}
          missingInfo={isEmployment ? ["Employer HR Advocate official correspondence address"] : undefined}
        />
        <ActionCenter caseId={caseId} isEmployment={isEmployment} />
      </section>

      {/* AUDIT TIMELINE & CONTROLS */}
      <section className="space-y-6">
        <CaseAuditTimeline />
        <CaseActivityTimeline
          events={isEmployment ? [
            {
              id: 'act-ev-1',
              type: 'AI_ANALYSIS',
              title: 'Preliminary Labor Law Analysis Completed',
              description: 'Identified applicable provisions under Payment of Wages Act & Karnataka Shops Act.',
              timestamp: 'Today, 15:30',
            },
            {
              id: 'act-ev-2',
              type: 'DOCUMENT',
              title: 'Bank Statement (Oct-Nov) Verified',
              description: 'Verified zero salary credit for 2 consecutive months.',
              timestamp: 'Yesterday, 18:20',
            },
            {
              id: 'act-ev-3',
              type: 'USER_ACTION',
              title: 'Offer Letter & Employment Contract Uploaded',
              description: 'User uploaded written employment contract.',
              timestamp: 'Yesterday, 14:10',
            },
            {
              id: 'act-ev-4',
              type: 'SYSTEM',
              title: 'Case Intake Initiated',
              description: 'Started natural language intake for Employment & Salary Claim dispute.',
              timestamp: '10 Aug 2026',
            },
          ] : undefined}
        />
        <CaseDataControls caseId={caseId} />
      </section>
    </div>
  );
}
