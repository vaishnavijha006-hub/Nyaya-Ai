'use client';

import * as React from 'react';
import Link from 'next/link';
import { FileCheck, FileText, Upload, Check, AlertTriangle, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  status: 'VERIFIED' | 'UPLOADED' | 'NEEDS_REVIEW' | 'MISSING';
  uploadedDate?: string;
  whyNeeded?: string;
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
    type: 'Legal Contract',
    status: 'VERIFIED',
    uploadedDate: '12 Aug 2026',
  },
  {
    id: 'doc-2',
    name: 'UPI Deposit Receipt.pdf',
    type: 'Payment Proof',
    status: 'VERIFIED',
    uploadedDate: '12 Aug 2026',
  },
  {
    id: 'doc-3',
    name: 'WhatsApp Chat Export.txt',
    type: 'Communication Record',
    status: 'UPLOADED',
    uploadedDate: '13 Aug 2026',
    whyNeeded: 'Contains landlord acknowledgement of deposit amount.',
  },
  {
    id: 'doc-4',
    name: 'Formal Legal Notice',
    type: 'Legal Notice',
    status: 'MISSING',
    whyNeeded: 'Required before initiating formal recovery or court filing.',
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
            Evidence & Documents
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
          let badgeClass = 'border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300';
          let icon = <FileText className="h-4 w-4 text-muted-foreground" />;

          if (doc.status === 'VERIFIED') {
            badgeClass = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 font-semibold';
            icon = <Check className="h-4 w-4 text-emerald-600" />;
          } else if (doc.status === 'UPLOADED') {
            badgeClass = 'border-blue-500/40 bg-blue-500/10 text-blue-800 dark:text-blue-400 font-semibold';
            icon = <FileText className="h-4 w-4 text-blue-600" />;
          } else if (doc.status === 'MISSING') {
            badgeClass = 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-400 font-semibold';
            icon = <AlertTriangle className="h-4 w-4 text-amber-600" />;
          }

          return (
            <div key={doc.id} className="rounded-xl border border-border/80 bg-card p-3.5 space-y-2 flex flex-col justify-between shadow-2xs">
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="shrink-0 p-1.5 rounded-lg bg-muted/60">{icon}</div>
                    <span className="font-semibold text-foreground truncate">{doc.name}</span>
                  </div>
                  <Badge variant="outline" className={cn('text-[10px] uppercase tracking-wider shrink-0 px-2 py-0.5', badgeClass)}>
                    {doc.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground pl-8">{doc.type}</p>
              </div>

              {doc.whyNeeded && (
                <div className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-lg border border-border/50 space-y-0.5">
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <HelpCircle className="h-3 w-3 text-amber-600" /> Why needed:
                  </span>
                  <p className="leading-relaxed">{doc.whyNeeded}</p>
                </div>
              )}

              {doc.uploadedDate && (
                <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                  Uploaded on {doc.uploadedDate}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
