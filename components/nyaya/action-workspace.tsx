'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, ArrowRight, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ActionWorkspaceProps {
  actionTitle?: string;
  caseId?: string;
  onBack?: () => void;
  className?: string;
}

export function ActionWorkspace({
  actionTitle = 'Pre-Litigation Settlement Proposal',
  caseId = 'case-1',
  onBack,
  className,
}: ActionWorkspaceProps) {
  const [currentStep, setCurrentStep] = React.useState<1 | 2 | 3 | 4>(1);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          {onBack ? (
            <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : (
            <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <Link href={`/cases/${caseId}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          )}

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Action Workspace
            </span>
            <h1 className="font-display text-xl font-bold text-foreground">{actionTitle}</h1>
          </div>
        </div>

        <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-400 text-xs px-3 py-1 font-semibold w-fit">
          Step {currentStep} of 4
        </Badge>
      </div>

      {/* Progressive Step Progress */}
      <div className="grid grid-cols-4 gap-2 text-xs text-center">
        {[
          { num: 1, label: '1. Review Facts' },
          { num: 2, label: '2. Review Evidence' },
          { num: 3, label: '3. Review AI Draft' },
          { num: 4, label: '4. Confirm Action' },
        ].map((s) => (
          <button
            key={s.num}
            onClick={() => setCurrentStep(s.num as any)}
            className={cn(
              'p-2.5 rounded-xl border transition-all text-xs font-semibold',
              currentStep === s.num
                ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-300'
                : currentStep > s.num
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'border-border bg-card text-muted-foreground'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Step Content */}
      <div className="legal-card p-6 space-y-4">
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Step 1: Review Case Facts</h3>
            <p className="text-xs text-muted-foreground">
              Confirm that all key facts extracted from your natural language conversation are accurate before preparing the notice draft.
            </p>

            <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2 text-xs">
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Dispute Category:</span>
                <span className="font-semibold text-foreground">Property &amp; Tenancy</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Parties:</span>
                <span className="font-semibold text-foreground">Tenant (User) vs Landlord (Rakesh Kumar)</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Security Deposit Amount:</span>
                <span className="font-semibold text-foreground">₹50,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jurisdiction:</span>
                <span className="font-semibold text-foreground">Ghaziabad, Uttar Pradesh</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setCurrentStep(2)} className="bg-slate-900 text-slate-50 dark:bg-amber-500 dark:text-slate-950 font-semibold text-xs rounded-xl">
                <span>Confirm Facts &amp; Proceed</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Step 2: Review Supporting Evidence</h3>
            <p className="text-xs text-muted-foreground">
              Ensure supporting contracts and receipts are attached.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between">
                <span className="font-medium text-foreground">✓ Rent Agreement.pdf</span>
                <Badge className="bg-emerald-600 text-white text-[10px]">Verified</Badge>
              </div>
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between">
                <span className="font-medium text-foreground">✓ UPI Payment Receipt.pdf</span>
                <Badge className="bg-emerald-600 text-white text-[10px]">Verified</Badge>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentStep(1)} className="text-xs rounded-xl">
                Back
              </Button>
              <Button size="sm" onClick={() => setCurrentStep(3)} className="bg-slate-900 text-slate-50 dark:bg-amber-500 dark:text-slate-950 font-semibold text-xs rounded-xl">
                <span>Review AI Notice Draft</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground">Step 3: Review Pre-Litigation Notice Draft</h3>

            {/* Legal Safety Banner */}
            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-900 dark:text-amber-300 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-600" /> Statutory Disclaimer
              </span>
              <p className="leading-relaxed text-[11px]">
                AI-generated draft. Requires review by a qualified legal professional before being sent or relied upon.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/80 bg-muted/30 font-mono text-xs leading-relaxed space-y-2 max-h-64 overflow-y-auto">
              <p className="font-bold">FORMAL PRE-LITIGATION SETTLEMENT NOTICE</p>
              <p>To: Rakesh Kumar (Landlord)</p>
              <p>Subject: Demand for Refund of Unlawfully Withheld Rental Security Deposit (₹50,000)</p>
              <p>Sir/Madam,</p>
              <p>
                Take notice that under Section 108 of the Transfer of Property Act, 1882, the security deposit of ₹50,000 transferred on 12 Jan 2025 is refundable upon peaceful handover of possession on 31 Jul 2026.
              </p>
              <p>
                You are hereby called upon to refund the full amount within 15 days of receipt of this notice, failing which appropriate pre-litigation mediation or DLSA proceedings will be initiated.
              </p>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentStep(2)} className="text-xs rounded-xl">
                Back
              </Button>
              <Button size="sm" onClick={() => setCurrentStep(4)} className="bg-slate-900 text-slate-50 dark:bg-amber-500 dark:text-slate-950 font-semibold text-xs rounded-xl">
                <span>Proceed to Confirmation</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4 text-center py-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>

            <h3 className="text-base font-bold text-foreground">Action Draft Ready for Review</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              Nyaya has compiled your facts, verified evidence, and pre-litigation draft notice into your workspace. Nothing is sent automatically.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                size="sm"
                onClick={() => toast.success('Draft notice saved to your Case Package')}
                className="bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 font-semibold text-xs rounded-xl"
              >
                Save Draft to Case Package
              </Button>

              <Button asChild size="sm" variant="outline" className="text-xs rounded-xl font-semibold">
                <Link href={`/cases/${caseId}`}>
                  Return to Case Dashboard
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
