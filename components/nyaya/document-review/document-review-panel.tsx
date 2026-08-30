'use client';

import * as React from 'react';
import { ShieldAlert, Download, Edit3, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DocumentReviewPanelProps {
  documentTitle?: string;
  initialContent?: string;
  onSave?: (content: string) => void;
  className?: string;
}

const DEFAULT_DRAFT = `FORMAL PRE-LITIGATION SETTLEMENT NOTICE

To: Rakesh Kumar (Landlord)
Address: Flat 402, Sunshine Apartments, Raj Nagar, Ghaziabad, UP

Subject: Demand Notice for Refund of Unlawfully Withheld Security Deposit (₹50,000)

Sir/Madam,

Take notice that under Section 108 of the Transfer of Property Act, 1882, the security deposit of ₹50,000 paid via UPI on 12 Jan 2025 is refundable upon peaceful handover of possession on 31 Jul 2026.

You are hereby called upon to refund the full amount within 15 days of receipt of this notice, failing which appropriate pre-litigation conciliation or court proceedings will be initiated.

Place: Ghaziabad
Date: 30 Aug 2026`;

export function DocumentReviewPanel({
  documentTitle = 'Pre-Litigation Settlement Notice Draft',
  initialContent = DEFAULT_DRAFT,
  onSave,
  className,
}: DocumentReviewPanelProps) {
  const [content, setContent] = React.useState(initialContent);
  const [isEditing, setIsEditing] = React.useState(false);

  return (
    <div className={cn('legal-card p-6 space-y-4', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <Badge variant="outline" className="border-purple-500/40 bg-purple-500/10 text-purple-800 dark:text-purple-300 text-[10px] uppercase font-bold">
            AI-Generated Draft
          </Badge>
          <h2 className="text-base font-bold text-foreground mt-1">{documentTitle}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing((prev) => !prev)}
            className="text-xs font-semibold rounded-xl"
          >
            <Edit3 className="h-3.5 w-3.5 mr-1.5" />
            {isEditing ? 'Preview' : 'Edit Text'}
          </Button>

          <Button
            size="sm"
            onClick={() => toast.success('Exporting PDF Draft...')}
            className="bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 font-semibold text-xs rounded-xl"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Mandatory Legal Disclaimer */}
      <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-900 dark:text-amber-300 space-y-1">
        <span className="font-bold flex items-center gap-1.5">
          <ShieldAlert className="h-4 w-4 text-amber-600" /> Mandatory Legal Review Notice
        </span>
        <p className="text-[11px] leading-relaxed">
          AI-generated draft. Review carefully and obtain qualified legal advice before filing, sending, or relying on this document.
        </p>
      </div>

      {/* Document Text Box */}
      {isEditing ? (
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          className="font-mono text-xs p-4 leading-relaxed"
        />
      ) : (
        <div className="p-5 rounded-xl border border-border/80 bg-muted/20 font-mono text-xs leading-relaxed space-y-2 whitespace-pre-wrap">
          {content}
        </div>
      )}
    </div>
  );
}
