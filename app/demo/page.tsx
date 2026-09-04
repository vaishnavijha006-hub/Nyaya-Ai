'use client';

import * as React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck, Scale, FileText, CheckCircle2, AlertTriangle, Layers, Info, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DemoCaseStore, type DemoCaseData } from '@/lib/demo-data';
import { SiteHeader } from '@/components/nyaya/site-header';
import { SiteFooter } from '@/components/nyaya/site-footer';
import { NyayaPath } from '@/components/nyaya/nyaya-path';

export default function DemoPage() {
  const demoCases = DemoCaseStore.getDemoCases();
  const [selectedCaseId, setSelectedCaseId] = React.useState<string>(demoCases[0].id);
  const [activeStepIndex, setActiveStepIndex] = React.useState<number>(4);

  const activeCase = demoCases.find((c) => c.id === selectedCaseId) || demoCases[0];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="flex-1 pt-20 pb-16">
        {/* Prominent Demo Mode Banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 py-3 px-4 text-center">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold">
              <Badge className="bg-amber-500 text-slate-950 font-bold text-[10px]">
                DEMO / SAMPLE CASE MODE
              </Badge>
              <span>Hackathon &amp; Evaluator Experience — Illustrative Data Only</span>
            </div>
            <span className="text-muted-foreground text-[11px]">
              No real personal data entered or stored. Isolated session environment.
            </span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
          {/* Header & Case Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm" className="h-7 text-xs px-2 text-muted-foreground">
                  <Link href="/">
                    <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                    Exit Demo
                  </Link>
                </Button>
                <Badge variant="outline" className="border-amber-500/30 text-amber-800 dark:text-amber-400 text-xs">
                  Interactive Journey Walkthrough
                </Badge>
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground mt-1">
                Nyaya AI Demo Experience
              </h1>
            </div>

            {/* Select Demo Scenario */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Select Scenario:</span>
              <div className="flex gap-1.5">
                {demoCases.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCaseId(c.id);
                      setActiveStepIndex(4);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      c.id === selectedCaseId
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                        : 'bg-card text-muted-foreground border-border hover:bg-muted'
                    }`}
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive NyayaPath Progress Stepper */}
          <div className="legal-card p-5 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-foreground uppercase tracking-wider">
                Guided Legal Resolution Journey
              </span>
              <span className="text-amber-800 dark:text-amber-400 font-semibold">
                Step {activeStepIndex + 1} of 7 — {
                  ['Problem Intake', 'Fact Extraction', 'Evidence Audit', 'Legal Analysis', 'Resolution Path', 'Action Plan', 'Case Package'][activeStepIndex]
                }
              </span>
            </div>

            <NyayaPath currentStepIndex={activeStepIndex} />

            <div className="flex justify-center gap-2 pt-2">
              {[0, 1, 2, 3, 4, 5, 6].map((stepIdx) => (
                <button
                  key={stepIdx}
                  onClick={() => setActiveStepIndex(stepIdx)}
                  className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors ${
                    stepIdx === activeStepIndex
                      ? 'bg-slate-900 text-slate-50 dark:bg-amber-500 dark:text-slate-950 font-bold'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {stepIdx + 1}. {['Intake', 'Facts', 'Evidence', 'Analysis', 'Pathways', 'Action', 'Package'][stepIdx]}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Content based on active step */}
          <div className="space-y-6">
            {/* Step 0: Intake */}
            {activeStepIndex === 0 && (
              <div className="legal-card p-6 space-y-4">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-sm">
                  <Sparkles className="h-4 w-4" />
                  <span>STEP 1 — Problem Intake &amp; Story Description</span>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2 text-xs">
                  <span className="font-bold text-foreground">Citizen's Statement:</span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
                    "{activeCase.problemDescription}"
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Nyaya AI parses everyday statements in Indian regional languages or voice recordings without requiring legal terminology.
                </p>
              </div>
            )}

            {/* Step 1: Facts */}
            {activeStepIndex === 1 && (
              <div className="legal-card p-6 space-y-4">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>STEP 2 — Extracted Facts &amp; Chronology</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-muted/40 p-3 rounded-lg border border-border">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">Complainant</span>
                    <p className="font-semibold text-foreground">{activeCase.complainant}</p>
                  </div>
                  <div className="bg-muted/40 p-3 rounded-lg border border-border">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">Respondent</span>
                    <p className="font-semibold text-foreground">{activeCase.respondent}</p>
                  </div>
                  <div className="bg-muted/40 p-3 rounded-lg border border-border">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">Jurisdiction</span>
                    <p className="font-semibold text-foreground">{activeCase.jurisdiction}</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs">
                  <span className="font-bold text-foreground">Extracted Fact Chronology:</span>
                  <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                    {activeCase.keyFacts.map((fact, idx) => (
                      <li key={idx}>{fact}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Step 2: Evidence */}
            {activeStepIndex === 2 && (
              <div className="legal-card p-6 space-y-4">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                  <FileText className="h-4 w-4" />
                  <span>STEP 3 — Evidence Audit &amp; Document Verification</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {activeCase.documents.map((doc, idx) => (
                    <div key={idx} className="rounded-xl border border-border p-3.5 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-foreground">{doc.name}</span>
                        <Badge variant="outline" className="text-[10px] font-semibold">
                          {doc.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{doc.type}</p>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 bg-muted/30 p-2 rounded">
                        <strong>Why needed:</strong> {doc.why}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Legal Analysis */}
            {activeStepIndex === 3 && (
              <div className="legal-card p-6 space-y-4">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-sm">
                  <Scale className="h-4 w-4" />
                  <span>STEP 4 — Layered Legal Analysis</span>
                </div>
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-950 dark:text-amber-200 leading-relaxed font-medium">
                  {activeCase.plainExplanation}
                </div>
                <div className="space-y-1.5 text-xs">
                  <span className="font-bold text-foreground">Applicable Acts &amp; Provisions:</span>
                  <div className="space-y-1">
                    {activeCase.applicableLaw.map((law, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{law}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Resolution Path */}
            {activeStepIndex === 4 && (
              <div className="legal-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-sm">
                    <Scale className="h-4 w-4" />
                    <span>STEP 5 — Resolution Pathway Recommendation</span>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 font-bold text-xs">
                    Recommended Pathway
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-foreground">{activeCase.suggestedPathway}</h3>
                <div className="rounded-xl bg-muted/40 p-3.5 space-y-1.5 border border-border text-xs">
                  <span className="font-bold text-amber-800 dark:text-amber-400 uppercase text-[10px]">Why Nyaya suggests exploring this:</span>
                  <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                    {activeCase.pathwayReasoning.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Step 5: Action Plan */}
            {activeStepIndex === 5 && (
              <div className="legal-card p-6 space-y-4">
                <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>STEP 6 — Custom Action Plan (WHAT • WHY • HOW)</span>
                </div>
                <div className="space-y-3 text-xs">
                  {activeCase.actions.map((act, idx) => (
                    <div key={idx} className="rounded-xl border border-border p-3.5 space-y-1">
                      <div className="flex justify-between font-bold text-foreground">
                        <span>WHAT: {act.what}</span>
                        <Badge variant="outline" className="text-[10px]">{act.status}</Badge>
                      </div>
                      <p className="text-muted-foreground"><strong>WHY:</strong> {act.why}</p>
                      <p className="text-muted-foreground"><strong>HOW:</strong> {act.how}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 6: Case Package */}
            {activeStepIndex === 6 && (
              <div className="legal-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                    <FileText className="h-4 w-4 text-amber-600" />
                    <span>STEP 7 — Judge-Ready Case Package Dossier</span>
                  </div>
                  <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-400 font-bold text-xs">
                    9-Section Structured Package
                  </Badge>
                </div>
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-slate-800 dark:text-slate-200">
                  <ShieldCheck className="h-4 w-4 text-amber-600 inline mr-1.5" />
                  <span>This package organizes your facts and evidence matrix. Requires advocate review before filing or formal court reliance.</span>
                </div>
                <div className="flex gap-3">
                  <Button asChild size="sm" className="bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 font-semibold text-xs rounded-xl">
                    <Link href={`/cases/${activeCase.id}`}>
                      View Complete Case Dashboard
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
