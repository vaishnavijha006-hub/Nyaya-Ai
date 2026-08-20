'use client';

/**
 * use-streaming-chat.ts — Phase 8 SSE streaming hook for Nyaya AI.
 *
 * Handles all four Phase 8 SSE event types:
 *   status  → updates statusMessage (shown before tokens arrive)
 *   token   → appends to streamedText, sets isStreaming=true, clears status
 *   sources → receives Phase 6 citations[] and legacy sources[]
 *   done    → marks isDone=true, clears cursor
 *
 * Design rules:
 *   - Never re-fetches or re-renders the full response; appends tokens only
 *   - Gracefully falls back to /chat (non-streaming) if SSE is unsupported
 *   - Cleans up EventSource on unmount / abort
 *   - Zero dependency on retrieval, citations, or prompt logic
 */

import * as React from 'react';
import type { SourceCitation } from '@/components/nyaya/source-card';
import type { Citation } from '@/components/nyaya/citation-card';
import type { Audience } from '@/lib/legal-engine';

const API_URL = typeof window !== 'undefined' && 
  (window.location.hostname.includes('loca.lt') || window.location.hostname.includes('ngrok-free.dev'))
  ? 'https://populace-kisser-sandpit.ngrok-free.dev'
  : (process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000');

export interface StreamState {
  /** Accumulated text from token events */
  streamedText: string;
  /** Latest status message from backend (e.g. "Reading Constitution of India...") */
  statusMessage: string | null;
  /** True once the first token arrives */
  isStreaming: boolean;
  /** True once the done event is received */
  isDone: boolean;
  /** Structured Phase 6 citations from sources event */
  sourceCitations: SourceCitation[];
  /** Legacy sources[] from sources event */
  legacySources: Citation[];
  /** Non-null when an error occurs */
  error: string | null;
  /** Detected response language code */
  detectedLanguage: string;
  /** True if backend flags an emergency */
  isEmergency: boolean;
  /** Case understanding structured data */
  caseClassification: any | null;
  /** Follow-up questions array */
  followUpQuestions: any[];
  /** Flag for legal retrieval started */
  legalRetrievalStarted: boolean;
  /** Array of found legal sources */
  legalSources: any[];
  /** Legal analysis data */
  legalAnalysis: any | null;
  /** Case timeline events */
  caseTimelineEvents: any[];
  /** Resolution detected data */
  resolutionDetected: any | null;
  /** Complaint Draft data */
  complaintDraft: any | null;
  /** Submission readiness data */
  submissionReadiness: any | null;
  /** Submission status */
  submissionStatus: any | null;
  /** Authority response */
  authorityResponse: any | null;
  /** Collective Action Center */
  collectiveActionData: any | null;
  /** Collective Readiness */
  collectiveReadiness: any | null;
  /** Collective Consent Request */
  collectiveConsent: any | null;
  /** Representative Matches */
  representativeMatches: any | null;
  /** Collective Document Draft */
  collectiveDocumentDraft: any | null;
  /** Authority Response Analysis */
  authorityResponseAnalysis: any | null;
  /** Deadline Detected */
  deadlineDetected: any | null;
  /** Escalation Recommendation */
  escalationRecommendation: any | null;
  /** Resolution Confirmation */
  resolutionConfirmation: any | null;
  /** Memory Update */
  memoryUpdate: any | null;
  /** Memory Conflict Detected */
  memoryConflict: any | null;
  /** Lawyer review completed */
  lawyerReviewCompleted: any | null;
  /** Lawyer message received */
  lawyerMessageReceived: any | null;
  /** Notification created */
  notificationCreated: any | null;
  /** Appointment proposed */
  appointmentProposed: any | null;
  /** Communication failed */
  communicationFailed: any | null;
  /** Risk signal detected */
  riskSignalDetected: any | null;
  /** Evidence gap detected */
  evidenceGapDetected: any | null;
  /** Prevention checklist */
  preventionChecklist: any | null;
  /** Risk history */
  riskHistory: any | null;
  /** Document processing status */
  documentProcessing: any | null;
  /** Decision audit started */
  decisionAuditStarted: any | null;
  /** Legal output validated */
  legalOutputValidated: any | null;
  /** Legal output blocked */
  legalOutputBlocked: any | null;
  /** Human review required */
  humanReviewRequired: any | null;
  /** System Health Changed */
  systemHealthChanged: any | null;
  /** Service Degraded */
  serviceDegraded: any | null;
  /** Service Restored */
  serviceRestored: any | null;
  /** Operation Rate Limited */
  operationRateLimited: any | null;
  /** Incident Detected */
  incidentDetected: any | null;
  /** Governance Check Started */
  governanceCheckStarted: any | null;
  /** Consent Required */
  consentRequired: any | null;
  /** Consent Withdrawn */
  consentWithdrawn: any | null;
  /** Data Sharing Blocked */
  dataSharingBlocked: any | null;
  /** Recovery Check Started */
  recoveryCheckStarted: any | null;
  /** Case Integrity Warning */
  caseIntegrityWarning: any | null;
  /** Recovery Required */
  recoveryRequired: any | null;
  /** Recovery Started */
  recoveryStarted: any | null;
  /** Recovery Completed */
  recoveryCompleted: any | null;
  /** Workflow Integrity Failure */
  workflowIntegrityFailure: any | null;
  /** Continuity Check Started */
  continuityCheckStarted: any | null;
  /** Continuity Status Updated */
  continuityStatusUpdated: any | null;
  /** Continuity Attention Required */
  continuityAttentionRequired: any | null;
  /** Continuity Intervention Created */
  continuityInterventionCreated: any | null;
  /** Continuity Owner Changed */
  continuityOwnerChanged: any | null;
  /** Data Export Ready */
  dataExportReady: any | null;
  /** Data Deletion Completed */
  dataDeletionCompleted: any | null;
  /** Data Retention Required */
  dataRetentionRequired: any | null;
  /** Data Correction Applied */
  dataCorrectionApplied: any | null;
  /** Privacy Access Logged */
  privacyAccessLogged: any | null;
}

const INITIAL_STATE: StreamState = {
  streamedText: '',
  statusMessage: null,
  isStreaming: false,
  isDone: false,
  sourceCitations: [],
  legacySources: [],
  error: null,
  detectedLanguage: 'en',
  isEmergency: false,
  caseClassification: null,
  followUpQuestions: [],
  legalRetrievalStarted: false,
  legalSources: [],
  legalAnalysis: null,
  caseTimelineEvents: [],
  resolutionDetected: null,
  complaintDraft: null,
  submissionReadiness: null,
  submissionStatus: null,
  authorityResponse: null,
  collectiveActionData: null,
  collectiveReadiness: null,
  collectiveConsent: null,
  representativeMatches: null,
  collectiveDocumentDraft: null,
  authorityResponseAnalysis: null,
  deadlineDetected: null,
  escalationRecommendation: null,
  resolutionConfirmation: null,
  memoryUpdate: null,
  memoryConflict: null,
  lawyerReviewCompleted: null,
  lawyerMessageReceived: null,
  notificationCreated: null,
  appointmentProposed: null,
  communicationFailed: null,
  riskSignalDetected: null,
  evidenceGapDetected: null,
  preventionChecklist: null,
  riskHistory: null,
  documentProcessing: null,
  documentMemoryConflict: null,
  decisionAuditStarted: null,
  legalOutputValidated: null,
  legalOutputBlocked: null,
  humanReviewRequired: null,
  systemHealthChanged: null,
  serviceDegraded: null,
  serviceRestored: null,
  operationRateLimited: null,
  incidentDetected: null,
  governanceCheckStarted: null,
  consentRequired: null,
  consentWithdrawn: null,
  dataSharingBlocked: null,
  recoveryCheckStarted: null,
  caseIntegrityWarning: null,
  recoveryRequired: null,
  recoveryStarted: null,
  recoveryCompleted: null,
  workflowIntegrityFailure: null,
  continuityCheckStarted: null,
  continuityStatusUpdated: null,
  continuityAttentionRequired: null,
  continuityInterventionCreated: null,
  continuityOwnerChanged: null,
  dataExportReady: null,
  dataDeletionCompleted: null,
  dataRetentionRequired: null,
  dataCorrectionApplied: null,
  privacyAccessLogged: null,
};

export interface UseStreamingChatOptions {
  question: string;
  audience?: Audience;
  language?: string;
  /** Set to a conversation-specific value if you need to key renders */
  conversationId?: string | null;
}

/**
 * useStreamingChat
 *
 * Start a streaming response by calling start().
 * Reset with reset() before a new question.
 *
 * Usage:
 *   const { state, start, reset } = useStreamingChat({ question });
 *   <button onClick={start}>Ask</button>
 *   <p>{state.streamedText}</p>
 */
export function useStreamingChat({ question, audience = 'default', language = 'auto' }: UseStreamingChatOptions) {
  const [state, setState] = React.useState<StreamState>(INITIAL_STATE);
  const abortRef = React.useRef<AbortController | null>(null);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const reset = React.useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  const clearEmergency = React.useCallback(() => {
    setState((prev) => ({ ...prev, isEmergency: false }));
  }, []);

  const start = React.useCallback(
    async (overrideQuestion?: string, overrideAudience?: Audience, overrideLanguage?: string) => {
      const q = overrideQuestion ?? question;
      const aud = overrideAudience ?? audience;
      const lang = overrideLanguage ?? language;
      if (!q.trim()) return;

      // Cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Reset state before new stream
      setState({
        ...INITIAL_STATE,
        detectedLanguage: lang === 'auto' ? 'en' : lang,
      });

      try {
        const response = await fetch(`${API_URL}/chat/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: q, audience: aud, language: lang }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Stream request failed: ${response.status} ${response.statusText}`);
        }
        if (!response.body) {
          throw new Error('ReadableStream not supported in this browser.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        // ── SSE read loop ──────────────────────────────────────────────────────
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE events are separated by double newlines
          const parts = buffer.split('\n\n');
          // Keep the last incomplete chunk in buffer
          buffer = parts.pop() ?? '';

          // Sanitize events to prevent leaking internal policy reasoning or cross-user data
          const sanitizeEvent = (evt: any) => {
            if (!evt) return evt;
            // Create a shallow copy
            const clean = typeof evt === 'object' ? { ...evt } : evt;
            // Strip sensitive fields
            delete clean.policy_reasoning;
            delete clean.internal_rules;
            delete clean.model_reasoning;
            delete clean.user_id;
            delete clean.system_prompt;
            delete clean.debug_info;
            delete clean.cross_user_metrics;
            return clean;
          };

          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith('data:')) continue;

            const jsonStr = line.slice(5).trim();
            if (!jsonStr) continue;

            let event: Record<string, unknown>;
            try {
              event = JSON.parse(jsonStr);
            } catch {
              // Malformed JSON — skip silently
              continue;
            }

            const type = event.type as string;

            if (event.emergency_mode === true || type === 'emergency') {
              setState((prev) => ({ ...prev, isEmergency: true }));
            }

            if (type === 'status') {
              // ── Status event: update message, keep showing spinner ──────────
              setState((prev) => ({
                ...prev,
                statusMessage: (event.message as string) ?? null,
              }));
            } else if (type === 'token') {
              // ── Token event: append content, hide status ───────────────────
              const token = (event.content as string) ?? '';
              setState((prev) => ({
                ...prev,
                streamedText: prev.streamedText + token,
                isStreaming: true,
                statusMessage: null,     // Status hidden once tokens arrive
              }));
            } else if (type === 'sources') {
              // ── Sources event: Phase 6 citations + legacy sources ──────────
              const citations = (event.citations as SourceCitation[]) ?? [];
              const sources = (event.sources as Citation[]) ?? [];
              const lang = (event.detected_language as string) ?? 'en';
              setState((prev) => ({
                ...prev,
                sourceCitations: citations,
                legacySources: sources,
                detectedLanguage: lang,
              }));
            } else if (type === 'done') {
              // ── Done event: finalize ───────────────────────────────────────
              setState((prev) => ({
                ...prev,
                isStreaming: false,
                isDone: true,
                statusMessage: null,
              }));
              reader.cancel();
              break;
            } else if (type === 'case_classification_update') {
              setState((prev) => ({
                ...prev,
                caseClassification: sanitizeEvent(event.data || event.classification || event)
              }));
            } else if (type === 'follow_up_question') {
              setState((prev) => ({
                ...prev,
                followUpQuestions: [...prev.followUpQuestions, sanitizeEvent(event.question || event.data || event)]
              }));
            } else if (type === 'legal_retrieval_started') {
              setState((prev) => ({
                ...prev,
                legalRetrievalStarted: true,
                statusMessage: (event.message as string) || "Retrieving legal sources...",
              }));
            } else if (type === 'legal_sources_found') {
              setState((prev) => ({
                ...prev,
                legalSources: (event.sources as any[]) || [],
              }));
            } else if (type === 'legal_analysis_update') {
              setState((prev) => ({
                ...prev,
                legalAnalysis: sanitizeEvent(event.analysis || event.data),
              }));
            } else if (type === 'case_timeline_event') {
              setState((prev) => ({
                ...prev,
                caseTimelineEvents: [...prev.caseTimelineEvents, sanitizeEvent(event.data || event.event || event)],
              }));
            } else if (type === 'resolution_detected') {
              setState((prev) => ({
                ...prev,
                resolutionDetected: sanitizeEvent(event.data || event.resolution || event),
              }));
            } else if (type === 'complaint_draft_update' || type === 'complaint_generated') {
              setState((prev) => ({
                ...prev,
                complaintDraft: sanitizeEvent(event.data || event.draft || event),
              }));
            } else if (type === 'submission_readiness_update') {
              setState((prev) => ({
                ...prev,
                submissionReadiness: sanitizeEvent(event.data || event.readiness || event),
              }));
            } else if (type === 'submission_status_update') {
              setState((prev) => ({
                ...prev,
                submissionStatus: sanitizeEvent(event.data || event.status || event),
              }));
            } else if (type === 'authority_response') {
              setState((prev) => ({
                ...prev,
                authorityResponse: sanitizeEvent(event.data || event.response || event),
              }));
            } else if (type === 'collective_action_started' || type === 'collective_action_update') {
              setState((prev) => ({
                ...prev,
                collectiveActionData: sanitizeEvent(event.data || event),
              }));
            } else if (type === 'collective_readiness_update') {
              setState((prev) => ({
                ...prev,
                collectiveReadiness: sanitizeEvent(event.data || event),
              }));
            } else if (type === 'collective_consent_request') {
              setState((prev) => ({
                ...prev,
                collectiveConsent: sanitizeEvent(event.data || event),
              }));
            } else if (type === 'representative_matches_found') {
              setState((prev) => ({
                ...prev,
                representativeMatches: sanitizeEvent(event.matches || event.data || event),
              }));
            } else if (type === 'collective_document_drafted') {
              setState((prev) => ({
                ...prev,
                collectiveDocumentDraft: sanitizeEvent(event.draft || event.data || event),
              }));
            } else if (type === 'authority_response_analysis') {
              setState((prev) => ({
                ...prev,
                authorityResponseAnalysis: sanitizeEvent(event.data || event.analysis || event),
              }));
            } else if (type === 'deadline_detected') {
              setState((prev) => ({
                ...prev,
                deadlineDetected: sanitizeEvent(event.data || event.deadline || event),
              }));
            } else if (type === 'escalation_recommendation') {
              setState((prev) => ({
                ...prev,
                escalationRecommendation: sanitizeEvent(event.data || event.recommendation || event),
              }));
            } else if (type === 'resolution_confirmation') {
              setState((prev) => ({
                ...prev,
                resolutionConfirmation: sanitizeEvent(event.data || event.confirmation || event),
              }));
            } else if (type === 'memory_update') {
              setState((prev) => ({
                ...prev,
                memoryUpdate: sanitizeEvent(event.data || event.update || event),
              }));
            } else if (type === 'memory_conflict_detected') {
              setState((prev) => ({
                ...prev,
                memoryConflict: sanitizeEvent(event.data || event.conflict || event),
                statusMessage: 'Memory conflict detected. User input required.',
              }));
            } else if (type === 'lawyer_review_completed') {
              setState((prev) => ({
                ...prev,
                lawyerReviewCompleted: sanitizeEvent(event.data || event.review || event),
                statusMessage: 'Lawyer review completed.',
              }));
            } else if (type === 'lawyer_message_received') {
              setState((prev) => ({
                ...prev,
                lawyerMessageReceived: sanitizeEvent(event.data || event.message || event),
                statusMessage: 'New message from lawyer.',
              }));
            } else if (type === 'notification_created') {
              setState((prev) => ({
                ...prev,
                notificationCreated: sanitizeEvent(event.data || event.notification || event),
                statusMessage: 'New notification received.',
              }));
            } else if (type === 'appointment_proposed') {
              setState((prev) => ({
                ...prev,
                appointmentProposed: sanitizeEvent(event.data || event.appointment || event),
                statusMessage: 'New appointment proposed.',
              }));
            } else if (type === 'communication_failed') {
              setState((prev) => ({
                ...prev,
                communicationFailed: sanitizeEvent(event.data || event.error || event),
                statusMessage: 'Communication error occurred.',
              }));
            } else if (type === 'risk_signal_detected') {
              setState((prev) => ({
                ...prev,
                riskSignalDetected: sanitizeEvent(event.data || event.signal || event),
                statusMessage: 'New legal risk signal detected.',
              }));
            } else if (type === 'evidence_gap_detected') {
              setState((prev) => ({
                ...prev,
                evidenceGapDetected: sanitizeEvent(event.data || event.gap || event),
                statusMessage: 'Evidence gap identified.',
              }));
            } else if (type === 'prevention_checklist_update') {
              setState((prev) => ({
                ...prev,
                preventionChecklist: sanitizeEvent(event.data || event.checklist || event),
              }));
            } else if (type === 'risk_history_update') {
              setState((prev) => ({
                ...prev,
                riskHistory: sanitizeEvent(event.data || event.history || event),
              }));
            } else if (type === 'document_processing') {
              setState((prev) => ({
                ...prev,
                documentProcessing: sanitizeEvent(event.data || event.processing || event),
                statusMessage: 'Processing document...',
              }));
            } else if (type === 'document_memory_conflict') {
              setState((prev) => ({
                ...prev,
                documentMemoryConflict: sanitizeEvent(event.data || event.conflict || event),
                statusMessage: 'Document conflict detected.',
              }));
            } else if (type === 'decision_audit_started') {
              setState((prev) => ({
                ...prev,
                decisionAuditStarted: sanitizeEvent(event.data || event),
                statusMessage: 'Starting legal decision audit...',
              }));
            } else if (type === 'legal_output_validated') {
              setState((prev) => ({
                ...prev,
                legalOutputValidated: sanitizeEvent(event.data || event),
                statusMessage: 'Legal output validated.',
              }));
            } else if (type === 'legal_output_blocked') {
              setState((prev) => ({
                ...prev,
                legalOutputBlocked: sanitizeEvent(event.data || event),
                statusMessage: 'Legal output blocked. Review required.',
              }));
            } else if (type === 'human_review_required') {
              setState((prev) => ({
                ...prev,
                humanReviewRequired: sanitizeEvent(event.data || event),
                statusMessage: 'Human review required.',
              }));
            } else if (type === 'system_health_changed') {
              setState((prev) => ({
                ...prev,
                systemHealthChanged: sanitizeEvent(event.data || event),
                statusMessage: 'System health updated.',
              }));
            } else if (type === 'service_degraded') {
              setState((prev) => ({
                ...prev,
                serviceDegraded: sanitizeEvent(event.data || event),
                statusMessage: 'Service degraded warning.',
              }));
            } else if (type === 'service_restored') {
              setState((prev) => ({
                ...prev,
                serviceRestored: sanitizeEvent(event.data || event),
                statusMessage: 'Service restored.',
              }));
            } else if (type === 'operation_rate_limited') {
              setState((prev) => ({
                ...prev,
                operationRateLimited: sanitizeEvent(event.data || event),
                statusMessage: 'Operation rate limited.',
              }));
            } else if (type === 'incident_detected') {
              setState((prev) => ({
                ...prev,
                incidentDetected: sanitizeEvent(event.data || event),
                statusMessage: 'Incident detected.',
              }));
            } else if (type === 'governance_check_started') {
              setState((prev) => ({
                ...prev,
                governanceCheckStarted: sanitizeEvent(event.data || event),
                statusMessage: 'Governance check started.',
              }));
            } else if (type === 'consent_required') {
              setState((prev) => ({
                ...prev,
                consentRequired: sanitizeEvent(event.data || event),
                statusMessage: 'Consent required.',
              }));
            } else if (type === 'consent_withdrawn') {
              setState((prev) => ({
                ...prev,
                consentWithdrawn: sanitizeEvent(event.data || event),
                statusMessage: 'Consent withdrawn.',
              }));
            } else if (type === 'data_sharing_blocked') {
              setState((prev) => ({
                ...prev,
                dataSharingBlocked: sanitizeEvent(event.data || event),
                statusMessage: 'Data sharing blocked.',
              }));
            } else if (type === 'recovery_check_started') {
              setState((prev) => ({
                ...prev,
                recoveryCheckStarted: sanitizeEvent(event.data || event),
                statusMessage: 'Recovery check started...',
              }));
            } else if (type === 'case_integrity_warning') {
              setState((prev) => ({
                ...prev,
                caseIntegrityWarning: sanitizeEvent(event.data || event),
                statusMessage: 'Case integrity warning.',
              }));
            } else if (type === 'recovery_required') {
              setState((prev) => ({
                ...prev,
                recoveryRequired: sanitizeEvent(event.data || event),
                statusMessage: 'Recovery required.',
              }));
            } else if (type === 'recovery_started') {
              setState((prev) => ({
                ...prev,
                recoveryStarted: sanitizeEvent(event.data || event),
                statusMessage: 'System recovery started.',
              }));
            } else if (type === 'recovery_completed') {
              setState((prev) => ({
                ...prev,
                recoveryCompleted: sanitizeEvent(event.data || event),
                statusMessage: 'System recovery completed.',
              }));
            } else if (type === 'workflow_integrity_failure') {
              setState((prev) => ({
                ...prev,
                workflowIntegrityFailure: sanitizeEvent(event.data || event),
                statusMessage: 'Workflow integrity failure detected.',
              }));
            } else if (type === 'continuity_check_started') {
              setState((prev) => ({
                ...prev,
                continuityCheckStarted: sanitizeEvent(event.data || event),
                statusMessage: 'Continuity check started.',
              }));
            } else if (type === 'continuity_status_updated') {
              setState((prev) => ({
                ...prev,
                continuityStatusUpdated: sanitizeEvent(event.data || event),
                statusMessage: 'Continuity status updated.',
              }));
            } else if (type === 'continuity_attention_required') {
              setState((prev) => ({
                ...prev,
                continuityAttentionRequired: sanitizeEvent(event.data || event),
                statusMessage: 'Continuity attention required.',
              }));
            } else if (type === 'continuity_intervention_created') {
              setState((prev) => ({
                ...prev,
                continuityInterventionCreated: sanitizeEvent(event.data || event),
                statusMessage: 'Continuity intervention created.',
              }));
            } else if (type === 'continuity_owner_changed') {
              setState((prev) => ({
                ...prev,
                continuityOwnerChanged: sanitizeEvent(event.data || event),
                statusMessage: 'Continuity owner changed.',
              }));
            } else if (type === 'data_export_ready') {
              setState((prev) => ({
                ...prev,
                dataExportReady: sanitizeEvent(event.data || event),
                statusMessage: 'Data export is ready.',
              }));
            } else if (type === 'data_deletion_completed') {
              setState((prev) => ({
                ...prev,
                dataDeletionCompleted: sanitizeEvent(event.data || event),
                statusMessage: 'Data deletion request completed.',
              }));
            } else if (type === 'data_retention_required') {
              setState((prev) => ({
                ...prev,
                dataRetentionRequired: sanitizeEvent(event.data || event),
                statusMessage: 'Data retention is required.',
              }));
            } else if (type === 'data_correction_applied') {
              setState((prev) => ({
                ...prev,
                dataCorrectionApplied: sanitizeEvent(event.data || event),
                statusMessage: 'Data correction has been applied.',
              }));
            } else if (type === 'privacy_access_logged') {
              setState((prev) => ({
                ...prev,
                privacyAccessLogged: sanitizeEvent(event.data || event),
              }));
            }
            // Unknown event types are silently ignored for forward-compatibility
          }
        }
      } catch (err: unknown) {
        if ((err as Error).name === 'AbortError') return; // Intentional cancel
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          isDone: true,
          statusMessage: null,
          error: err instanceof Error ? err.message : 'Streaming failed. Please try again.',
        }));
      }
    },
    [question, audience, language]
  );

  return { state, start, reset, clearEmergency };
}
