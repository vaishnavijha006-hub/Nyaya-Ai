'use client';

import * as React from 'react';
import { Search, Building2, Clock, AlertCircle, CheckCircle2, ShieldAlert, FileText, Loader2, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CourtDataPayload {
  source: string;
  source_mode: string;
  identifier: string;
  identifier_type: string;
  court: string;
  case_number: string;
  case_type: string;
  filing_date: string;
  status: string;
  next_hearing_date?: string;
  hearing_history: Array<{
    hearing_id?: string;
    hearing_date: string;
    stage: string;
    outcome: string;
    adjournment_reason?: string;
    next_hearing_date?: string;
  }>;
}

interface DelayReport {
  total_case_age: string;
  number_of_hearings: number;
  number_of_adjournments: number;
  recorded_delay: string;
  delay_trend: string;
  estimated_impact: string;
  court_grant_disclaimer: string;
}

interface CourtLookupSectionProps {
  caseId?: string;
  onLookupComplete?: (data: { courtData: CourtDataPayload; delayReport: DelayReport }) => void;
  className?: string;
}

export function CourtLookupSection({
  caseId,
  onLookupComplete,
  className,
}: CourtLookupSectionProps) {
  const [identifier, setIdentifier] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{
    courtData: CourtDataPayload;
    delayReport: DelayReport;
    sourceMode: string;
    source: string;
    disclaimer: string;
  } | null>(null);

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId) {
      setError('Please enter a 16-character CNR number or Court Case Number.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/court-data/case-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanId,
          identifier_type: 'AUTO',
          case_id: caseId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch court records.');
      }

      setResult({
        courtData: data.court_data,
        delayReport: data.delay_report,
        sourceMode: data.source_mode,
        source: data.source,
        disclaimer: data.disclaimer,
      });

      if (onLookupComplete) {
        onLookupComplete({
          courtData: data.court_data,
          delayReport: data.delay_report,
        });
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during court lookup.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('legal-card p-5 space-y-4 border border-border/80 rounded-2xl bg-card shadow-xs', className)}>
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Official eCourts / NJDG Case Record Lookup
            </h3>
            <p className="text-xs text-muted-foreground">
              Query official court registries via 16-character CNR or Case Number
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="border-indigo-500/30 text-indigo-800 dark:text-indigo-400 text-[10px] font-bold"
        >
          NJDG Data Integration
        </Badge>
      </div>

      {/* Input Form */}
      <form onSubmit={handleLookup} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
              placeholder="Enter CNR (e.g. UPGB010012342024) or Case No."
              className="w-full h-10 px-3.5 py-2 text-xs font-mono bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 uppercase placeholder:normal-case placeholder:font-sans placeholder:text-muted-foreground"
              data-testid="cnr-input"
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="h-10 px-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl flex items-center gap-2 shrink-0"
            data-testid="fetch-cnr-button"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Searching Court Portal...</span>
              </>
            ) : (
              <>
                <Search className="h-3.5 w-3.5" />
                <span>Fetch Case Record</span>
              </>
            )}
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Format: 16 alphanumeric characters (State + District + Est + Case + Year) or standard case number format.
        </p>
      </form>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="space-y-4 pt-2 border-t border-border/60" data-testid="court-lookup-result">
          {/* Source Authenticity Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-muted/40 border border-border/80">
            <div className="flex items-center gap-2">
              {result.sourceMode === 'LIVE' || result.sourceMode === 'DEMO' ? (
                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center gap-1.5 py-0.5 px-2.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Source: {result.source}</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300 font-semibold text-[11px] flex items-center gap-1.5 py-0.5 px-2.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Source: User-reported data (Official API Offline/Unconfigured)</span>
                </Badge>
              )}
            </div>

            <span className="text-[10px] font-mono text-muted-foreground">
              CNR: {result.courtData.identifier}
            </span>
          </div>

          {/* Court Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-card border border-border/80">
              <span className="text-[10px] font-bold uppercase text-muted-foreground block">Court</span>
              <span className="font-semibold text-foreground truncate block">{result.courtData.court}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-card border border-border/80">
              <span className="text-[10px] font-bold uppercase text-muted-foreground block">Case Number</span>
              <span className="font-semibold text-foreground truncate block">{result.courtData.case_number}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-card border border-border/80">
              <span className="text-[10px] font-bold uppercase text-muted-foreground block">Filing Date</span>
              <span className="font-semibold text-foreground block">{result.courtData.filing_date}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-card border border-border/80">
              <span className="text-[10px] font-bold uppercase text-muted-foreground block">Status</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400 block">{result.courtData.status}</span>
            </div>
          </div>

          {/* Integrated Delay Intelligence Metrics */}
          <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-300">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                Delay Intelligence Analysis
              </span>
              <Badge variant="outline" className="border-amber-500/30 text-amber-800 dark:text-amber-300 text-[10px]">
                {result.delayReport.delay_trend}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
              <div className="p-2 rounded-lg bg-background border border-border/60">
                <span className="text-[10px] text-muted-foreground uppercase block">Total Hearings</span>
                <span className="font-bold text-foreground">{result.delayReport.number_of_hearings}</span>
              </div>
              <div className="p-2 rounded-lg bg-background border border-border/60">
                <span className="text-[10px] text-muted-foreground uppercase block">Adjournments</span>
                <span className="font-bold text-amber-700 dark:text-amber-400">{result.delayReport.number_of_adjournments}</span>
              </div>
              <div className="p-2 rounded-lg bg-background border border-border/60">
                <span className="text-[10px] text-muted-foreground uppercase block">Recorded Delay</span>
                <span className="font-bold text-foreground">{result.delayReport.recorded_delay}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground italic pt-1 border-t border-amber-500/10">
              {result.delayReport.estimated_impact}
            </p>
          </div>

          {/* Hearing History Timeline */}
          {result.courtData.hearing_history && result.courtData.hearing_history.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Fetched Hearing History ({result.courtData.hearing_history.length} Record{result.courtData.hearing_history.length > 1 ? 's' : ''})
              </h4>
              <div className="space-y-2 text-xs">
                {result.courtData.hearing_history.map((h, idx) => (
                  <div key={h.hearing_id || idx} className="p-3 rounded-xl border border-border/80 bg-card space-y-1">
                    <div className="flex justify-between font-semibold text-foreground">
                      <span>Hearing #{idx + 1} — {h.stage}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{h.hearing_date}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground space-y-0.5">
                      <p>Outcome: <span className="font-medium text-foreground">{h.outcome}</span></p>
                      {h.adjournment_reason && (
                        <p>Adjournment Reason: <span className="italic text-slate-700 dark:text-slate-300">"{h.adjournment_reason}"</span></p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legal Disclaimer */}
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/40 text-[11px] text-muted-foreground">
            <Info className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
            <span>{result.disclaimer}</span>
          </div>
        </div>
      )}
    </div>
  );
}
