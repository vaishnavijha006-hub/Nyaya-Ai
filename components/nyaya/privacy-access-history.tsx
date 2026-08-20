import React from 'react';
import { Activity, ShieldCheck, AlertCircle } from 'lucide-react';

interface AccessEvent {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  status: 'allowed' | 'blocked' | 'audited';
}

interface PrivacyAccessHistoryProps {
  events?: AccessEvent[];
  loggedEvent?: any;
}

export function PrivacyAccessHistory({ events = [], loggedEvent }: PrivacyAccessHistoryProps) {
  const defaultEvents: AccessEvent[] = [
    { id: '1', actor: 'System Worker', action: 'Read', target: 'Case Evidence #401', timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'allowed' },
    { id: '2', actor: 'External API (Marketing)', action: 'Read', target: 'User Profile', timestamp: new Date(Date.now() - 86400000).toISOString(), status: 'blocked' },
    { id: '3', actor: 'Pro Bono Lawyer', action: 'Access', target: 'Case Summary', timestamp: new Date(Date.now() - 172800000).toISOString(), status: 'audited' },
  ];

  const displayEvents = events.length > 0 ? events : defaultEvents;

  return (
    <div className="bg-card text-card-foreground border rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-indigo-500" />
        <h3 className="font-semibold text-lg">Privacy Access History (Audit Log)</h3>
      </div>
      
      {loggedEvent && (
        <div className="mb-4 text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 p-2 rounded">
          New access logged: {loggedEvent.message || 'Data accessed.'}
        </div>
      )}

      <div className="space-y-4">
        {displayEvents.map(event => (
          <div key={event.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border-b border-border/50 last:border-0 pb-4 last:pb-0">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {event.status === 'allowed' && <ShieldCheck className="w-4 h-4 text-green-500" />}
                {event.status === 'blocked' && <AlertCircle className="w-4 h-4 text-red-500" />}
                {event.status === 'audited' && <ShieldCheck className="w-4 h-4 text-blue-500" />}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {event.actor} <span className="text-muted-foreground font-normal">attempted</span> {event.action}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Target: {event.target}</p>
              </div>
            </div>
            <div className="mt-2 sm:mt-0 text-left sm:text-right">
              <span className={`text-xs px-2 py-1 rounded font-medium ${
                event.status === 'blocked' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                event.status === 'audited' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              }`}>
                {event.status.toUpperCase()}
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(event.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
