'use client';

import * as React from 'react';
import { CheckCircle2, User, Building, MapPin, Calendar, Edit2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface FactsSectionProps {
  caseId?: string;
  userRole?: string;
  oppositeParty?: string;
  jurisdiction?: string;
  agreementDate?: string;
  noticeDate?: string;
  disputeDate?: string;
  keyFacts?: string[];
  className?: string;
}

export function FactsSection({
  caseId = 'case-1',
  userRole = 'Tenant (User)',
  oppositeParty = 'Landlord (Rakesh Kumar)',
  jurisdiction = 'Ghaziabad, Uttar Pradesh',
  agreementDate = '12 Jan 2025',
  noticeDate = '02 Jul 2026',
  disputeDate = '01 Aug 2026',
  keyFacts = [
    'Security deposit of ₹50,000 was transferred via UPI on 12 Jan 2025.',
    'Tenancy ended formally on 31 Jul 2026 after 30-day verbal notice.',
    'Property was handed over in clean condition without damage.',
    'Landlord refused security deposit return citing unverified structural maintenance.'
  ],
  className,
}: FactsSectionProps) {
  return (
    <div className={cn('legal-card p-5 space-y-4', className)}>
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Facts & Case Details
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground">
            <Link href={`/chat?caseId=${caseId}`}>
              <MessageSquare className="mr-1 h-3.5 w-3.5" />
              View Conversation
            </Link>
          </Button>
        </div>
      </div>

      {/* Grid: Parties & Jurisdiction */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="rounded-xl border border-border/80 bg-muted/30 p-3 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <User className="h-3 w-3" /> You
          </span>
          <p className="font-semibold text-foreground">{userRole}</p>
        </div>

        <div className="rounded-xl border border-border/80 bg-muted/30 p-3 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Building className="h-3 w-3" /> Other Party
          </span>
          <p className="font-semibold text-foreground">{oppositeParty}</p>
        </div>

        <div className="rounded-xl border border-border/80 bg-muted/30 p-3 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> Jurisdiction
          </span>
          <p className="font-semibold text-foreground">{jurisdiction}</p>
        </div>
      </div>

      {/* Key Dates Timeline */}
      <div className="space-y-1.5 pt-1">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" /> Key Chronology
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="rounded-lg border border-border/60 bg-card p-2">
            <span className="text-[10px] text-muted-foreground">Agreement Started:</span>
            <p className="font-medium text-foreground">{agreementDate}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-card p-2">
            <span className="text-[10px] text-muted-foreground">Notice Given:</span>
            <p className="font-medium text-foreground">{noticeDate}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-card p-2">
            <span className="text-[10px] text-muted-foreground">Dispute Started:</span>
            <p className="font-medium text-foreground">{disputeDate}</p>
          </div>
        </div>
      </div>

      {/* Extracted Key Facts */}
      <div className="space-y-2 pt-1 border-t border-border/50">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Confirmed Facts from Conversation
        </h4>
        <ul className="space-y-1.5 text-xs">
          {keyFacts.map((fact, idx) => (
            <li key={idx} className="flex items-start gap-2 text-foreground/90 leading-relaxed">
              <span className="text-emerald-500 font-bold mt-0.5">•</span>
              <span>{fact}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
