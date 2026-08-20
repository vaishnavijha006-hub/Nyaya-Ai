import * as React from 'react';
import { History, Shield, Lock } from 'lucide-react';

export function DataSharingHistory({ history }: { history?: any[] }) {
  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center bg-muted/20">
        <Shield className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <h3 className="font-semibold text-lg">No Data Sharing History</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Your sensitive legal data has not been shared with any external parties or authorities.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6 border-b">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <h3 className="font-semibold leading-none tracking-tight">Data Sharing History</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          A transparent log of when and where your data was shared.
        </p>
      </div>
      <div className="p-0">
        <ul className="divide-y">
          {history.map((event, i) => (
            <li key={i} className="p-4 hover:bg-muted/30 transition-colors flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Lock className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">{event.target || 'External Authority'}</p>
                <p className="text-sm text-muted-foreground">{event.purpose || 'Legal processing'}</p>
                <div className="text-xs text-muted-foreground/70 flex gap-2">
                  <span>{new Date(event.timestamp || Date.now()).toLocaleString()}</span>
                  <span>•</span>
                  <span>{event.status === 'blocked' ? 'Blocked by Engine' : 'Shared'}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
