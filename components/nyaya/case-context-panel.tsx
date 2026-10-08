'use client';

import * as React from 'react';
import {
  FileText, CheckCircle2, AlertCircle, HelpCircle, FileCheck, Shield,
  ArrowRight, Sparkles, Scale, X, Layers, Users
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NyayaPath } from '@/components/nyaya/nyaya-path';
import { cn } from '@/lib/utils';

interface CaseContextPanelProps {
  caseClassification?: any;
  journeyStage?: string | null;
  documentRequest?: any;
  documentVerified?: any;
  legalAnalysis?: any;
  caseAnalysis?: any;
  actionPlan?: any;
  className?: string;
  onCloseMobile?: () => void;
}

import { getCanonicalCaseState, CanonicalCaseState } from '@/lib/case-state-manager';

export function CaseContextPanel({
  caseClassification,
  journeyStage,
  documentRequest,
  documentVerified,
  legalAnalysis,
  caseAnalysis,
  actionPlan,
  className,
  onCloseMobile,
}: CaseContextPanelProps) {
  const [canonicalState, setCanonicalState] = React.useState<CanonicalCaseState>(() => getCanonicalCaseState('case-1'));

  React.useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) setCanonicalState(e.detail);
    };
    window.addEventListener('nyaya:case_updated', handleUpdate);
    return () => window.removeEventListener('nyaya:case_updated', handleUpdate);
  }, []);

  // Map backend journey stage string to 0-6 index for NyayaPath
  const currentStepIndex = React.useMemo(() => {
    const stage = journeyStage || (caseClassification ? 'FACTS' : null);
    if (!stage) return 1; // Default to Facts (Gathering Facts 2/7) during intake
    switch (stage.toUpperCase()) {
      case 'PROBLEM':
      case 'GATHER_DETAILS':
        return 0;
      case 'FACTS':
      case 'REQUEST_DOCUMENTS':
      case 'VERIFY_DOCUMENTS':
        return 1;
      case 'EVIDENCE':
        return 2;
      case 'LEGAL_ANALYSIS':
      case 'ANALYSIS':
        return 3;
      case 'RESOLUTION PATH':
      case 'PATHWAY':
      case 'CHECK_AID_ELIGIBILITY':
      case 'ROUTE_AID':
        return 4;
      case 'ACTION':
      case 'ACTION_PLAN':
        return 5;
      case 'RESOLUTION':
      case 'COMPLETE':
        return 6;
      default:
        return 1;
    }
  }, [journeyStage, caseClassification]);

  // Extract structured facts safely
  const caseType = caseClassification?.category || caseClassification?.case_type || 'Legal Inquiry';
  const incidentDate = caseClassification?.date || caseClassification?.incident_date || null;
  const location = caseClassification?.location || null;
  const opponent = caseClassification?.opposite_party || caseClassification?.landlord || caseClassification?.employer || null;
  const statements = caseClassification?.statements || [];
  const missingInfo = caseClassification?.missing_info || caseClassification?.missing_facts || [];
  const requiredDocs = documentRequest?.required_documents || documentRequest?.documents || [];

  const hasActiveCase = !!(journeyStage || caseClassification || (legalAnalysis && Object.keys(legalAnalysis).length > 0));

  return (
    <aside className={cn('flex h-full flex-col bg-card border-l border-border/80', className)}>
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-border/60 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Scale className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Case Context</h3>
            <p className="text-[11px] text-muted-foreground">Structured Case Memory</p>
          </div>
        </div>
        {onCloseMobile && (
          <Button size="icon" variant="ghost" onClick={onCloseMobile} className="h-7 w-7 lg:hidden">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {!hasActiveCase ? (
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground space-y-3">
          <Scale className="h-10 w-10 text-muted-foreground/30" />
          <p className="font-semibold text-foreground">No Active Case Intake</p>
          <p className="max-w-xs leading-relaxed">
            Describe a personal legal issue to initialize structured case context, evidence collection, and legal pathway routing.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar">
        <div className="legal-card p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Case Type</span>
            <Badge variant="outline" className="border-amber-500/30 text-amber-800 dark:text-amber-400 text-[10px] px-2 py-0.5">
              {caseType}
            </Badge>
          </div>
          <div className="text-xs font-medium text-foreground">
            Stage: <span className="font-semibold text-amber-700 dark:text-amber-400">{journeyStage || 'Initial Intake'}</span>
          </div>
        </div>

        {/* Confirmed Facts (KNOWN) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" />
              Facts Captured
            </h4>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Added to Case
            </span>
          </div>

          <div className="rounded-xl border border-border/80 bg-muted/30 p-3 space-y-2.5 text-xs">
            {incidentDate && (
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Incident Date:</span>
                <span className="font-medium text-foreground text-right">{incidentDate}</span>
              </div>
            )}
            {opponent && (
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Other Party:</span>
                <span className="font-medium text-foreground text-right">{opponent}</span>
              </div>
            )}
            {location && (
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Jurisdiction / City:</span>
                <span className="font-medium text-foreground text-right">{location}</span>
              </div>
            )}
            {statements.length > 0 ? (
              <div className="space-y-1 pt-1 border-t border-border/50">
                <span className="text-[11px] font-semibold text-muted-foreground">Key Details:</span>
                <ul className="space-y-1 pl-1">
                  {statements.slice(0, 4).map((stmt: string, idx: number) => (
                    <li key={idx} className="text-[11px] text-foreground/90 flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{stmt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : !incidentDate && !opponent && !location ? (
              <p className="text-[11px] text-muted-foreground italic">
                Describe what happened to extract key dates, parties, and facts.
              </p>
            ) : null}
          </div>
        </div>

        {/* Still Needed (MISSING) */}
        {missingInfo.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500" />
              Information Still Needed
            </h4>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs space-y-1.5">
              {missingInfo.map((info: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 text-amber-900 dark:text-amber-300">
                  <span className="text-amber-500 font-bold">•</span>
                  <span className="text-[11px]">{info}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileCheck className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
              Documents
            </h4>
          </div>
          <div className="rounded-xl border border-border/80 bg-card p-3 space-y-2 text-xs">
            {requiredDocs.length > 0 ? (
              requiredDocs.map((doc: any, idx: number) => {
                const docName = typeof doc === 'string' ? doc : doc.name || doc.title;
                const isUploaded = doc.uploaded || false;
                return (
                  <div key={idx} className="flex items-center justify-between text-[11px]">
                    <span className="truncate max-w-[170px]">{docName}</span>
                    <Badge variant={isUploaded ? 'default' : 'outline'} className="text-[10px] px-1.5 py-0">
                      {isUploaded ? '✓ Uploaded' : '⚠ Needed'}
                    </Badge>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Rent Agreement / Proof</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                  Optional
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Initial AI Assessment & Recommended Next Step */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            Initial AI Assessment
          </h4>
          <div className="rounded-xl border border-border/80 bg-card p-3 space-y-2 text-xs">
            <div className="text-[11px] leading-relaxed text-foreground/90">
              {legalAnalysis?.summary || actionPlan?.summary || (
                <span>Initial factual understanding underway. Response based on provided details.</span>
              )}
            </div>
            {caseAnalysis?.cluster_detected && (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400 pt-1 border-t border-border/50">
                <Users className="h-3.5 w-3.5" />
                <span>Pattern detected across similar disputes</span>
              </div>
            )}
          </div>
        </div>

        {/* Trust Note */}
        <div className="pt-2 border-t border-border/60 text-[10px] text-muted-foreground/80 leading-relaxed text-center">
          Initial AI assessment for guidance only. Does not constitute formal legal advice.
        </div>
      </div>
      )}
    </aside>
  );
}
