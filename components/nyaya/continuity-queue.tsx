import React from 'react';
import { AlertCircle, ArrowRight, UserPlus } from 'lucide-react';

interface CaseItem {
  id: string;
  title: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

interface ContinuityQueueProps {
  cases: CaseItem[];
}

export function ContinuityQueue({ cases = [] }: ContinuityQueueProps) {
  if (cases.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Continuity Queue</h2>
        <p className="text-gray-500 dark:text-gray-400">No cases currently require human intervention.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          Continuity Queue
        </h2>
        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-red-900 dark:text-red-300">
          {cases.length} Action{cases.length !== 1 ? 's' : ''} Needed
        </span>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Cases prioritizing human review due to continuity risks.</p>

      <div className="space-y-3">
        {cases.map((c) => (
          <div key={c.id} className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 dark:bg-gray-800/50">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900 dark:text-white">{c.id}</span>
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                  c.priority === 'high' ? 'bg-red-100 text-red-700' :
                  c.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {c.priority} priority
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">{c.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{c.reason}</p>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Take Ownership">
                <UserPlus className="h-4 w-4" />
              </button>
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                Review <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
