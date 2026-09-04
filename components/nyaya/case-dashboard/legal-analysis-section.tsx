'use client';

import * as React from 'react';
import { Scale, BookOpen, ShieldAlert, FileText, HelpCircle, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LegalAnalysisSectionProps {
  category?: string;
  level1Plain?: string;
  level2Issues?: string[];
  level3WhyApply?: string[];
  level4Uncertainties?: string[];
  level5Law?: string[];
  className?: string;
}

export function LegalAnalysisSection({
  category = 'Tenancy & Security Deposit Dispute',
  level1Plain = 'In simple terms: Landlords cannot withhold your security deposit without providing proof of unpaid bills or actual property damage. If possession was handed back peacefully, you are legally entitled to your deposit refund.',
  level2Issues = [
    'Unlawful withholding of security deposit',
    'Breach of written tenancy agreement terms',
    'Potential wrongful lock-out or failure to give 30 days statutory notice',
  ],
  level3WhyApply = [
    'Written rent agreement explicitly states deposit is refundable within 15 days of vacate.',
    'Tenant provided UPI transaction receipt confirming initial deposit payment.',
    'No written damage assessment or invoice was delivered by landlord.',
  ],
  level4Uncertainties = [
    'Page 3 of the signed agreement is not yet uploaded to verify specific repair clause.',
    'Exact date of verbal notice to vacate needs written message confirmation.',
  ],
  level5Law = [
    'Transfer of Property Act, 1882 (Section 108 — Lessor/Lessee Rights & Liabilities)',
    'Indian Contract Act, 1872 (Section 73 — Breach of Contract & Remedies)',
    'State Urban Rent Control Act provisions regarding security deposit caps and refund deadlines',
  ],
  className,
}: LegalAnalysisSectionProps) {
  return (
    <div className={cn('legal-card p-5 space-y-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Layered Preliminary Legal Analysis
          </h3>
        </div>

        <Badge variant="outline" className="border-amber-500/30 text-amber-800 dark:text-amber-400 text-[10px] font-semibold">
          Initial AI Assessment
        </Badge>
      </div>

      {/* LEVEL 1: Plain Language Explanation */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Level 1 — Plain-Language Explanation</span>
        </div>
        <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
          {level1Plain}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* LEVEL 2: Possible Legal Issues */}
        <div className="rounded-xl border border-border/80 bg-card p-3 space-y-1.5">
          <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-amber-800 dark:text-amber-400">
            Level 2 — Possible Legal Issues
          </h4>
          <ul className="space-y-1 text-muted-foreground list-disc list-inside text-[11px]">
            {level2Issues.map((item, idx) => (
              <li key={idx} className="leading-snug">{item}</li>
            ))}
          </ul>
        </div>

        {/* LEVEL 3: Why They May Apply */}
        <div className="rounded-xl border border-border/80 bg-card p-3 space-y-1.5">
          <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Level 3 — Why They May Apply
          </h4>
          <ul className="space-y-1 text-muted-foreground list-disc list-inside text-[11px]">
            {level3WhyApply.map((item, idx) => (
              <li key={idx} className="leading-snug">{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* LEVEL 4: What Is Still Uncertain */}
      <div className="rounded-xl border border-amber-500/20 bg-muted/40 p-3 space-y-1.5 text-xs">
        <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
          <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
          Level 4 — What Is Still Uncertain
        </h4>
        <ul className="space-y-1 text-muted-foreground list-disc list-inside text-[11px]">
          {level4Uncertainties.map((item, idx) => (
            <li key={idx} className="leading-snug">{item}</li>
          ))}
        </ul>
      </div>

      {/* LEVEL 5: Relevant Law & Sources */}
      <div className="rounded-xl border border-border/80 bg-card p-3 space-y-1.5 text-xs">
        <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          Level 5 — Potentially Applicable Law &amp; Statutory Provisions
        </h4>
        <div className="space-y-1 text-[11px]">
          {level5Law.map((act, idx) => (
            <div key={idx} className="flex items-start gap-2 text-foreground/90">
              <span className="text-amber-600 font-bold">•</span>
              <span>{act}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Legal Safety Disclaimer */}
      <div className="flex items-center gap-2 rounded-xl bg-muted/60 p-2.5 text-[11px] text-muted-foreground border border-border/40">
        <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
        <span>
          <strong>Preliminary AI Analysis Disclaimer:</strong> This assessment is generated for informational and organizational assistance based on current inputs. Always verify with a qualified advocate before taking formal legal steps.
        </span>
      </div>
    </div>
  );
}
