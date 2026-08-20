import React from 'react';
import { CheckSquare, ShieldCheck } from 'lucide-react';

export interface ResolutionConfirmationData {
  caseId: string;
  resolutionStatus: string;
  confirmationDetails: string;
  officerAssigned?: string;
}

export function ResolutionConfirmation({ confirmation }: { confirmation: ResolutionConfirmationData }) {
  return (
    <div className="bg-green-50 dark:bg-green-900/10 p-5 rounded-lg border border-green-200 dark:border-green-800">
      <div className="flex items-start gap-3">
        <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
        <div>
          <h3 className="font-semibold text-green-800 dark:text-green-300 text-lg">Resolution Confirmed</h3>
          <p className="mt-1 text-green-700 dark:text-green-400 text-sm">
            Status: <strong>{confirmation.resolutionStatus}</strong>
          </p>
          <p className="mt-3 text-gray-700 dark:text-gray-300">
            {confirmation.confirmationDetails}
          </p>
          {confirmation.officerAssigned && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Assigned Officer: {confirmation.officerAssigned}
            </p>
          )}
          <div className="mt-4">
            <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              <CheckSquare className="h-4 w-4" />
              Acknowledge Resolution
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
