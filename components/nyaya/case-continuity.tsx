import React from 'react';
import { Shield, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface CaseContinuityProps {
  status?: string;
  lastChecked?: string;
  attentionRequired?: boolean;
  owner?: string;
}

export function CaseContinuity({ status = 'Active', lastChecked = 'Just now', attentionRequired = false, owner = 'System' }: CaseContinuityProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="h-5 w-5 text-indigo-500" />
          Operational Continuity
        </h2>
        {attentionRequired ? (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Needs Attention
          </span>
        ) : (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Maintained
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">Current Status</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{status}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">Current Owner</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{owner}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Clock className="h-4 w-4" /> Last Continuity Check
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{lastChecked}</span>
        </div>
      </div>
    </div>
  );
}
