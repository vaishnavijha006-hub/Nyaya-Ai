'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/nyaya/app-shell';
import { NyayaPath } from '@/components/nyaya/nyaya-path';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Scale, Plus, ArrowRight, FolderSearch, Calendar, MapPin, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const mockCases = [
  {
    id: 'case-1',
    title: 'Rental Security Deposit Recovery',
    category: 'Property & Rent',
    status: 'ACTION_REQUIRED',
    statusLabel: 'Action Required',
    jurisdiction: 'Ghaziabad, Uttar Pradesh',
    currentStepIndex: 3,
    activeStepLabel: 'Legal Analysis',
    updated: '14 Aug 2026',
    description: 'Landlord withheld security deposit of ₹50,000 without notice.',
  },
  {
    id: 'case-2',
    title: 'Employment Contract & Salary Claim',
    category: 'Employment',
    status: 'ACTIVE',
    statusLabel: 'Active Intake',
    jurisdiction: 'Bengaluru, Karnataka',
    currentStepIndex: 2,
    activeStepLabel: 'Evidence',
    updated: '10 Aug 2026',
    description: 'Unpaid notice pay and gratuity claim following termination.',
  },
];

export default function CasesDashboard() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8 space-y-6 bg-background">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Scale className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h1 className="font-display text-2xl font-bold text-foreground">My Cases</h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Manage your legal intake sessions, track progress, and execute next steps.
            </p>
          </div>

          <Button asChild size="sm" className="bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 font-semibold rounded-xl text-xs shrink-0">
            <Link href="/chat?new=true">
              <Plus className="mr-1.5 h-4 w-4" />
              New Case Intake
            </Link>
          </Button>
        </div>

        {/* Cases Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {mockCases.map((c) => (
            <div key={c.id} className="legal-card p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider border-amber-500/30 text-amber-800 dark:text-amber-400 px-2 py-0.5">
                      {c.category}
                    </Badge>
                    <h2 className="text-base font-bold text-foreground">{c.title}</h2>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-400 font-semibold px-2 py-0.5">
                    {c.statusLabel}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {c.description}
                </p>
              </div>

              {/* Progress Bar Snippet */}
              <div className="pt-2 border-t border-border/50 space-y-2">
                <NyayaPath currentStepIndex={c.currentStepIndex} variant="compact" />

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {c.jurisdiction}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {c.updated}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Button asChild size="sm" variant="outline" className="w-full justify-between rounded-xl text-xs font-semibold">
                  <Link href={`/cases/${c.id}`}>
                    <span>Open Case Dashboard</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
