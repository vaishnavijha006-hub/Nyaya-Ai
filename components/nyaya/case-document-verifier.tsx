'use client';

import * as React from 'react';
import { 
  FileCheck2, 
  UploadCloud, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  FileText, 
  ShieldCheck, 
  HelpCircle,
  ArrowRight,
  Scale
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface VerificationFactCheck {
  parameter: string;
  document_value: string;
  reported_value: string;
  matches: boolean;
  note?: string;
}

export interface VerificationStatutoryCheck {
  rule: string;
  status: 'PASSED' | 'FAILED' | 'WARNING';
  finding: string;
}

export interface VerificationResult {
  document_type: string;
  verification_status: 'VERIFIED_VALID' | 'DISCREPANCY_DETECTED' | 'LEGAL_DEFECT_FOUND';
  confidence_score: number;
  extracted_metadata: {
    parties?: string[];
    document_date?: string;
    monetary_amount?: string;
    key_clauses_or_details?: string[];
  };
  fact_checks?: VerificationFactCheck[];
  statutory_checks?: VerificationStatutoryCheck[];
  discrepancies?: string[];
  summary: string;
  recommendations?: string[];
}

interface CaseDocumentVerifierProps {
  caseInfo?: Record<string, any>;
  onVerificationComplete?: (result: VerificationResult) => void;
  className?: string;
}

export function CaseDocumentVerifier({ caseInfo, onVerificationComplete, className = '' }: CaseDocumentVerifierProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [verifying, setVerifying] = React.useState(false);
  const [result, setResult] = React.useState<VerificationResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const runVerification = async () => {
    if (!file) {
      toast.error('Please select a case document to verify');
      return;
    }

    setVerifying(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    if (caseInfo) {
      formData.append('case_info_json', JSON.stringify(caseInfo));
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${apiUrl}/cases/verify-document`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Verification service failed');
      }

      const data = await res.json();
      if (data.success && data.verification) {
        setResult(data.verification);
        toast.success('Document verification complete');
        onVerificationComplete?.(data.verification);
      } else {
        throw new Error('Invalid verification response');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to verify document');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Case Document Verifier
        </CardTitle>
        <CardDescription>
          Upload your legal document (FIR, Lease, Cheque Dishonour Memo, Notice) to cross-verify facts and statutory compliance under Indian law.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Zone */}
        <div className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors">
          <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm font-medium">Drag & drop or select your case document</p>
          <p className="text-xs text-muted-foreground mt-1">Supports PDF, PNG, JPG (Max 20MB)</p>
          
          <input
            type="file"
            id="case-doc-upload"
            accept=".pdf,.png,.jpg,.jpeg,.tiff"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex items-center gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('case-doc-upload')?.click()}
            >
              Select File
            </Button>
            {file && (
              <span className="text-xs font-semibold text-primary flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {file.name}
              </span>
            )}
          </div>

          {file && (
            <Button
              onClick={runVerification}
              disabled={verifying}
              className="mt-4 gap-2 rounded-xl"
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying Document...
                </>
              ) : (
                <>
                  <FileCheck2 className="h-4 w-4" />
                  Run Case Verification
                </>
              )}
            </Button>
          )}
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-5 pt-2">
            {/* Status Header Banner */}
            <div className="flex items-center justify-between p-4 rounded-xl border bg-card shadow-sm">
              <div className="flex items-center gap-3">
                {result.verification_status === 'VERIFIED_VALID' && (
                  <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                )}
                {result.verification_status === 'DISCREPANCY_DETECTED' && (
                  <div className="p-2.5 rounded-full bg-amber-500/10 text-amber-600">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                )}
                {result.verification_status === 'LEGAL_DEFECT_FOUND' && (
                  <div className="p-2.5 rounded-full bg-rose-500/10 text-rose-600">
                    <XCircle className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base">
                      {result.document_type.replace(/_/g, ' ')}
                    </h3>
                    <Badge
                      variant="outline"
                      className={
                        result.verification_status === 'VERIFIED_VALID'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : result.verification_status === 'DISCREPANCY_DETECTED'
                          ? 'bg-amber-50 text-amber-700 border-amber-300'
                          : 'bg-rose-50 text-rose-700 border-rose-300'
                      }
                    >
                      {result.verification_status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Confidence: {(result.confidence_score * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Executive Verification Summary</h4>
              <p className="text-sm text-foreground/90">{result.summary}</p>
            </div>

            {/* Extracted Metadata Grid */}
            {result.extracted_metadata && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border bg-card">
                  <span className="text-xs text-muted-foreground font-medium">Parties Mentioned</span>
                  <p className="text-sm font-semibold mt-1">
                    {result.extracted_metadata.parties?.join(', ') || 'N/A'}
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <span className="text-xs text-muted-foreground font-medium">Document Date</span>
                  <p className="text-sm font-semibold mt-1">
                    {result.extracted_metadata.document_date || 'N/A'}
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <span className="text-xs text-muted-foreground font-medium">Monetary Value</span>
                  <p className="text-sm font-semibold mt-1">
                    {result.extracted_metadata.monetary_amount || 'N/A'}
                  </p>
                </div>
              </div>
            )}

            {/* Fact Checks Table */}
            {result.fact_checks && result.fact_checks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Case Fact Cross-Verification
                </h4>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="p-2.5 font-medium">Parameter</th>
                        <th className="p-2.5 font-medium">In Document</th>
                        <th className="p-2.5 font-medium">Reported Case State</th>
                        <th className="p-2.5 font-medium">Match</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {result.fact_checks.map((fc, i) => (
                        <tr key={i} className="hover:bg-muted/20">
                          <td className="p-2.5 font-medium">{fc.parameter}</td>
                          <td className="p-2.5 text-muted-foreground">{fc.document_value}</td>
                          <td className="p-2.5 text-muted-foreground">{fc.reported_value}</td>
                          <td className="p-2.5">
                            {fc.matches ? (
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                Match
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                                Mismatch
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Statutory Compliance List */}
            {result.statutory_checks && result.statutory_checks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Scale className="h-3.5 w-3.5" />
                  Statutory Rule Compliance
                </h4>
                <div className="space-y-2">
                  {result.statutory_checks.map((sc, i) => (
                    <div key={i} className="p-3 rounded-lg border flex items-start justify-between bg-card text-xs">
                      <div>
                        <span className="font-semibold text-foreground">{sc.rule}</span>
                        <p className="text-muted-foreground mt-0.5">{sc.finding}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          sc.status === 'PASSED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : sc.status === 'WARNING'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }
                      >
                        {sc.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Red Flags / Discrepancies Alert Box */}
            {result.discrepancies && result.discrepancies.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
                <h4 className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  Flagged Discrepancies & Risks
                </h4>
                <ul className="list-disc pl-4 space-y-1">
                  {result.discrepancies.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
                <h4 className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <ArrowRight className="h-4 w-4" />
                  Recommended Actions
                </h4>
                <ul className="space-y-1 text-emerald-900 dark:text-emerald-200">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
