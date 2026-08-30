'use client';

import * as React from 'react';
import { FileText, CheckCircle2, AlertCircle, Upload, Eye, FileCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export type DocumentPrepStatus =
  | 'VERIFIED'
  | 'UPLOADED'
  | 'NEEDS_REVIEW'
  | 'MISSING'
  | 'DRAFT';

export interface DocumentItem {
  id: string;
  name: string;
  whyItMatters: string;
  status: DocumentPrepStatus;
}

interface DocumentPreparationSectionProps {
  documents?: DocumentItem[];
  onUploadClick?: () => void;
  className?: string;
}

const DEFAULT_DOCS: DocumentItem[] = [
  {
    id: 'doc-1',
    name: 'Rent Agreement Contract',
    whyItMatters: 'Establishes contractual relationship, security deposit clause, and tenancy duration.',
    status: 'VERIFIED',
  },
  {
    id: 'doc-2',
    name: 'UPI Security Deposit Payment Receipt',
    whyItMatters: 'Proves transfer of ₹50,000 security deposit to landlord bank account.',
    status: 'VERIFIED',
  },
  {
    id: 'doc-3',
    name: 'Pre-Litigation Settlement Notice Draft',
    whyItMatters: 'AI-generated notice requesting deposit refund within statutory 15-day window.',
    status: 'DRAFT',
  },
  {
    id: 'doc-4',
    name: 'Aadhaar / Identity Proof',
    whyItMatters: 'Mandatory verification document for DLSA Legal Aid & court filings.',
    status: 'MISSING',
  },
];

export function DocumentPreparationSection({
  documents = DEFAULT_DOCS,
  onUploadClick,
  className,
}: DocumentPreparationSectionProps) {
  const statusBadge = (status: DocumentPrepStatus) => {
    switch (status) {
      case 'VERIFIED':
        return <Badge className="bg-emerald-600 text-white text-[10px]">✓ Verified</Badge>;
      case 'UPLOADED':
        return <Badge variant="outline" className="text-blue-700 border-blue-400 text-[10px]">Uploaded</Badge>;
      case 'DRAFT':
        return <Badge variant="outline" className="text-purple-700 border-purple-400 text-[10px]">AI Draft</Badge>;
      case 'MISSING':
        return <Badge variant="outline" className="text-red-700 border-red-400 text-[10px]">⚠ Missing</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className={cn('legal-card p-5 space-y-4', className)}>
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-slate-700 dark:text-slate-300" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Document Preparation Matrix
          </h3>
        </div>
        <Button size="sm" variant="outline" onClick={onUploadClick} className="text-xs font-semibold rounded-xl">
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          Upload Document
        </Button>
      </div>

      <div className="space-y-3">
        {documents.map((d) => (
          <div key={d.id} className="p-3.5 rounded-xl border border-border/80 bg-card space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                {d.name}
              </span>
              {statusBadge(d.status)}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Why it matters:</span> {d.whyItMatters}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
