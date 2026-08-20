import React from 'react';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';

export interface EscalationData {
  reason: string;
  recommendedAuthority: string;
  nextSteps: string[];
  urgency: 'high' | 'medium' | 'low';
}

export function EscalationCard({ escalation }: { escalation: EscalationData }) {
  return (
    <div className="p-4 rounded-lg border border-purple-500 bg-purple-50 dark:bg-purple-950/20">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        <div className="w-full">
          <h3 className="font-semibold text-purple-800 dark:text-purple-300">Escalation Recommended</h3>
          <p className="text-sm mt-2 text-gray-700 dark:text-gray-300"><strong>Reason:</strong> {escalation.reason}</p>
          <p className="text-sm mt-1 text-gray-700 dark:text-gray-300"><strong>Authority:</strong> {escalation.recommendedAuthority}</p>
          
          {escalation.nextSteps && escalation.nextSteps.length > 0 && (
            <div className="mt-3">
              <span className="text-sm font-medium text-gray-900 dark:text-white">Next Steps:</span>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                {escalation.nextSteps.map((step, idx) => (
                  <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">{step}</li>
                ))}
              </ul>
            </div>
          )}
          
          <button className="mt-4 flex items-center gap-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md transition-colors">
            Initiate Escalation
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
