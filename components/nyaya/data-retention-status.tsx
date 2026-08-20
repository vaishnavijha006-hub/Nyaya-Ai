import React from 'react';
import { Shield, Clock, Info } from 'lucide-react';

interface RetentionStatus {
  category: string;
  retentionPeriod: string;
  reason: string;
  deletionDate: string;
}

interface DataRetentionStatusProps {
  statusList?: RetentionStatus[];
  retentionEvent?: any;
}

export function DataRetentionStatus({ statusList = [], retentionEvent }: DataRetentionStatusProps) {
  const defaultList = [
    { category: "Account Identity", retentionPeriod: "Active + 1 year", reason: "Service provision", deletionDate: "N/A (Active)" },
    { category: "Case Evidence", retentionPeriod: "Case Closed + 7 years", reason: "Legal Compliance", deletionDate: "2032-05-14" },
    { category: "Chat Logs", retentionPeriod: "90 days", reason: "AI Training & Debugging", deletionDate: "Rolling basis" }
  ];

  const items = statusList.length > 0 ? statusList : defaultList;

  return (
    <div className="bg-card text-card-foreground border rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-indigo-500" />
        <h3 className="font-semibold text-lg">Data Retention Status</h3>
      </div>
      
      {retentionEvent && (
        <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 p-3 rounded-lg flex gap-2 text-sm">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p>Update: {retentionEvent.message || 'Legal hold placed on case data.'}</p>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div>
              <p className="font-medium text-sm">{item.category}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Info className="w-3 h-3" /> {item.reason}
              </p>
            </div>
            <div className="mt-2 sm:mt-0 text-left sm:text-right">
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-secondary text-secondary-foreground px-2 py-1 rounded">
                <Clock className="w-3 h-3" /> {item.retentionPeriod}
              </span>
              <p className="text-xs text-muted-foreground mt-1">Est. Deletion: {item.deletionDate}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
