import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

export interface LegalChecklistProps {
  checklist: {
    id: string;
    title: string;
    description: string;
    items: {
      id: string;
      label: string;
      isCompleted: boolean;
      rationale: string;
    }[];
  };
}

export function LegalChecklist({ checklist }: LegalChecklistProps) {
  if (!checklist) return null;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <h3 className="font-semibold text-gray-900 dark:text-white">{checklist.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{checklist.description}</p>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {checklist.items.map(item => (
          <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex gap-3">
            <button className="mt-0.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {item.isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5" />
              )}
            </button>
            <div>
              <p className={`text-sm font-medium ${item.isCompleted ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
                {item.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {item.rationale}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
