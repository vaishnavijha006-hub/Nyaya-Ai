'use client';

import * as React from 'react';
import { Network, Building2, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function SystemicActionCard({ className }: { className?: string }) {
  return (
    <div className={cn('legal-card p-5 space-y-4 text-xs', className)}>
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Systemic Action &amp; Broader Resolution Routes
          </h3>
        </div>
        <Badge variant="outline" className="text-[9px] font-bold uppercase text-amber-800 border-amber-400">
          Institutional Referral
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 rounded-xl border border-border/80 bg-card space-y-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            <span className="font-bold text-foreground">Regulatory / Consumer Authority Referral</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Submit aggregated anonymised pattern report to State Consumer Dispute Redressal Commission or Municipal Ombudsman.
          </p>
          <Button size="sm" variant="outline" onClick={() => toast.info('Generating Regulatory Referral Brief...')} className="w-full h-7 text-[11px] font-medium">
            Explore Regulatory Referral
          </Button>
        </div>

        <div className="p-3.5 rounded-xl border border-border/80 bg-card space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-purple-600" />
            <span className="font-bold text-foreground">Legal Aid (DLSA) Collective Action</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Refer cluster details to District Legal Services Authority (DLSA) for representative pre-litigation Lok Adalat mediation.
          </p>
          <Button size="sm" variant="outline" onClick={() => toast.info('Routing to DLSA Panel Advocate...')} className="w-full h-7 text-[11px] font-medium">
            Explore DLSA Collective Review
          </Button>
        </div>
      </div>
    </div>
  );
}
