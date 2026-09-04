'use client';

import * as React from 'react';
import Link from 'next/link';
import { FileCheck, FileText, Upload, CheckCircle2, AlertTriangle, Clock, HelpCircle, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  status: 'VERIFIED' | 'UPLOADED' | 'PROCESSING' | 'NEEDS_REVIEW' | 'MISSING';
  uploadedDate?: string;
  whyItMatters?: string;
  whatYouCanDo?: string;
}

interface EvidenceDocumentsSectionProps {
  caseId?: string;
  documents?: DocumentItem[];
  className?: string;
}

const DEFAULT_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-1',
    name: 'Rent Agreement.pdf',
    type: 'Tenancy Contract',
    status: 'VERIFIED',
    uploadedDate: '12 Aug 2026',
    whyItMatters: 'Helps establish the agreed lease terms, monthly rent, and security deposit clause.',
    whatYouCanDo: 'Verified and locked in case dossier.',
  },
  {
    id: 'doc-2',
    name: 'UPI Security Deposit Transfer.pdf',
    type: 'Payment Proof',
    status: 'VERIFIED',
    uploadedDate: '12 Aug 2026',
    whyItMatters: 'Proves actual monetary transaction to landlord bank account.',
    whatYouCanDo: 'Verified and linked to claim amount.',
  },
  {
    id: 'doc-3',
    name: 'WhatsApp Eviction Notice Export.txt',
    type: 'Communication Record',
    status: 'NEEDS_REVIEW',
    uploadedDate: '13 Aug 2026',
    whyItMatters: 'Shows landlord instruction to vacate without mandatory statutory notice.',
    whatYouCanDo: 'Review timestamp to confirm 30-day notice requirement.',
  },
  {
    id: 'doc-4',
    name: 'Formal Legal Notice Copy',
    type: 'Legal Demand Notice',
    status: 'MISSING',
    whyItMatters: 'Establishes formal pre-litigation demand before tribunal or court filing.',
    whatYouCanDo: 'Generate and send a formal Legal Notice using Nyaya Document Drafter.',
  },
];

export function EvidenceDocumentsSection({
  caseId = 'case-1',
  documents = DEFAULT_DOCUMENTS,
  className,
}: EvidenceDocumentsSectionProps) {
  return (
    <div className={cn('legal-card p-5 space-y-4', className)}>
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Document Readiness &amp; Evidence Audit
          </h3>
        </div>

        <Button asChild size="sm" variant="outline" className="h-7 text-xs px-2.5 rounded-lg font-semibold">
          <Link href={`/cases/${caseId}/documents`}>
            <Upload className="mr-1 h-3.5 w-3.5" />
            Upload Document
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {documents.map((doc) => {
          let badgeInfo = {
            label: '○ Missing',
            class: 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-400 font-bold',
            icon: <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
          };

          if (doc.status === 'VERIFIED') {
            badgeInfo = {
              label: '✓ Verified',
              class: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 font-bold',
              icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
            };
          } else if (doc.status === 'UPLOADED') {
            badgeInfo = {
              label: '↑ Uploaded',
              class: 'border-blue-500/40 bg-blue-500/10 text-blue-800 dark:text-blue-400 font-semibold',
              icon: <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
            };
          } else if (doc.status === 'PROCESSING') {
            badgeInfo = {
              label: '◌ Processing',
              class: 'border-purple-500/40 bg-purple-500/10 text-purple-800 dark:text-purple-400 font-semibold',
              icon: <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400 animate-spin" />,
            };
          } else if (doc.status === 'NEEDS_REVIEW') {
            badgeInfo = {
              label: '! Needs Review',
              class: 'border-amber-600/40 bg-amber-600/10 text-amber-900 dark:text-amber-300 font-bold',
              icon: <AlertTriangle className="h-4 w-4 text-amber-600" />,
            };
          }

          return (
            <div key={doc.id} className="rounded-xl border border-border/80 bg-card p-3.5 space-y-2.5 flex flex-col justify-between shadow-2xs">
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="shrink-0 p-1.5 rounded-lg bg-muted/60">{badgeInfo.icon}</div>
                    <span className="font-bold text-foreground truncate">{doc.name}</span>
                  </div>
                  <Badge variant="outline" className={cn('text-[10px] shrink-0 px-2 py-0.5', badgeInfo.class)}>
                    {badgeInfo.label}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground pl-8">{doc.type}</p>
              </div>

              {/* Plain-Language Explanations */}
              <div className="rounded-lg bg-muted/40 p-2.5 space-y-1 border border-border/50 text-[11px]">
                <div>
                  <span className="font-semibold text-foreground">Why this matters: </span>
                  <span className="text-muted-foreground">{doc.whyItMatters}</span>
                </div>
                {doc.whatYouCanDo && (
                  <div className="pt-1 border-t border-border/40">
                    <span className="font-semibold text-amber-800 dark:text-amber-400">What you can do: </span>
                    <span className="text-slate-700 dark:text-slate-300">{doc.whatYouCanDo}</span>
                  </div>
                )}
              </div>

              {doc.uploadedDate && (
                <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                  Uploaded: {doc.uploadedDate}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
