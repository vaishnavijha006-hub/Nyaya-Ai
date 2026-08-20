import React from 'react';

export function CaseProgress({ progress, status }: { progress: number; status: string }) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm font-medium mb-1">
        <span className="text-gray-700 dark:text-gray-300">{status}</span>
        <span className="text-gray-700 dark:text-gray-300">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
}
