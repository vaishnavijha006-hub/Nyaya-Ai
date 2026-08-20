import * as React from 'react';
import { ShieldAlert, CheckCircle, XCircle } from 'lucide-react';

export function ConsentCenter({ data, onConsent }: { data: any; onConsent?: (granted: boolean) => void }) {
  if (!data) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20">
      <div className="flex items-center gap-3 border-b border-amber-100 pb-4 dark:border-amber-900/50">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
          <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="font-semibold text-amber-900 dark:text-amber-100">Consent Required</h3>
          <p className="text-sm text-amber-700 dark:text-amber-400">
            {data.message || 'We need your consent to process or share this data.'}
          </p>
        </div>
      </div>
      
      <div className="mt-4 space-y-4">
        <div className="rounded-lg bg-white/60 p-4 text-sm dark:bg-black/20">
          <p className="mb-2"><strong>Purpose:</strong> {data.purpose || 'Legal and compliance processing'}</p>
          {data.details && <p className="text-muted-foreground">{data.details}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={() => onConsent?.(false)}
            className="inline-flex items-center justify-center rounded-md border border-amber-200 bg-white px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 hover:text-amber-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 disabled:pointer-events-none disabled:opacity-50 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Decline
          </button>
          <button
            onClick={() => onConsent?.(true)}
            className="inline-flex items-center justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 disabled:pointer-events-none disabled:opacity-50 dark:bg-amber-700 dark:hover:bg-amber-600"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Grant Consent
          </button>
        </div>
      </div>
    </div>
  );
}
