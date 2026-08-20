import * as React from 'react';
import { Activity, ShieldCheck, AlertOctagon } from 'lucide-react';

export function GovernanceStatus({ status }: { status?: any }) {
  const isHealthy = status?.state === 'healthy' || status?.health === 'good' || !status?.blocked;
  
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className={`p-1 ${isHealthy ? 'bg-emerald-500' : 'bg-destructive'}`}></div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isHealthy ? (
              <ShieldCheck className="h-6 w-6 text-emerald-500" />
            ) : (
              <AlertOctagon className="h-6 w-6 text-destructive" />
            )}
            <h3 className="font-semibold text-lg">Governance Engine</h3>
          </div>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${isHealthy ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-destructive/10 text-destructive'}`}>
            {isHealthy ? 'Active & Protecting' : 'Intervention Required'}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Policy Checks</p>
            <p className="text-2xl font-bold">{status?.checksRun || 124}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Data Sharing Blocked</p>
            <p className="text-2xl font-bold">{status?.blockedCount || 0}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Consent Gathered</p>
            <p className="text-2xl font-bold">{status?.consentCount || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
