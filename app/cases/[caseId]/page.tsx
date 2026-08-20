"use client";

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CaseProgress } from '@/components/nyaya/case-progress';
import { CaseTimeline } from '@/components/nyaya/case-timeline';
import { CaseTasks } from '@/components/nyaya/case-tasks';
import { ResolutionCard } from '@/components/nyaya/resolution-card';
import { CaseUpdate } from '@/components/nyaya/case-update';
import { ResponseSummary } from '@/components/nyaya/response-summary';
import { DeadlineCard } from '@/components/nyaya/deadline-card';
import { EscalationCard } from '@/components/nyaya/escalation-card';
import { ResolutionConfirmation } from '@/components/nyaya/resolution-confirmation';
import { CaseMemory } from '@/components/nyaya/case-memory';
import { PreventionCenter } from '@/components/nyaya/prevention-center';
import { CaseContinuity } from '@/components/nyaya/case-continuity';
import { CaseDataControls } from '@/components/nyaya/case-data-controls';
import { useStreamingChat } from '@/hooks/use-streaming-chat';
import { Play } from 'lucide-react';

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = params.caseId as string;
  
  const { state, start } = useStreamingChat({
    question: "Check case updates",
  });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Case Details: {caseId}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Manage and track your case progress</p>
        </div>
        <div className="flex items-center gap-4">
          <a 
            href={`/cases/${caseId}/documents`}
            className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-md font-medium transition-colors border"
          >
            Evidence Hub
          </a>
          <button 
            onClick={() => start()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            <Play className="h-4 w-4" />
            {state.isStreaming ? 'Checking...' : 'Check for Updates'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Real-time Engine Updates */}
          {(state.authorityResponseAnalysis || state.deadlineDetected || state.escalationRecommendation || state.resolutionConfirmation) && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                </span>
                Live Intelligence
              </h2>
              
              {state.resolutionConfirmation && <ResolutionConfirmation confirmation={state.resolutionConfirmation} />}
              {state.escalationRecommendation && <EscalationCard escalation={state.escalationRecommendation} />}
              {state.deadlineDetected && <DeadlineCard deadline={state.deadlineDetected} />}
              {state.authorityResponseAnalysis && <ResponseSummary response={state.authorityResponseAnalysis} />}
            </section>
          )}

          {(state.riskSignalDetected || state.evidenceGapDetected || state.preventionChecklist || state.riskHistory) && (
            <section className="mt-8">
              <PreventionCenter 
                riskSignals={state.riskSignalDetected ? [state.riskSignalDetected] : []}
                evidenceGaps={state.evidenceGapDetected ? [state.evidenceGapDetected] : []}
                checklist={state.preventionChecklist}
                history={state.riskHistory}
              />
            </section>
          )}
          
          <section>
            <CaseMemory 
              conflicts={state.memoryConflict ? [state.memoryConflict] : undefined} 
            />
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Timeline</h2>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <CaseTimeline events={state.caseTimelineEvents?.length > 0 ? state.caseTimelineEvents : [
                { id: '1', title: 'Case Opened', description: 'Initial consultation and case opening.', date: new Date(Date.now() - 86400000 * 3), status: 'completed' },
                { id: '2', title: 'Document Review', description: 'Reviewing uploaded documents.', date: new Date(Date.now() - 86400000), status: 'in-progress' }
              ]} />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Recent Updates</h2>
            <CaseUpdate title="Documents received" message="All required documents for the property dispute have been received and verified." date={new Date()} />
          </section>

          <CaseDataControls caseId={caseId} />
        </div>

        <div className="space-y-8">
          <section>
            <CaseContinuity 
              status={state.continuityStatusUpdated?.status || 'Active'}
              attentionRequired={!!state.continuityAttentionRequired}
              owner={state.continuityOwnerChanged?.owner || 'System'}
            />
          </section>
          
          <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Overall Progress</h2>
            <CaseProgress progress={state.authorityResponseAnalysis ? 75 : 45} status={state.resolutionConfirmation ? "Resolved" : "In Progress"} />
          </section>

          <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Tasks</h2>
            <CaseTasks tasks={[
              { id: 't1', title: 'Upload ID Proof', completed: true },
              { id: 't2', title: 'Sign retainer agreement', completed: false },
              { id: 't3', title: 'Schedule hearing', completed: false },
            ]} />
          </section>
          
          <section>
             <ResolutionCard resolution={{
               summary: "Based on the provided documents, there is a high likelihood of resolving this out of court through mediation.",
               suggestedActions: ["Draft settlement proposal", "Schedule mediation session"],
               confidence: 0.85
             }} />
          </section>
        </div>
      </div>
    </div>
  );
}
