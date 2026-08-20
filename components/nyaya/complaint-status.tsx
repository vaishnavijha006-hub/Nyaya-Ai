import React from 'react';
import { Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export type StatusType = 'pending' | 'submitted' | 'under_review' | 'resolved' | 'rejected';

interface ComplaintStatusProps {
  status: StatusType;
  lastUpdated: string;
  referenceNumber?: string;
  statusMessage?: string;
}

const statusConfig = {
  pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-950/50', label: 'Draft Pending' },
  submitted: { icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-950/50', label: 'Submitted' },
  under_review: { icon: Clock, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-950/50', label: 'Under Review' },
  resolved: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-950/50', label: 'Resolved' },
  rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-950/50', label: 'Rejected' },
};

export function ComplaintStatus({ status, lastUpdated, referenceNumber, statusMessage }: ComplaintStatusProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Current Status</h3>
          <div className="mt-1.5 flex items-center gap-2">
            <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold ${config.bg} ${config.color}`}>
              <Icon className="h-4 w-4" />
              {config.label}
            </span>
          </div>
        </div>
        {referenceNumber && (
          <div className="text-right">
            <h3 className="text-sm font-medium text-muted-foreground">Ref No.</h3>
            <p className="mt-1 font-mono text-sm font-semibold text-foreground">{referenceNumber}</p>
          </div>
        )}
      </div>
      
      {statusMessage && (
        <div className="rounded-lg bg-muted/50 p-3 text-sm text-foreground">
          {statusMessage}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        Last updated: {new Date(lastUpdated).toLocaleString()}
      </div>
    </div>
  );
}
