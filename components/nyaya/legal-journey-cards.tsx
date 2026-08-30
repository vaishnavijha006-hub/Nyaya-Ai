'use client';

/**
 * legal-journey-cards.tsx — UI components for the Legal Journey workflow stages.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle, AlertTriangle, Upload, Scale, Building2,
  User, FileText, MapPin, Phone, Globe, ChevronRight,
  Users, Gavel, Shield, AlertCircle, ClipboardList
} from 'lucide-react';

// ── Journey Stage Labels ───────────────────────────────────────────────────────
const STAGE_LABELS: Record<string, string> = {
  GATHER_DETAILS: 'Understanding Your Case',
  REQUEST_DOCUMENTS: 'Documents Required',
  VERIFY_DOCUMENTS: 'Verifying Documents',
  LEGAL_ANALYSIS: 'Legal Analysis',
  CHECK_AID_ELIGIBILITY: 'Checking Legal Aid Eligibility',
  ROUTE_AID: 'Finding Support',
  CASE_TYPE_ANALYSIS: 'Analyzing Case Type',
  ACTION_PLAN: 'Generating Action Plan',
  COMPLETE: 'Complete',
};

const STAGE_ORDER = [
  'GATHER_DETAILS', 'REQUEST_DOCUMENTS', 'VERIFY_DOCUMENTS',
  'LEGAL_ANALYSIS', 'CHECK_AID_ELIGIBILITY', 'ROUTE_AID',
  'CASE_TYPE_ANALYSIS', 'ACTION_PLAN',
];

// ── Journey Progress Bar ──────────────────────────────────────────────────────
export function JourneyProgressBar({ stage }: { stage: string | null }) {
  if (!stage) return null;
  const currentIdx = STAGE_ORDER.indexOf(stage);
  if (currentIdx === -1) return null;
  const progress = Math.round(((currentIdx + 1) / STAGE_ORDER.length) * 100);
  const label = STAGE_LABELS[stage] || stage.replace(/_/g, ' ');

  return (
    <div className="w-full mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground">Legal Journey</span>
        <span className="text-xs text-primary font-semibold">{label}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5">
        <div
          className="bg-primary h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ── Document Request Card ─────────────────────────────────────────────────────
interface Document {
  id: string;
  label: string;
  required: boolean;
  reason: string;
}

export function DocumentRequestCard({
  data,
  onUploadClick,
}: {
  data: { documents: Document[]; case_category?: string } | null;
  onUploadClick?: () => void;
}) {
  if (!data || !data.documents?.length) return null;
  const required = data.documents.filter((d) => d.required);
  const optional = data.documents.filter((d) => !d.required);

  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20 my-3">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <Upload className="w-4 h-4" />
          Documents Required
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-3">
        {required.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">Required</p>
            <div className="space-y-1">
              {required.map((doc) => (
                <div key={doc.id} className="flex items-start gap-2">
                  <FileText className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-medium">{doc.label}</span>
                    <span className="text-xs text-muted-foreground"> — {doc.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {optional.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">If available</p>
            <div className="space-y-1">
              {optional.map((doc) => (
                <div key={doc.id} className="flex items-start gap-2">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-xs text-muted-foreground">{doc.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="pt-1">
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
            onClick={onUploadClick}
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Upload Documents via PDF Upload
          </Button>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            ⚠️ AI document review does not verify authenticity. Verify with issuing authority.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Document Verification Card ────────────────────────────────────────────────
interface VerificationResult {
  filename: string;
  document_type: string;
  document_status: string;
  verification_note: string;
  contradictions: string[];
  key_facts_extracted: string[];
}

export function DocumentVerificationCard({
  data,
}: {
  data: { results: VerificationResult[]; contradictions_found: boolean } | null;
}) {
  if (!data || !data.results?.length) return null;

  const statusIcon = (status: string) => {
    if (status === 'VERIFIED_CONSISTENT') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (status === 'VERIFIED_CONTRADICTIONS') return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    if (status === 'UNREADABLE') return <AlertCircle className="w-4 h-4 text-red-500" />;
    return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      VERIFIED_CONSISTENT: 'Consistent',
      VERIFIED_CONTRADICTIONS: 'Inconsistencies Found',
      UNREADABLE: 'Unreadable',
      UNCLEAR: 'Needs Review',
    };
    return map[status] || status;
  };

  return (
    <Card className={`my-3 ${data.contradictions_found ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20' : 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'}`}>
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Document Review
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-3">
        {data.results.map((r, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center gap-2">
              {statusIcon(r.document_status)}
              <span className="text-xs font-medium">{r.filename}</span>
              <Badge variant="outline" className="text-[10px] ml-auto">{statusLabel(r.document_status)}</Badge>
            </div>
            {r.document_type && r.document_type !== 'Unknown' && (
              <p className="text-xs text-muted-foreground pl-6">Identified as: {r.document_type}</p>
            )}
            {r.verification_note && (
              <p className="text-xs text-muted-foreground pl-6">{r.verification_note}</p>
            )}
            {r.contradictions?.length > 0 && (
              <div className="pl-6">
                {r.contradictions.map((c, j) => (
                  <p key={j} className="text-xs text-amber-700 dark:text-amber-400">⚠️ {c}</p>
                ))}
              </div>
            )}
          </div>
        ))}
        <p className="text-[10px] text-muted-foreground">
          ⚠️ AI review does not confirm legal authenticity. Verify documents with the issuing authority.
        </p>
      </CardContent>
    </Card>
  );
}

// ── Legal Aid Eligible Card (DLSA) ────────────────────────────────────────────
interface DLSAInfo {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  helpline?: string;
  note?: string;
  lookup_status?: string;
}

interface EligibilityInfo {
  eligible: boolean;
  reasons: string[];
  message: string;
  next_steps: string[];
  important_note: string;
}

export function LegalAidEligibleCard({
  data,
}: {
  data: { dlsa: DLSAInfo; eligibility: EligibilityInfo } | null;
}) {
  if (!data) return null;
  const { dlsa, eligibility } = data;

  return (
    <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20 my-3">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-green-700 dark:text-green-400">
          <Shield className="w-4 h-4" />
          Government Legal Aid — You May Be Eligible
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-3">
        <p className="text-xs text-green-800 dark:text-green-300">{eligibility.message}</p>

        {eligibility.reasons?.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-1">Why you may qualify:</p>
            {eligibility.reasons.map((r, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span className="text-xs">{r}</span>
              </div>
            ))}
          </div>
        )}

        <Separator />

        {dlsa.name && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Nearest DLSA Office
            </p>
            <p className="text-xs font-medium">{dlsa.name}</p>
            {dlsa.address && (
              <p className="text-xs text-muted-foreground flex items-start gap-1">
                <MapPin className="w-3 h-3 shrink-0 mt-0.5" />{dlsa.address}
              </p>
            )}
            {dlsa.phone && (
              <p className="text-xs flex items-center gap-1">
                <Phone className="w-3 h-3" />{dlsa.phone}
              </p>
            )}
            {dlsa.helpline && (
              <p className="text-xs font-semibold flex items-center gap-1 text-green-700">
                <Phone className="w-3 h-3" />NALSA Helpline: {dlsa.helpline} (toll-free)
              </p>
            )}
            {dlsa.website && (
              <a
                href={dlsa.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs flex items-center gap-1 text-blue-600 hover:underline"
              >
                <Globe className="w-3 h-3" />{dlsa.website}
              </a>
            )}
          </div>
        )}

        {dlsa.note && (
          <p className="text-xs text-amber-700 dark:text-amber-400">ℹ️ {dlsa.note}</p>
        )}

        {eligibility.next_steps?.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-1">Next Steps:</p>
            {eligibility.next_steps.map((s, i) => (
              <div key={i} className="flex items-start gap-1.5 mb-1">
                <span className="text-xs font-bold text-green-700 shrink-0">{i + 1}.</span>
                <span className="text-xs">{s}</span>
              </div>
            ))}
          </div>
        )}

        {eligibility.important_note && (
          <p className="text-[10px] text-muted-foreground">⚠️ {eligibility.important_note}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Lawyer Suggestion Card ────────────────────────────────────────────────────
interface Lawyer {
  id?: string;
  name: string;
  specialization?: string;
  location?: string;
  experience_years?: number;
  languages?: string;
  consultation_fee?: number;
  availability?: string;
  bio?: string;
}

export function LawyerSuggestionCard({
  data,
}: {
  data: { lawyers: Lawyer[]; eligibility: EligibilityInfo } | null;
}) {
  if (!data) return null;
  const { lawyers, eligibility } = data;

  return (
    <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20 my-3">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-purple-700 dark:text-purple-400">
          <User className="w-4 h-4" />
          Lawyer Network
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-3">
        <p className="text-xs text-muted-foreground">{eligibility.message}</p>

        {lawyers.length === 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              ⚠️ No matching lawyers found in the network for your location and case type at this time.
            </p>
            <div className="space-y-1">
              <p className="text-xs font-semibold">What you can do:</p>
              <p className="text-xs">• Contact the Bar Council of your state</p>
              <p className="text-xs">• Visit <a href="https://barcouncilofindia.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">barcouncilofindia.org</a></p>
              <p className="text-xs">• Consider Lok Adalat for cost-free dispute resolution</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {lawyers.map((lawyer, i) => (
              <div key={i} className="border rounded-lg p-2.5 bg-background space-y-1.5">
                <p className="text-xs font-semibold">{lawyer.name}</p>
                {lawyer.specialization && (
                  <p className="text-xs text-muted-foreground">
                    <Scale className="w-3 h-3 inline mr-1" />{lawyer.specialization}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {lawyer.location && <Badge variant="outline" className="text-[10px]">{lawyer.location}</Badge>}
                  {lawyer.experience_years && (
                    <Badge variant="outline" className="text-[10px]">{lawyer.experience_years} yrs exp</Badge>
                  )}
                  {lawyer.consultation_fee && (
                    <Badge variant="outline" className="text-[10px]">₹{lawyer.consultation_fee}</Badge>
                  )}
                </div>
                {lawyer.bio && (
                  <p className="text-[10px] text-muted-foreground">
                    {lawyer.bio.length > 120 ? lawyer.bio.slice(0, 120) + '…' : lawyer.bio}
                  </p>
                )}
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground">
              ⚠️ Nyaya AI does not guarantee lawyer quality. Conduct your own due diligence.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Case Analysis Card ────────────────────────────────────────────────────────
interface CaseAnalysisData {
  cluster?: {
    is_cluster_candidate: boolean;
    confidence?: number;
    message?: string;
  };
  pil?: {
    is_pil_suitable: boolean;
    confidence?: number;
    message?: string;
  };
  lok_adalat?: {
    is_lok_adalat_suitable: boolean;
    confidence?: number;
    message?: string;
    benefits?: string[];
  };
}

export function CaseAnalysisCard({ data }: { data: CaseAnalysisData | null }) {
  if (!data) return null;

  const badge = (active: boolean, label: string) => (
    <Badge
      className={`text-[10px] ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
    >
      {active ? '✓' : '—'} {label}
    </Badge>
  );

  return (
    <Card className="border-slate-200 my-3">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Scale className="w-4 h-4" />
          Case Type Analysis
        </CardTitle>
        <div className="flex gap-1.5 flex-wrap mt-1">
          {badge(data.cluster?.is_cluster_candidate || false, 'Cluster Case')}
          {badge(data.pil?.is_pil_suitable || false, 'PIL')}
          {badge(data.lok_adalat?.is_lok_adalat_suitable || false, 'Lok Adalat')}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-3">
        {data.cluster && (
          <div>
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Cluster Case Filing
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{data.cluster.message}</p>
          </div>
        )}
        {data.pil && (
          <div>
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <Gavel className="w-3.5 h-3.5" /> Public Interest Litigation (PIL)
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{data.pil.message}</p>
          </div>
        )}
        {data.lok_adalat && (
          <div>
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Lok Adalat / ADR
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{data.lok_adalat.message}</p>
            {data.lok_adalat.benefits && data.lok_adalat.is_lok_adalat_suitable && (
              <div className="mt-1 flex gap-1 flex-wrap">
                {data.lok_adalat.benefits.map((b, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">{b}</Badge>
                ))}
              </div>
            )}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground">
          These assessments are preliminary and require professional legal review.
        </p>
      </CardContent>
    </Card>
  );
}

// ── Action Plan Card ──────────────────────────────────────────────────────────
interface ActionPlanData {
  case_summary?: {
    category?: string;
    sub_category?: string;
    issue?: string;
    location?: string;
    urgency?: string;
  };
  immediate_actions?: string[];
  key_documents?: string[];
  rights_summary?: string[];
  applicable_laws?: string[];
  legal_aid?: { eligible: boolean; reasons: string[] };
  recommended_next_action?: string;
  cluster?: { detected: boolean };
  pil?: { relevant: boolean };
  lok_adalat?: { suitable: boolean };
  disclaimer?: string;
}

export function ActionPlanCard({ data }: { data: ActionPlanData | null }) {
  if (!data) return null;
  const cs = data.case_summary || {};

  return (
    <Card className="border-primary/30 bg-primary/5 my-3">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary">
          <ClipboardList className="w-4 h-4" />
          Your Legal Action Plan
        </CardTitle>
        {cs.issue && (
          <p className="text-xs text-muted-foreground mt-1">{cs.category} — {cs.issue}</p>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-3">
        {data.immediate_actions && data.immediate_actions.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-red-600 mb-1">🚨 Immediate Actions</p>
            {data.immediate_actions.map((a, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <ChevronRight className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                <span className="text-xs">{a}</span>
              </div>
            ))}
          </div>
        )}

        {data.rights_summary && data.rights_summary.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-1">⚖️ Your Rights</p>
            {data.rights_summary.map((r, i) => (
              <p key={i} className="text-xs text-muted-foreground">• {r}</p>
            ))}
          </div>
        )}

        {data.applicable_laws && data.applicable_laws.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-1">📚 Applicable Laws</p>
            {data.applicable_laws.map((l, i) => (
              <p key={i} className="text-xs text-muted-foreground">• {l}</p>
            ))}
          </div>
        )}

        <Separator />

        {data.legal_aid && (
          <div>
            <p className="text-xs font-semibold mb-1">🏛️ Legal Aid</p>
            <p className={`text-xs font-medium ${data.legal_aid.eligible ? 'text-green-700' : 'text-muted-foreground'}`}>
              {data.legal_aid.eligible ? '✅ Potentially eligible for government legal aid' : '❌ Not eligible based on information provided'}
            </p>
          </div>
        )}

        {data.recommended_next_action && (
          <div className="bg-background border rounded-lg p-2.5">
            <p className="text-xs font-semibold mb-1">✅ Recommended Next Action</p>
            <p className="text-xs">{data.recommended_next_action}</p>
          </div>
        )}

        <div className="flex gap-1.5 flex-wrap">
          <Badge variant={data.cluster?.detected ? 'default' : 'outline'} className="text-[10px]">
            {data.cluster?.detected ? '✓' : '—'} Cluster Case
          </Badge>
          <Badge variant={data.pil?.relevant ? 'default' : 'outline'} className="text-[10px]">
            {data.pil?.relevant ? '✓' : '—'} PIL
          </Badge>
          <Badge variant={data.lok_adalat?.suitable ? 'default' : 'outline'} className="text-[10px]">
            {data.lok_adalat?.suitable ? '✓' : '—'} Lok Adalat
          </Badge>
        </div>

        {data.disclaimer && (
          <p className="text-[10px] text-muted-foreground border-t pt-2">{data.disclaimer}</p>
        )}
      </CardContent>
    </Card>
  );
}
