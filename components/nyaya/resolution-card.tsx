import React from 'react';

export interface Resolution {
  summary: string;
  suggestedActions: string[];
  confidence: number;
}

export function ResolutionCard({ resolution }: { resolution: Resolution }) {
  return (
    <div className="p-6 bg-green-50 border border-green-200 rounded-lg shadow dark:bg-gray-800 dark:border-green-800">
      <h5 className="mb-2 text-2xl font-bold tracking-tight text-green-900 dark:text-green-400">Resolution Detected</h5>
      <p className="mb-3 font-normal text-green-800 dark:text-green-300">{resolution.summary}</p>
      
      <div className="mt-4">
        <h6 className="font-semibold text-green-900 dark:text-green-400 mb-2">Suggested Actions:</h6>
        <ul className="list-disc list-inside text-green-800 dark:text-green-300 text-sm">
          {resolution.suggestedActions.map((action, i) => (
            <li key={i}>{action}</li>
          ))}
        </ul>
      </div>
      
      <div className="mt-4 text-sm text-green-700 dark:text-green-500">
        Confidence: {Math.round(resolution.confidence * 100)}%
      </div>
    </div>
  );
}
