'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, CheckCircle2, Building2, Phone, MapPin, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LegalAidWorkspaceProps {
  caseId?: string;
  className?: string;
}

export function LegalAidWorkspace({ caseId = 'case-1', className }: LegalAidWorkspaceProps) {
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
              <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Government Legal Aid (DLSA / NALSA)
              </span>
            </div>
            <h1 className="font-display text-xl font-bold text-foreground">
              Section 12 Legal Aid Eligibility
            </h1>
          </div>
        </div>

        <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 text-xs px-3 py-1 font-semibold w-fit">
          Potentially Eligible
        </Badge>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 legal-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-foreground">Section 12 Statutory Assessment</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Under Section 12 of the Legal Services Authorities Act, 1987, free legal representation &amp; court fee waiver are guaranteed for:
          </p>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Annual income below statutory limit (₹3,00,000 in UP / Delhi)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Women, children, and senior citizens</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Industrial workmen &amp; unorganized sector labor</span>
            </div>
          </div>

          <div className="pt-2 border-t border-border/50 space-y-2">
            <h3 className="text-xs font-bold text-foreground">Required Documents for Application</h3>
            <ul className="text-xs text-muted-foreground space-y-1 pl-4 list-disc">
              <li>Aadhaar Card or Voter ID</li>
              <li>Income Certificate / Salary Slip / Ration Card</li>
              <li>Case statement / Rent agreement copy</li>
            </ul>
          </div>
        </div>

        {/* DLSA Contact Rail */}
        <div className="legal-card p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Nearest DLSA Office
          </h3>

          <div className="space-y-2 text-xs">
            <p className="font-bold text-foreground">District Legal Services Authority (DLSA), Ghaziabad</p>
            <p className="text-muted-foreground flex items-start gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
              District Court Complex, Raj Nagar, Ghaziabad, UP - 201002
            </p>
            <p className="text-muted-foreground flex items-center gap-1">
              <Phone className="h-3.5 w-3.5 text-slate-500" />
              NALSA National Helpline: 15100 (Toll-Free)
            </p>
            <a
              href="https://nalsa.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-1 text-[11px]"
            >
              <Globe className="h-3.5 w-3.5" />
              https://nalsa.gov.in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
