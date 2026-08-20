import React from 'react';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';

export interface RiskAlertProps {
  signal?: {
    type?: string;
    description: string;
    severity?: 'low' | 'medium' | 'high';
    actionRecommendation?: string;
  };
  gap?: {
    description: string;
    impact: string;
    suggestion: string;
  };
}

export function LegalRiskAlert({ signal, gap }: RiskAlertProps) {
  if (signal) {
    const severityColors = {
      low: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-200',
      medium: 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-200',
      high: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200'
    };
    
    const iconColors = {
      low: 'text-yellow-500',
      medium: 'text-orange-500',
      high: 'text-red-500'
    };

    const severity = signal.severity || 'medium';
    
    return (
      <div className={`p-4 rounded-lg border ${severityColors[severity]} shadow-sm flex gap-3`}>
        <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${iconColors[severity]}`} />
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
            Early Warning Signal
          </h3>
          <p className="text-sm mb-2 opacity-90">{signal.description}</p>
          {signal.actionRecommendation && (
            <div className="text-sm font-medium mt-2 p-3 bg-white/50 dark:bg-black/20 rounded flex gap-2 items-start">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{signal.actionRecommendation}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gap) {
    return (
      <div className="p-4 rounded-lg border bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-200 shadow-sm flex gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-blue-500" />
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">Evidence Suggestion</h3>
          <p className="text-sm mb-2 opacity-90">{gap.description}</p>
          <p className="text-sm opacity-90 mb-2"><strong>Context:</strong> {gap.impact}</p>
          <div className="text-sm font-medium mt-2 p-3 bg-white/50 dark:bg-black/20 rounded">
            <strong>Suggested Action:</strong> {gap.suggestion}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
