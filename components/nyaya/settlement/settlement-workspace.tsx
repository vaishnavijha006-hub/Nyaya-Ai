'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ShieldAlert, Send, FileText, Clock, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SettlementWorkspaceProps {
  caseId?: string;
  className?: string;
}

export function SettlementWorkspace({ caseId = 'case-1', className }: SettlementWorkspaceProps) {
  const [amount, setAmount] = React.useState('50000');
  const [terms, setTerms] = React.useState('Full refund of security deposit within 15 days via bank transfer.');
  const [isSaved, setIsSaved] = React.useState(false);

  const steps = [
    { num: 1, label: '1. Understand Dispute', done: true },
    { num: 2, label: '2. Prepare Proposal', active: true },
    { num: 3, label: '3. Review Notice', done: false },
    { num: 4, label: '4. Send / Share', done: false },
    { num: 5, label: '5. Response', done: false },
    { num: 6, label: '6. Resolution', done: false },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
            <Link href={`/cases/${caseId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Pre-Litigation Settlement Module
              </span>
            </div>
            <h1 className="font-display text-xl font-bold text-foreground">
              Resolve Dispute Out-Of-Court
            </h1>
          </div>
        </div>

        <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-400 text-xs px-3 py-1 font-semibold w-fit">
          Status: Preparation
        </Badge>
      </div>

      {/* Settlement Stage Tracker */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
        {steps.map((st) => (
          <div
            key={st.num}
            className={cn(
              'p-2.5 rounded-xl border text-center font-semibold transition-all',
              st.active
                ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-300'
                : st.done
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'border-border/60 bg-card text-muted-foreground opacity-60'
            )}
          >
            {st.label}
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Settlement Proposal Form */}
        <div className="md:col-span-2 legal-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-foreground">Proposed Settlement Terms</h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Requested Settlement Amount (INR ₹)</label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50000"
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Settlement Payment Terms &amp; Conditions</label>
              <Textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={3}
                className="mt-1 text-xs"
              />
            </div>
          </div>

          {/* Legal Safety Banner */}
          <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-900 dark:text-amber-300 space-y-1">
            <span className="font-bold flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-600" /> Voluntary Settlement Exploration
            </span>
            <p className="text-[11px] leading-relaxed">
              This notice is an invitation for pre-litigation dialogue. It does not constitute a court order or binding judicial ruling.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              size="sm"
              onClick={() => {
                setIsSaved(true);
                toast.success('Settlement terms saved cleanly');
              }}
              className="bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 font-semibold text-xs rounded-xl"
            >
              {isSaved ? '✓ Terms Saved' : 'Save Settlement Proposal'}
            </Button>
          </div>
        </div>

        {/* Opposite Party Status Rail */}
        <div className="legal-card p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Opposite Party Response Status
          </h3>

          <div className="p-3 rounded-xl border border-border/80 bg-muted/30 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Notice Status:</span>
              <Badge variant="outline" className="text-[10px]">Draft Saved</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Opposite Party:</span>
              <span className="font-semibold text-foreground">Rakesh Kumar</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Response:</span>
              <span className="font-semibold text-amber-700 dark:text-amber-400">NOT SENT</span>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Once saved, you can review the AI-generated notice PDF and share it with your legal representative or advocate before sending.
          </p>
        </div>
      </div>
    </div>
  );
}
