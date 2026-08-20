import React from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { LegalRiskAlert } from './legal-risk-alert';
import { LegalChecklist } from './legal-checklist';
import { RiskHistory } from './risk-history';

export interface PreventionCenterProps {
  riskSignals?: any[];
  evidenceGaps?: any[];
  checklist?: any;
  history?: any;
}

export function PreventionCenter({ riskSignals = [], evidenceGaps = [], checklist, history }: PreventionCenterProps) {
  const hasActiveAlerts = riskSignals.length > 0 || evidenceGaps.length > 0;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 pb-4">
        {hasActiveAlerts ? (
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <ShieldAlert className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
        ) : (
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Legal Prevention Center</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {hasActiveAlerts 
              ? "Action needed to prevent potential legal complications." 
              : "Your legal position is currently well-protected."}
          </p>
        </div>
      </div>

      {hasActiveAlerts && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Active Alerts</h3>
          {riskSignals.map((signal, idx) => (
            <LegalRiskAlert key={`risk-${idx}`} signal={signal} />
          ))}
          {evidenceGaps.map((gap, idx) => (
            <LegalRiskAlert key={`gap-${idx}`} gap={gap} />
          ))}
        </div>
      )}

      {checklist && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Prevention Checklist</h3>
          <LegalChecklist checklist={checklist} />
        </div>
      )}

      {history && (
        <div className="space-y-4">
          <RiskHistory history={history} />
        </div>
      )}
    </div>
  );
}
