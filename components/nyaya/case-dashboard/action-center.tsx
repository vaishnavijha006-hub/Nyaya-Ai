'use client';

import * as React from 'react';
import { Scale, Shield, Users, Gavel, FileCheck, CheckCircle2 } from 'lucide-react';
import { ActionCard, ActionCardProps } from './action-card';
import { cn } from '@/lib/utils';

interface ActionCenterProps {
  caseId?: string;
  isEmployment?: boolean;
  className?: string;
}

export function ActionCenter({ caseId = 'case-1', isEmployment, className }: ActionCenterProps) {
  const checkEmp = isEmployment ?? (caseId === 'case-2' || caseId === 'demo-case-2' || caseId.includes('2') || caseId.toLowerCase().includes('employment'));

  const actions: ActionCardProps[] = [
    checkEmp
      ? {
          id: 'act-1',
          title: 'Prepare Statutory Salary Demand Notice',
          category: 'SETTLEMENT',
          description: 'Generate a 15-day statutory demand notice to send to employer demanding unpaid salary & notice pay before labor conciliation.',
          status: 'RECOMMENDED',
          whySuggested: [
            'Dispute is backed by offer letter & bank statement showing unpaid salary.',
            'Statutory notice gives employer formal opportunity to settle salary claim.',
            'Serves as mandatory proof for Labor Conciliation Officer.',
          ],
          primaryCtaText: 'Draft Demand Notice',
          primaryCtaHref: `/legal-notice`,
        }
      : {
          id: 'act-1',
          title: 'Prepare Pre-Litigation Settlement Notice',
          category: 'SETTLEMENT',
          description: 'Generate a 15-day statutory pre-litigation settlement proposal to send to the landlord before filing in court.',
          status: 'RECOMMENDED',
          whySuggested: [
            'Dispute is document-based with rent agreement & UPI receipt available.',
            'Pre-litigation settlement avoids costly and lengthy court proceedings.',
            'High potential for out-of-court agreement under Transfer of Property Act principles.',
          ],
          primaryCtaText: 'Explore Settlement',
          primaryCtaHref: `/cases/${caseId}/settlement`,
        },
    {
      id: 'act-2',
      title: 'Explore DLSA Free Legal Aid',
      category: 'PREPARATION',
      description: 'Check eligibility for free advocate representation under Section 12 of the Legal Services Authorities Act, 1987.',
      status: 'AVAILABLE',
      whySuggested: [
        'Free legal services are guaranteed for eligible income categories & vulnerable groups.',
        'DLSA provides advocate assignment and court fee exemptions.',
      ],
      primaryCtaText: 'Check Legal Aid',
      primaryCtaHref: `/cases/${caseId}/legal-aid`,
    },
    {
      id: 'act-3',
      title: 'Explore Lok Adalat / Labor Mediation',
      category: 'SETTLEMENT',
      description: 'Submit dispute to District Legal Services Authority (DLSA) or Labor Conciliation Officer for rapid binding conciliation.',
      status: 'AVAILABLE',
      whySuggested: [
        'Binding decree under Section 21 of LSA Act without court fees.',
        'Non-adversarial, confidential, and quick resolution.',
      ],
      primaryCtaText: 'Explore Mediation',
      primaryCtaHref: `/cases/${caseId}/adr`,
    },
    {
      id: 'act-4',
      title: 'Compile Judge-Ready Case Package',
      category: 'PREPARATION',
      description: 'Export structured court-ready PDF package containing factual chronology, evidence matrix, and annexures.',
      status: 'AVAILABLE',
      whySuggested: [
        'Organizes all 7 legal journey stages for advocate review.',
        'Accelerates court filing readiness.',
      ],
      primaryCtaText: 'Prepare Package',
      primaryCtaHref: `/cases/${caseId}/case-package`,
    },
  ];

  return (
    <div className={cn('legal-card p-5 space-y-4', className)}>
      <div className="border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
            What can you do now?
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Based on the information and documents currently available, these are the next steps Nyaya can help you prepare for.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((act) => (
          <ActionCard key={act.id} {...act} />
        ))}
      </div>
    </div>
  );
}
