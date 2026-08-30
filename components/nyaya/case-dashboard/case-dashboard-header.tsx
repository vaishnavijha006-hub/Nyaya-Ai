'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Upload, FileDown, Calendar, MapPin, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CaseDashboardHeaderProps {
  caseId: string;
  title: string;
  category: string;
  status: 'ACTIVE' | 'ACTION_REQUIRED' | 'RESOLVED' | 'ON_HOLD';
  jurisdiction?: string;
  startedDate?: string;
  lastUpdated?: string;
  className?: string;
}

export function CaseDashboardHeader({
  caseId,
  title,
  category,
  status,
  jurisdiction = 'Ghaziabad, Uttar Pradesh',
  startedDate = '12 Aug 2026',
  lastUpdated = '14 Aug 2026',
  className,
}: CaseDashboardHeaderProps) {
  const statusBadge = React.useMemo(() => {
    switch (status) {
      case 'ACTION_REQUIRED':
        return { label: 'Action Required', class: 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-400 font-semibold' };
      case 'ACTIVE':
        return { label: 'Active', class: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 font-semibold' };
      case 'RESOLVED':
        return { label: 'Resolved', class: 'border-blue-500/40 bg-blue-500/10 text-blue-800 dark:text-blue-400 font-semibold' };
      case 'ON_HOLD':
        return { label: 'On Hold', class: 'border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-400 font-semibold' };
      default:
        return { label: 'In Intake', class: 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-400 font-semibold' };
    }
  }, [status]);

  return (
    <div className={cn('legal-card p-6 space-y-4', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider border-amber-500/30 text-amber-800 dark:text-amber-400 px-2 py-0.5">
              {category}
            </Badge>
            <Badge variant="outline" className={cn('text-[10px] uppercase tracking-wider px-2 py-0.5', statusBadge.class)}>
              {statusBadge.label}
            </Badge>
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50">
            {title}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Case Identifier: <strong className="font-mono font-semibold text-foreground">{caseId}</strong>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button asChild size="sm" className="bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 font-semibold rounded-xl text-xs shadow-sm">
            <Link href={`/chat?caseId=${caseId}`}>
              <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
              Continue Case Intake
            </Link>
          </Button>

          <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-semibold">
            <Link href={`/cases/${caseId}/documents`}>
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Upload Document
            </Link>
          </Button>
        </div>
      </div>

      {/* Case Meta Details */}
      <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground pt-1">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          <span>Jurisdiction: <strong className="text-foreground">{jurisdiction}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Started: <strong className="text-foreground">{startedDate}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Last Updated: <strong className="text-foreground">{lastUpdated}</strong></span>
        </div>
      </div>
    </div>
  );
}
